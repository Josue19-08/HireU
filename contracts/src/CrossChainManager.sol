// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IAvalancheICM.sol";

/**
 * @title CrossChainManager
 * @dev Centralized manager for cross-chain operations in OFFER-HUB
 * @notice Integrates with Avalanche ICM and Teleporter for communication between L1s
 */
contract CrossChainManager is Ownable, ReentrancyGuard {
    // Avalanche Chain IDs
    bytes32 public constant C_CHAIN_ID = bytes32(uint256(43114)); // Mainnet C-Chain
    bytes32 public constant X_CHAIN_ID = bytes32(uint256(2)); // X-Chain
    bytes32 public constant P_CHAIN_ID = bytes32(uint256(0)); // P-Chain
    bytes32 public constant FUJI_C_CHAIN_ID = bytes32(uint256(43113)); // Fuji Testnet C-Chain

    // References to messaging contracts
    IAvalancheICM public icm;
    IAvalancheTeleporter public teleporter;

    // Mapping from chainId to address of the corresponding contract on that chain
    mapping(bytes32 => address) public chainContracts;

    // Mapping from messageHash to CrossChainOperation
    mapping(bytes32 => CrossChainOperation) public operations;

    // Counter for cross-chain operations
    uint256 public operationCounter;

    enum OperationType {
        ProjectCreation,
        PaymentInitiation,
        PaymentRelease,
        ProjectCompletion,
        UserRegistration
    }

    enum OperationStatus {
        Pending,
        Sent,
        Received,
        Completed,
        Failed
    }

    struct CrossChainOperation {
        uint256 operationId;
        OperationType operationType;
        bytes32 sourceChainId;
        bytes32 destinationChainId;
        address sourceAddress;
        address destinationAddress;
        bytes32 messageHash;
        bytes payload;
        OperationStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    // Events
    event CrossChainOperationInitiated(
        uint256 indexed operationId,
        OperationType operationType,
        bytes32 sourceChainId,
        bytes32 destinationChainId,
        bytes32 messageHash
    );

    event CrossChainOperationReceived(
        uint256 indexed operationId,
        bytes32 sourceChainId,
        address sourceAddress
    );

    event CrossChainOperationCompleted(
        uint256 indexed operationId,
        OperationStatus status
    );

    event ChainContractRegistered(
        bytes32 indexed chainId,
        address contractAddress
    );

    modifier onlyRegisteredChain(bytes32 _chainId) {
        require(
            chainContracts[_chainId] != address(0),
            "CrossChainManager: Chain not registered"
        );
        _;
    }

    constructor(address _icm, address _teleporter) Ownable(msg.sender) {
        icm = IAvalancheICM(_icm);
        teleporter = IAvalancheTeleporter(_teleporter);
    }

    /**
     * @dev Registers a contract on another blockchain
     * @param _chainId Blockchain ID
     * @param _contractAddress Contract address on that blockchain
     */
    function registerChainContract(
        bytes32 _chainId,
        address _contractAddress
    ) external onlyOwner {
        require(
            _contractAddress != address(0),
            "CrossChainManager: Invalid contract address"
        );
        chainContracts[_chainId] = _contractAddress;
        emit ChainContractRegistered(_chainId, _contractAddress);
    }

    /**
     * @dev Initiates an operation cross-chain
     * @param _operationType Operation type
     * @param _destinationChainId Destination blockchain ID
     * @param _payload Encoded data to send
     * @param _gasLimit Gas limit for execution at destination
     * @return uint256 Operation ID
     * @return bytes32 Sent message hash
     */
    function initiateCrossChainOperation(
        OperationType _operationType,
        bytes32 _destinationChainId,
        bytes calldata _payload,
        uint256 _gasLimit
    )
        external
        payable
        nonReentrant
        onlyRegisteredChain(_destinationChainId)
        returns (uint256, bytes32)
    {
        address destinationContract = chainContracts[_destinationChainId];
        require(
            destinationContract != address(0),
            "CrossChainManager: Destination contract not registered"
        );

        operationCounter++;
        bytes32 currentChainId = getCurrentChainId();

        // Intentar enviar usando ICM first, luego Teleporter
        bytes32 messageHash;
        try icm.sendMessage{value: msg.value}(
            _destinationChainId,
            destinationContract,
            _payload,
            _gasLimit
        ) returns (bytes32 _hash) {
            messageHash = _hash;
        } catch {
            // If ICM fails, try with Teleporter
            messageHash = teleporter.sendCrossChainMessage{value: msg.value}(
                _destinationChainId,
                destinationContract,
                "",
                _gasLimit,
                new address[](0),
                _payload
            );
        }

        operations[messageHash] = CrossChainOperation({
            operationId: operationCounter,
            operationType: _operationType,
            sourceChainId: currentChainId,
            destinationChainId: _destinationChainId,
            sourceAddress: msg.sender,
            destinationAddress: destinationContract,
            messageHash: messageHash,
            payload: _payload,
            status: OperationStatus.Sent,
            createdAt: block.timestamp,
            completedAt: 0
        });

        emit CrossChainOperationInitiated(
            operationCounter,
            _operationType,
            currentChainId,
            _destinationChainId,
            messageHash
        );

        return (operationCounter, messageHash);
    }

    /**
     * @dev Receives an operation cross-chain
     * @param _sourceChainId Source blockchain ID
     * @param _sourceAddress Source contract address
     * @param _payload Received data
     */
    function receiveCrossChainOperation(
        bytes32 _sourceChainId,
        address _sourceAddress,
        bytes calldata _payload
    ) external nonReentrant {
        require(
            chainContracts[_sourceChainId] == _sourceAddress,
            "CrossChainManager: Unauthorized source"
        );

        // Search for the operation corresponding
        bytes32 messageHash = keccak256(
            abi.encodePacked(_sourceChainId, _sourceAddress, _payload)
        );

        CrossChainOperation storage operation = operations[messageHash];
        require(
            operation.status == OperationStatus.Sent ||
                operation.status == OperationStatus.Pending,
            "CrossChainManager: Operation already processed"
        );

        operation.status = OperationStatus.Received;

        emit CrossChainOperationReceived(
            operation.operationId,
            _sourceChainId,
            _sourceAddress
        );
    }

    /**
     * @dev Marks an operation como completeda
     * @param _messageHash Message hash
     */
    function completeOperation(bytes32 _messageHash) external {
        CrossChainOperation storage operation = operations[_messageHash];
        require(
            operation.status == OperationStatus.Received,
            "CrossChainManager: Operation not in received status"
        );

        operation.status = OperationStatus.Completed;
        operation.completedAt = block.timestamp;

        emit CrossChainOperationCompleted(
            operation.operationId,
            OperationStatus.Completed
        );
    }

    /**
     * @dev Marks an operation as failed
     * @param _messageHash Message hash
     */
    function failOperation(bytes32 _messageHash) external onlyOwner {
        CrossChainOperation storage operation = operations[_messageHash];
        operation.status = OperationStatus.Failed;
        operation.completedAt = block.timestamp;

        emit CrossChainOperationCompleted(
            operation.operationId,
            OperationStatus.Failed
        );
    }

    /**
     * @dev Gets the Blockchain ID actual
     * @return bytes32 Blockchain ID actual
     */
    function getCurrentChainId() public view returns (bytes32) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return bytes32(chainId);
    }

    /**
     * @dev Gets an operation cross-chain
     * @param _messageHash Message hash
     * @return CrossChainOperation complete operation
     */
    function getOperation(bytes32 _messageHash)
        external
        view
        returns (CrossChainOperation memory)
    {
        return operations[_messageHash];
    }

    /**
     * @dev Updates the address of the contract ICM
     * @param _icm New address of the contract ICM
     */
    function setICM(address _icm) external onlyOwner {
        require(_icm != address(0), "CrossChainManager: Invalid ICM address");
        icm = IAvalancheICM(_icm);
    }

    /**
     * @dev Updates the address of the contract Teleporter
     * @param _teleporter New address of the contract Teleporter
     */
    function setTeleporter(address _teleporter) external onlyOwner {
        require(
            _teleporter != address(0),
            "CrossChainManager: Invalid Teleporter address"
        );
        teleporter = IAvalancheTeleporter(_teleporter);
    }

    // Function to receive AVAX
    receive() external payable {}
}

