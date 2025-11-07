// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAvalancheICM.sol";

/**
 * @title MockTeleporter
 * @dev Mock implementation de IAvalancheTeleporter for testing
 */
contract MockTeleporter is IAvalancheTeleporter {
    mapping(bytes32 => bool) private processedMessages;

    event CrossChainMessageSent(
        bytes32 indexed messageID,
        bytes32 destinationBlockchainID,
        address destinationAddress,
        bytes message
    );

    function sendCrossChainMessage(
        bytes32 _destinationBlockchainID,
        address _destinationAddress,
        bytes calldata _feeInfo,
        uint256 _requiredGasLimit,
        address[] calldata _allowedRelayerAddresses,
        bytes calldata _message
    ) external payable returns (bytes32) {
        bytes32 messageID = keccak256(
            abi.encodePacked(
                block.chainid,
                _destinationBlockchainID,
                _destinationAddress,
                _message,
                block.timestamp,
                msg.sender
            )
        );

        processedMessages[messageID] = false;

        emit CrossChainMessageSent(
            messageID,
            _destinationBlockchainID,
            _destinationAddress,
            _message
        );

        return messageID;
    }

    function receiveCrossChainMessage(
        bytes32 _sourceBlockchainID,
        address _originSenderAddress,
        bytes calldata _message
    ) external {
        bytes32 messageID = keccak256(
            abi.encodePacked(
                _sourceBlockchainID,
                _originSenderAddress,
                _message,
                block.timestamp
            )
        );

        processedMessages[messageID] = true;
    }

    // Helper function to simulate processing
    function simulateMessageProcessing(bytes32 _messageID) external {
        processedMessages[_messageID] = true;
    }
}

