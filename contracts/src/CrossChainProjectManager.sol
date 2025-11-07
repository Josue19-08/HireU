// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ProjectManager.sol";
import "./CrossChainManager.sol";

/**
 * @title CrossChainProjectManager
 * @dev Extends ProjectManager with cross-chain capabilities
 * @notice Allows creating and managing projects on multiple Avalanche blockchains
 */
contract CrossChainProjectManager is ProjectManager {
    CrossChainManager public crossChainManager;

    // Mapping from projectId to information cross-chain
    mapping(uint256 => CrossChainProjectInfo) public crossChainProjects;

    // Mapping from crossChainProjectId to projectId local
    mapping(bytes32 => uint256) public crossChainToLocalProject;

    struct CrossChainProjectInfo {
        bytes32 sourceChainId;
        bytes32 destinationChainId;
        address sourceClient;
        address destinationClient;
        bytes32 crossChainProjectId;
        bool isCrossChain;
        uint256 crossChainOperationId;
    }

    // Events
    event CrossChainProjectCreated(
        uint256 indexed projectId,
        bytes32 indexed crossChainProjectId,
        bytes32 sourceChainId,
        bytes32 destinationChainId
    );

    event CrossChainProjectReceived(
        uint256 indexed projectId,
        bytes32 indexed crossChainProjectId,
        bytes32 sourceChainId
    );

    modifier onlyCrossChainManager() {
        require(
            msg.sender == address(crossChainManager),
            "CrossChainProjectManager: Only cross-chain manager can call"
        );
        _;
    }

    constructor(
        address _userRegistry,
        address _crossChainManager
    ) ProjectManager(_userRegistry) {
        require(
            _crossChainManager != address(0),
            "CrossChainProjectManager: Invalid cross-chain manager"
        );
        crossChainManager = CrossChainManager(payable(_crossChainManager));
    }

    /**
     * @dev Creates a cross-chain project on another blockchain of Avalanche
     * @param _title Project title
     * @param _description Project description
     * @param _requirementsHash Hash IPFS de los requisitos
     * @param _budget Project budget
     * @param _deadline Deadline as timestamp
     * @param _destinationChainId Destination blockchain ID (C-Chain, X-Chain, etc)
     * @param _gasLimit Gas limit for execution at destination
     * @return uint256 ID of the local project created
     * @return bytes32 ID of the cross-chain project
     */
    function createCrossChainProject(
        string memory _title,
        string memory _description,
        string memory _requirementsHash,
        uint256 _budget,
        uint256 _deadline,
        bytes32 _destinationChainId,
        uint256 _gasLimit
    ) external payable returns (uint256, bytes32) {
        // Create local project first using inherited logic
        require(
            userRegistry.isUserRegistered(msg.sender),
            "ProjectManager: User not registered"
        );
        
        UserRegistry.UserProfile memory profile = userRegistry.getUserProfile(msg.sender);
        require(
            profile.isClient,
            "ProjectManager: Only clients can create projects"
        );
        require(bytes(_title).length > 0, "ProjectManager: Title cannot be empty");
        require(_budget > 0, "ProjectManager: Budget must be greater than 0");
        require(_deadline > block.timestamp, "ProjectManager: Deadline must be in the future");

        projectCounter++;
        
        projects[projectCounter] = Project({
            projectId: projectCounter,
            client: msg.sender,
            freelancer: address(0),
            title: _title,
            description: _description,
            requirementsHash: _requirementsHash,
            budget: _budget,
            deadline: _deadline,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            status: ProjectStatus.Draft,
            deliverablesHash: "",
            milestoneCount: 0,
            escrowFunded: false
        });

        uint256 localProjectId = projectCounter;

        // Generate unique ID cross-chain
        bytes32 crossChainProjectId = keccak256(
            abi.encodePacked(
                block.chainid,
                localProjectId,
                msg.sender,
                block.timestamp
            )
        );

        // Prepare payload to send to the destination blockchain
        bytes memory payload = abi.encode(
            localProjectId,
            _title,
            _description,
            _requirementsHash,
            _budget,
            _deadline,
            msg.sender,
            crossChainProjectId
        );

        // Initiate operation cross-chain
        (uint256 operationId, ) = crossChainManager.initiateCrossChainOperation{
            value: msg.value
        }(
            CrossChainManager.OperationType.ProjectCreation,
            _destinationChainId,
            payload,
            _gasLimit
        );

        // Save information cross-chain
        crossChainProjects[localProjectId] = CrossChainProjectInfo({
            sourceChainId: bytes32(uint256(block.chainid)),
            destinationChainId: _destinationChainId,
            sourceClient: msg.sender,
            destinationClient: address(0), // Will be set when received
            crossChainProjectId: crossChainProjectId,
            isCrossChain: true,
            crossChainOperationId: operationId
        });

        crossChainToLocalProject[crossChainProjectId] = localProjectId;

        emit CrossChainProjectCreated(
            localProjectId,
            crossChainProjectId,
            bytes32(uint256(block.chainid)),
            _destinationChainId
        );

        return (localProjectId, crossChainProjectId);
    }

    /**
     * @dev Receives a project cross-chain from another blockchain
     * @param _sourceChainId Source blockchain ID
     * @param _sourceClient Client address en la Source blockchain
     * @param _title Project title
     * @param _description Project description
     * @param _requirementsHash Hash IPFS de los requisitos
     * @param _budget Project budget
     * @param _deadline Deadline as timestamp
     * @param _crossChainProjectId Unique project ID cross-chain
     * @return uint256 ID of the local project created
     */
    function receiveCrossChainProject(
        bytes32 _sourceChainId,
        address _sourceClient,
        string memory _title,
        string memory _description,
        string memory _requirementsHash,
        uint256 _budget,
        uint256 _deadline,
        bytes32 _crossChainProjectId
    ) external onlyCrossChainManager returns (uint256) {
        // Verify that the project cross-chain does not already exist
        require(
            crossChainToLocalProject[_crossChainProjectId] == 0,
            "CrossChainProjectManager: Project already received"
        );

        // Create local project using inherited logic
        require(bytes(_title).length > 0, "ProjectManager: Title cannot be empty");
        require(_budget > 0, "ProjectManager: Budget must be greater than 0");
        require(_deadline > block.timestamp, "ProjectManager: Deadline must be in the future");

        projectCounter++;
        
        projects[projectCounter] = Project({
            projectId: projectCounter,
            client: address(crossChainManager), // Proxy for the original client
            freelancer: address(0),
            title: _title,
            description: _description,
            requirementsHash: _requirementsHash,
            budget: _budget,
            deadline: _deadline,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            status: ProjectStatus.Draft,
            deliverablesHash: "",
            milestoneCount: 0,
            escrowFunded: false
        });

        uint256 localProjectId = projectCounter;

        // Save information cross-chain
        crossChainProjects[localProjectId] = CrossChainProjectInfo({
            sourceChainId: _sourceChainId,
            destinationChainId: bytes32(uint256(block.chainid)),
            sourceClient: _sourceClient,
            destinationClient: address(crossChainManager), // Proxy for the original client
            crossChainProjectId: _crossChainProjectId,
            isCrossChain: true,
            crossChainOperationId: 0
        });

        crossChainToLocalProject[_crossChainProjectId] = localProjectId;

        emit CrossChainProjectReceived(
            localProjectId,
            _crossChainProjectId,
            _sourceChainId
        );

        return localProjectId;
    }

    /**
     * @dev Synchronizes the state of a project cross-chain
     * @param _projectId ID of the local project
     * @param _destinationChainId Destination blockchain ID
     * @param _newStatus New project status
     * @param _gasLimit Gas limit for execution at destination
     */
    function syncProjectStatus(
        uint256 _projectId,
        bytes32 _destinationChainId,
        ProjectStatus _newStatus,
        uint256 _gasLimit
    ) external payable {
        require(
            crossChainProjects[_projectId].isCrossChain,
            "CrossChainProjectManager: Not a cross-chain project"
        );
        require(
            projects[_projectId].client == msg.sender ||
                projects[_projectId].freelancer == msg.sender,
            "CrossChainProjectManager: Unauthorized"
        );

        bytes memory payload = abi.encode(
            crossChainProjects[_projectId].crossChainProjectId,
            _projectId,
            _newStatus,
            block.timestamp
        );

        crossChainManager.initiateCrossChainOperation{value: msg.value}(
            CrossChainManager.OperationType.ProjectCompletion,
            _destinationChainId,
            payload,
            _gasLimit
        );
    }

    /**
     * @dev Gets information cross-chain of a project
     * @param _projectId ID of the local project
     * @return CrossChainProjectInfo cross-chain information
     */
    function getCrossChainProjectInfo(uint256 _projectId)
        external
        view
        returns (CrossChainProjectInfo memory)
    {
        return crossChainProjects[_projectId];
    }

    /**
     * @dev Checks if a project is cross-chain
     * @param _projectId Project ID
     * @return bool true si is cross-chain
     */
    function isCrossChainProject(uint256 _projectId)
        external
        view
        returns (bool)
    {
        return crossChainProjects[_projectId].isCrossChain;
    }
}

