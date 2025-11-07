// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./EscrowPayment.sol";
import "./CrossChainManager.sol";

/**
 * @title CrossChainEscrow
 * @dev Extends EscrowPayment with cross-chain capabilities
 * @notice Allows performing escrow payments between different Avalanche blockchains
 */
contract CrossChainEscrow is EscrowPayment {
    CrossChainManager public crossChainManager;

    // Mapping from paymentId to information cross-chain
    mapping(uint256 => CrossChainPaymentInfo) public crossChainPayments;

    // Mapping from crossChainPaymentId to paymentId local
    mapping(bytes32 => uint256) public crossChainToLocalPayment;

    struct CrossChainPaymentInfo {
        bytes32 sourceChainId;
        bytes32 destinationChainId;
        address sourceClient;
        address destinationFreelancer;
        bytes32 crossChainPaymentId;
        bool isCrossChain;
        uint256 crossChainOperationId;
        bool paymentReleased;
    }

    // Events
    event CrossChainPaymentInitiated(
        uint256 indexed paymentId,
        bytes32 indexed crossChainPaymentId,
        bytes32 sourceChainId,
        bytes32 destinationChainId,
        uint256 amount
    );

    event CrossChainPaymentReceived(
        uint256 indexed paymentId,
        bytes32 indexed crossChainPaymentId,
        bytes32 sourceChainId,
        uint256 amount
    );

    event CrossChainPaymentReleased(
        uint256 indexed paymentId,
        bytes32 indexed crossChainPaymentId,
        bytes32 destinationChainId
    );

    modifier onlyCrossChainManager() {
        require(
            msg.sender == address(crossChainManager),
            "CrossChainEscrow: Only cross-chain manager can call"
        );
        _;
    }

    constructor(
        address _projectManager,
        address _userStatistics,
        address _crossChainManager
    ) EscrowPayment(_projectManager, _userStatistics) {
        require(
            _crossChainManager != address(0),
            "CrossChainEscrow: Invalid cross-chain manager"
        );
        crossChainManager = CrossChainManager(payable(_crossChainManager));
    }

    /**
     * @dev Creates a payment cross-chain on another blockchain of Avalanche
     * @param _projectId Project ID
     * @param _token Token address (address(0) for AVAX)
     * @param _amount Amount to deposit
     * @param _destinationChainId Destination blockchain ID
     * @param _gasLimit Gas limit for execution at destination
     * @return uint256 Payment ID local created
     * @return bytes32 Payment ID cross-chain
     */
    function createCrossChainPayment(
        uint256 _projectId,
        address _token,
        uint256 _amount,
        bytes32 _destinationChainId,
        uint256 _gasLimit
    ) external payable returns (uint256, bytes32) {
        // Create local payment first using inherited function
        require(_amount > 0, "EscrowPayment: Amount must be greater than 0");
        
        // Verify that the project exists and is in status correct
        ProjectManager.Project memory project = projectManager.getProject(_projectId);
        require(
            project.status == ProjectManager.ProjectStatus.InProgress ||
            project.status == ProjectManager.ProjectStatus.Published,
            "EscrowPayment: Invalid project status"
        );
        require(
            project.client == msg.sender,
            "EscrowPayment: Only client can create payment"
        );
        require(
            project.freelancer != address(0),
            "EscrowPayment: Freelancer must be assigned"
        );
        require(
            projectPayments[_projectId] == 0,
            "EscrowPayment: Payment already exists for this project"
        );

        paymentCounter++;
        
        payments[paymentCounter] = Payment({
            paymentId: paymentCounter,
            projectId: _projectId,
            client: msg.sender,
            freelancer: project.freelancer,
            token: _token,
            amount: _amount,
            fundedAt: 0,
            releasedAt: 0,
            status: PaymentStatus.Pending,
            workHash: ""
        });

        projectPayments[_projectId] = paymentCounter;
        
        uint256 localPaymentId = paymentCounter;

        // If it is AVAX, receive the payment directly
        if (_token == address(0)) {
            require(msg.value >= _amount, "EscrowPayment: AVAX amount mismatch");
            payments[localPaymentId].status = PaymentStatus.Funded;
            payments[localPaymentId].fundedAt = block.timestamp;
        }

        // Generate unique ID cross-chain
        bytes32 crossChainPaymentId = keccak256(
            abi.encodePacked(
                block.chainid,
                localPaymentId,
                _projectId,
                msg.sender,
                block.timestamp
            )
        );

        Payment memory payment = payments[localPaymentId];

        // Prepare payload to send to the destination blockchain
        bytes memory payload = abi.encode(
            localPaymentId,
            _projectId,
            payment.client,
            payment.freelancer,
            _token,
            _amount,
            crossChainPaymentId
        );

        // Initiate operation cross-chain
        (uint256 operationId, ) = crossChainManager.initiateCrossChainOperation{
            value: msg.value
        }(
            CrossChainManager.OperationType.PaymentInitiation,
            _destinationChainId,
            payload,
            _gasLimit
        );

        // Save information cross-chain
        crossChainPayments[localPaymentId] = CrossChainPaymentInfo({
            sourceChainId: bytes32(uint256(block.chainid)),
            destinationChainId: _destinationChainId,
            sourceClient: payment.client,
            destinationFreelancer: payment.freelancer,
            crossChainPaymentId: crossChainPaymentId,
            isCrossChain: true,
            crossChainOperationId: operationId,
            paymentReleased: false
        });

        crossChainToLocalPayment[crossChainPaymentId] = localPaymentId;

        emit CrossChainPaymentInitiated(
            localPaymentId,
            crossChainPaymentId,
            bytes32(uint256(block.chainid)),
            _destinationChainId,
            _amount
        );

        return (localPaymentId, crossChainPaymentId);
    }

    /**
     * @dev Receives a cross-chain payment from another blockchain
     * @param _sourceChainId Source blockchain ID
     * @param _sourceClient Client address en la Source blockchain
     * @param _projectId Project ID
     * @param _freelancer Freelancer address
     * @param _token Token address (address(0) for AVAX)
     * @param _amount Payment amount
     * @param _crossChainPaymentId Unique payment ID cross-chain
     * @return uint256 Payment ID local created
     */
    function receiveCrossChainPayment(
        bytes32 _sourceChainId,
        address _sourceClient,
        uint256 _projectId,
        address _freelancer,
        address _token,
        uint256 _amount,
        bytes32 _crossChainPaymentId
    ) external onlyCrossChainManager returns (uint256) {
        // Verify that the cross-chain payment does not already exist
        require(
            crossChainToLocalPayment[_crossChainPaymentId] == 0,
            "CrossChainEscrow: Payment already received"
        );

        // Create local payment
        // Note: In production, this should verify that the project exists
        paymentCounter++;

        payments[paymentCounter] = Payment({
            paymentId: paymentCounter,
            projectId: _projectId,
            client: address(crossChainManager), // Proxy for the original client
            freelancer: _freelancer,
            token: _token,
            amount: _amount,
            fundedAt: block.timestamp,
            releasedAt: 0,
            status: PaymentStatus.Funded,
            workHash: ""
        });

        projectPayments[_projectId] = paymentCounter;

        // Save information cross-chain
        crossChainPayments[paymentCounter] = CrossChainPaymentInfo({
            sourceChainId: _sourceChainId,
            destinationChainId: bytes32(uint256(block.chainid)),
            sourceClient: _sourceClient,
            destinationFreelancer: _freelancer,
            crossChainPaymentId: _crossChainPaymentId,
            isCrossChain: true,
            crossChainOperationId: 0,
            paymentReleased: false
        });

        crossChainToLocalPayment[_crossChainPaymentId] = paymentCounter;

        emit PaymentCreated(
            paymentCounter,
            _projectId,
            address(crossChainManager),
            _freelancer,
            _amount
        );

        emit PaymentFunded(paymentCounter, address(crossChainManager), _amount);

        emit CrossChainPaymentReceived(
            paymentCounter,
            _crossChainPaymentId,
            _sourceChainId,
            _amount
        );

        return paymentCounter;
    }

    /**
     * @dev Releases a cross-chain payment
     * @param _paymentId Payment ID local
     * @param _workHash IPFS hash of the work completedo
     * @param _rating Work rating (1-5)
     * @param _destinationChainId Destination blockchain ID to notify
     * @param _gasLimit Gas limit for execution at destination
     */
    function releaseCrossChainPayment(
        uint256 _paymentId,
        string memory _workHash,
        uint256 _rating,
        bytes32 _destinationChainId,
        uint256 _gasLimit
    ) external payable {
        require(
            crossChainPayments[_paymentId].isCrossChain,
            "CrossChainEscrow: Not a cross-chain payment"
        );
        require(
            !crossChainPayments[_paymentId].paymentReleased,
            "CrossChainEscrow: Payment already released"
        );

        // Release local payment using inherited logic
        Payment storage payment = payments[_paymentId];
        require(
            payment.status == PaymentStatus.Funded,
            "EscrowPayment: Payment must be funded"
        );
        require(
            projectManager.getProject(payment.projectId).status ==
                ProjectManager.ProjectStatus.Completed,
            "EscrowPayment: Project must be completed"
        );

        uint256 fee = (payment.amount * platformFee) / 10000;
        uint256 freelancerAmount = payment.amount - fee;

        // Transferir fondos
        if (payment.token == address(0)) {
            // AVAX
            (bool successFee, ) = feeRecipient.call{value: fee}("");
            (bool successFreelancer, ) = payment.freelancer.call{value: freelancerAmount}("");
            require(successFee && successFreelancer, "EscrowPayment: Transfer failed");
        } else {
            // ERC20
            IERC20 token = IERC20(payment.token);
            require(token.transfer(feeRecipient, fee), "EscrowPayment: Fee transfer failed");
            require(
                token.transfer(payment.freelancer, freelancerAmount),
                "EscrowPayment: Freelancer transfer failed"
            );
        }

        payment.status = PaymentStatus.Released;
        payment.releasedAt = block.timestamp;
        payment.workHash = _workHash;

        // Register work in UserStatistics
        userStatistics.recordWork(
            payment.freelancer,
            payment.projectId,
            payment.client,
            freelancerAmount,
            _workHash,
            _rating
        );

        // Mark as released cross-chain
        crossChainPayments[_paymentId].paymentReleased = true;

        // Notify the source blockchain
        bytes memory payload = abi.encode(
            crossChainPayments[_paymentId].crossChainPaymentId,
            _paymentId,
            _workHash,
            _rating,
            block.timestamp
        );

        crossChainManager.initiateCrossChainOperation{value: msg.value}(
            CrossChainManager.OperationType.PaymentRelease,
            _destinationChainId,
            payload,
            _gasLimit
        );

        emit CrossChainPaymentReleased(
            _paymentId,
            crossChainPayments[_paymentId].crossChainPaymentId,
            _destinationChainId
        );
    }

    /**
     * @dev Gets cross-chain information of a payment
     * @param _paymentId Payment ID local
     * @return CrossChainPaymentInfo cross-chain information
     */
    function getCrossChainPaymentInfo(uint256 _paymentId)
        external
        view
        returns (CrossChainPaymentInfo memory)
    {
        return crossChainPayments[_paymentId];
    }

    /**
     * @dev Checks if a payment is cross-chain
     * @param _paymentId Payment ID
     * @return bool true si is cross-chain
     */
    function isCrossChainPayment(uint256 _paymentId)
        external
        view
        returns (bool)
    {
        return crossChainPayments[_paymentId].isCrossChain;
    }
}

