// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UserRegistry.sol";

/**
 * @title ProjectManager
 * @dev Freelance project management with immutable states
 * @notice Each project has an immutable history of changes
 */
contract ProjectManager {
    enum ProjectStatus {
        Draft,
        Published,
        InProgress,
        Completed,
        Cancelled,
        Disputed
    }

    struct Project {
        uint256 projectId;
        address client;
        address freelancer; // Assigned when accepted
        string title;
        string description;
        string requirementsHash; // IPFS hash of requirements
        uint256 budget;
        uint256 deadline;
        uint256 createdAt;
        uint256 updatedAt;
        ProjectStatus status;
        string deliverablesHash; // IPFS hash of deliverables
        uint256 milestoneCount;
        bool escrowFunded;
    }

    struct Milestone {
        uint256 milestoneId;
        uint256 projectId;
        string description;
        uint256 amount;
        bool completed;
        uint256 completedAt;
        string deliverableHash;
    }

    // Mapping from projectId to Project
    mapping(uint256 => Project) public projects;
    
    // Mapping from projectId to array of milestones
    mapping(uint256 => Milestone[]) public projectMilestones;
    
    // Project counter
    uint256 public projectCounter;
    
    // Reference to UserRegistry
    UserRegistry public userRegistry;
    
    // Reference to Escrow contract
    address public escrowContract;

    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed client,
        string title,
        uint256 budget
    );
    
    event ProjectPublished(
        uint256 indexed projectId,
        address indexed client
    );
    
    event FreelancerAssigned(
        uint256 indexed projectId,
        address indexed freelancer
    );
    
    event ProjectStatusChanged(
        uint256 indexed projectId,
        ProjectStatus oldStatus,
        ProjectStatus newStatus
    );
    
    event MilestoneCreated(
        uint256 indexed projectId,
        uint256 indexed milestoneId,
        uint256 amount
    );
    
    event MilestoneCompleted(
        uint256 indexed projectId,
        uint256 indexed milestoneId
    );

    modifier onlyRegistered() {
        require(
            userRegistry.isUserRegistered(msg.sender),
            "ProjectManager: User not registered"
        );
        _;
    }

    modifier onlyClient(uint256 _projectId) {
        require(
            projects[_projectId].client == msg.sender,
            "ProjectManager: Only client can perform this action"
        );
        _;
    }

    modifier onlyFreelancer(uint256 _projectId) {
        require(
            projects[_projectId].freelancer == msg.sender,
            "ProjectManager: Only freelancer can perform this action"
        );
        _;
    }

    modifier validProject(uint256 _projectId) {
        require(
            projects[_projectId].projectId > 0,
            "ProjectManager: Project does not exist"
        );
        _;
    }

    constructor(address _userRegistry) {
        require(_userRegistry != address(0), "ProjectManager: Invalid user registry");
        userRegistry = UserRegistry(_userRegistry);
        projectCounter = 0;
    }

    /**
     * @dev Sets the Escrow contract address
     * @param _escrowContract Address of the EscrowPayment contract
     */
    function setEscrowContract(address _escrowContract) external {
        require(_escrowContract != address(0), "ProjectManager: Invalid escrow contract");
        escrowContract = _escrowContract;
    }

    /**
     * @dev Creates a new project (Draft status)
     * @param _title Project title
     * @param _description Project description
     * @param _requirementsHash IPFS hash of requirements
     * @param _budget Project budget
     * @param _deadline Deadline as timestamp
     * @return uint256 ID of the created project
     */
    function createProject(
        string memory _title,
        string memory _description,
        string memory _requirementsHash,
        uint256 _budget,
        uint256 _deadline
    ) external onlyRegistered returns (uint256) {
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

        emit ProjectCreated(projectCounter, msg.sender, _title, _budget);
        return projectCounter;
    }

    /**
     * @dev Publishes a project (changes from Draft to Published)
     * @param _projectId Project ID
     */
    function publishProject(uint256 _projectId) 
        external 
        onlyClient(_projectId) 
        validProject(_projectId) 
    {
        require(
            projects[_projectId].status == ProjectStatus.Draft,
            "ProjectManager: Project must be in Draft status"
        );

        Project storage project = projects[_projectId];
        project.status = ProjectStatus.Published;
        project.updatedAt = block.timestamp;

        emit ProjectStatusChanged(_projectId, ProjectStatus.Draft, ProjectStatus.Published);
        emit ProjectPublished(_projectId, project.client);
    }

    /**
     * @dev Assigns a freelancer to a project
     * @param _projectId Project ID
     * @param _freelancer Address of the freelancer to assign
     */
    function assignFreelancer(uint256 _projectId, address _freelancer)
        external
        onlyClient(_projectId)
        validProject(_projectId)
    {
        require(
            projects[_projectId].status == ProjectStatus.Published,
            "ProjectManager: Project must be published"
        );
        require(
            userRegistry.isUserRegistered(_freelancer),
            "ProjectManager: Freelancer not registered"
        );
        
        UserRegistry.UserProfile memory freelancerProfile = userRegistry.getUserProfile(_freelancer);
        require(
            freelancerProfile.isFreelancer,
            "ProjectManager: Invalid freelancer"
        );
        require(
            projects[_projectId].freelancer == address(0),
            "ProjectManager: Freelancer already assigned"
        );

        projects[_projectId].freelancer = _freelancer;
        projects[_projectId].status = ProjectStatus.InProgress;
        projects[_projectId].updatedAt = block.timestamp;

        emit FreelancerAssigned(_projectId, _freelancer);
        emit ProjectStatusChanged(_projectId, ProjectStatus.Published, ProjectStatus.InProgress);
    }

    /**
     * @dev Creates a milestone for a project
     * @param _projectId Project ID
     * @param _description Milestone description
     * @param _amount Milestone amount
     */
    function createMilestone(
        uint256 _projectId,
        string memory _description,
        uint256 _amount
    ) external onlyClient(_projectId) validProject(_projectId) {
        require(
            projects[_projectId].status == ProjectStatus.InProgress,
            "ProjectManager: Project must be in progress"
        );
        require(bytes(_description).length > 0, "ProjectManager: Description cannot be empty");
        require(_amount > 0, "ProjectManager: Amount must be greater than 0");

        uint256 milestoneId = projectMilestones[_projectId].length;
        
        projectMilestones[_projectId].push(Milestone({
            milestoneId: milestoneId,
            projectId: _projectId,
            description: _description,
            amount: _amount,
            completed: false,
            completedAt: 0,
            deliverableHash: ""
        }));

        projects[_projectId].milestoneCount++;
        projects[_projectId].updatedAt = block.timestamp;

        emit MilestoneCreated(_projectId, milestoneId, _amount);
    }

    /**
     * @dev Marks a milestone as completed
     * @param _projectId Project ID
     * @param _milestoneId Milestone ID
     * @param _deliverableHash IPFS hash of the deliverable
     */
    function completeMilestone(
        uint256 _projectId,
        uint256 _milestoneId,
        string memory _deliverableHash
    ) external onlyFreelancer(_projectId) validProject(_projectId) {
        require(
            projects[_projectId].status == ProjectStatus.InProgress,
            "ProjectManager: Project must be in progress"
        );
        require(
            _milestoneId < projectMilestones[_projectId].length,
            "ProjectManager: Invalid milestone"
        );
        require(
            !projectMilestones[_projectId][_milestoneId].completed,
            "ProjectManager: Milestone already completed"
        );

        projectMilestones[_projectId][_milestoneId].completed = true;
        projectMilestones[_projectId][_milestoneId].completedAt = block.timestamp;
        projectMilestones[_projectId][_milestoneId].deliverableHash = _deliverableHash;

        projects[_projectId].updatedAt = block.timestamp;

        emit MilestoneCompleted(_projectId, _milestoneId);
    }

    /**
     * @dev Marks a project as completed
     * @param _projectId Project ID
     * @param _deliverablesHash IPFS hash of all deliverables
     */
    function completeProject(
        uint256 _projectId,
        string memory _deliverablesHash
    ) external onlyClient(_projectId) validProject(_projectId) {
        require(
            projects[_projectId].status == ProjectStatus.InProgress,
            "ProjectManager: Project must be in progress"
        );
        require(
            projects[_projectId].freelancer != address(0),
            "ProjectManager: Freelancer not assigned"
        );

        projects[_projectId].status = ProjectStatus.Completed;
        projects[_projectId].deliverablesHash = _deliverablesHash;
        projects[_projectId].updatedAt = block.timestamp;

        emit ProjectStatusChanged(_projectId, ProjectStatus.InProgress, ProjectStatus.Completed);
    }

    /**
     * @dev Gets a complete project
     * @param _projectId Project ID
     * @return Project complete project
     */
    function getProject(uint256 _projectId)
        external
        view
        validProject(_projectId)
        returns (Project memory)
    {
        return projects[_projectId];
    }

    /**
     * @dev Gets all milestones of a project
     * @param _projectId Project ID
     * @return Milestone[] array of milestones
     */
    function getProjectMilestones(uint256 _projectId)
        external
        view
        validProject(_projectId)
        returns (Milestone[] memory)
    {
        return projectMilestones[_projectId];
    }

    /**
     * @dev Gets a specific milestone
     * @param _projectId Project ID
     * @param _milestoneId Milestone ID
     * @return Milestone requested milestone
     */
    function getMilestone(uint256 _projectId, uint256 _milestoneId)
        external
        view
        validProject(_projectId)
        returns (Milestone memory)
    {
        require(
            _milestoneId < projectMilestones[_projectId].length,
            "ProjectManager: Invalid milestone"
        );
        return projectMilestones[_projectId][_milestoneId];
    }
}

