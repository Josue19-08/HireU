// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAvalancheICM
 * @dev Interface for Avalanche Inter-Chain Message (ICM) Protocol
 * @notice Allows communication cross-chain between different L1s of Avalanche
 */
interface IAvalancheICM {
    /**
     * @dev Sends a cross-chain message to another blockchain of Avalanche
     * @param _destinationChainId Destination blockchain ID (C-Chain, X-Chain, P-Chain, etc)
     * @param _destinationAddress Destination contract address
     * @param _payload Encoded data to send
     * @param _gasLimit Gas limit for execution at destination
     * @return bytes32 Sent message hash
     */
    function sendMessage(
        bytes32 _destinationChainId,
        address _destinationAddress,
        bytes calldata _payload,
        uint256 _gasLimit
    ) external payable returns (bytes32);

    /**
     * @dev Receives a message cross-chain
     * @param _sourceChainId Source blockchain ID
     * @param _sourceAddress Source contract address
     * @param _payload Received data
     */
    function receiveMessage(
        bytes32 _sourceChainId,
        address _sourceAddress,
        bytes calldata _payload
    ) external;

    /**
     * @dev Checks if a message was processed
     * @param _messageHash Message hash
     * @return bool true if the message was processed
     */
    function isMessageProcessed(bytes32 _messageHash) external view returns (bool);

    /**
     * @dev Gets the status of a message
     * @param _messageHash Message hash
     * @return bool true if the message was processed exitosamente
     */
    function getMessageStatus(bytes32 _messageHash) external view returns (bool);
}

/**
 * @title IAvalancheTeleporter
 * @dev Alternative interface for Teleporter (messaging system cross-chain of Avalanche)
 */
interface IAvalancheTeleporter {
    /**
     * @dev Sends a message using Teleporter
     * @param _destinationBlockchainID Destination blockchain ID
     * @param _destinationAddress Destination contract address
     * @param _feeInfo Fee information
     * @param _requiredGasLimit Required gas limit
     * @param _allowedRelayerAddresses Allowed relayer addresses
     * @param _message Message data
     * @return bytes32 Sent message ID
     */
    function sendCrossChainMessage(
        bytes32 _destinationBlockchainID,
        address _destinationAddress,
        bytes calldata _feeInfo,
        uint256 _requiredGasLimit,
        address[] calldata _allowedRelayerAddresses,
        bytes calldata _message
    ) external payable returns (bytes32);

    /**
     * @dev Receives a message cross-chain
     * @param _sourceBlockchainID Source blockchain ID
     * @param _originSenderAddress Original sender address
     * @param _message Message data
     */
    function receiveCrossChainMessage(
        bytes32 _sourceBlockchainID,
        address _originSenderAddress,
        bytes calldata _message
    ) external;
}

