// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAvalancheICM.sol";

/**
 * @title MockICM
 * @dev Mock implementation de IAvalancheICM for testing
 */
contract MockICM is IAvalancheICM {
    mapping(bytes32 => bool) private processedMessages;
    mapping(bytes32 => bool) private messageStatus;

    event MessageSent(
        bytes32 indexed messageHash,
        bytes32 destinationChainId,
        address destinationAddress,
        bytes payload
    );

    function sendMessage(
        bytes32 _destinationChainId,
        address _destinationAddress,
        bytes calldata _payload,
        uint256 _gasLimit
    ) external payable returns (bytes32) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                block.chainid,
                _destinationChainId,
                _destinationAddress,
                _payload,
                block.timestamp,
                msg.sender
            )
        );

        processedMessages[messageHash] = false;
        messageStatus[messageHash] = true;

        emit MessageSent(messageHash, _destinationChainId, _destinationAddress, _payload);
        return messageHash;
    }

    function receiveMessage(
        bytes32 _sourceChainId,
        address _sourceAddress,
        bytes calldata _payload
    ) external {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                _sourceChainId,
                _sourceAddress,
                _payload,
                block.timestamp
            )
        );

        processedMessages[messageHash] = true;
        messageStatus[messageHash] = true;
    }

    function isMessageProcessed(bytes32 _messageHash) external view returns (bool) {
        return processedMessages[_messageHash];
    }

    function getMessageStatus(bytes32 _messageHash) external view returns (bool) {
        return messageStatus[_messageHash];
    }

    // Helper function to simulate processing
    function simulateMessageProcessing(bytes32 _messageHash) external {
        processedMessages[_messageHash] = true;
        messageStatus[_messageHash] = true;
    }
}

