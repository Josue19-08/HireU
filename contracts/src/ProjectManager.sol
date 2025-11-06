// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UserRegistry.sol";

/**
 * @title ProjectManager
 * @dev Gestión de proyectos freelance con estados inmutables
 * @notice Cada proyecto tiene un historial inmutable de cambios
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
        address freelancer; // Asignado cuando se acepta
        string title;
        string description;
        string requirementsHash; // IPFS hash de los requisitos
        uint256 budget;
        uint256 deadline;
        uint256 createdAt;
        uint256 updatedAt;
        ProjectStatus status;
        string deliverablesHash; // IPFS hash de entregables
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

    // Mapping de projectId a Project
    mapping(uint256 => Project) public projects;
    
    // Mapping de projectId a array de milestones
    mapping(uint256 => Milestone[]) public projectMilestones;
    
    // Contador de proyectos
    uint256 public projectCounter;
    
    // Referencia al UserRegistry
    UserRegistry public userRegistry;
    
    // Referencia al contrato de Escrow
    address public escrowContract;

    // Eventos
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
     * @dev Establece la dirección del contrato de Escrow
     * @param _escrowContract Address del contrato EscrowPayment
     */
    function setEscrowContract(address _escrowContract) external {
        require(_escrowContract != address(0), "ProjectManager: Invalid escrow contract");
        escrowContract = _escrowContract;
    }

    /**
     * @dev Crea un nuevo proyecto (estado Draft)
     * @param _title Título del proyecto
     * @param _description Descripción del proyecto
     * @param _requirementsHash Hash IPFS de los requisitos
     * @param _budget Presupuesto del proyecto
     * @param _deadline Fecha límite en timestamp
     * @return uint256 ID del proyecto creado
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
     * @dev Publica un proyecto (cambia de Draft a Published)
     * @param _projectId ID del proyecto
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
     * @dev Asigna un freelancer a un proyecto
     * @param _projectId ID del proyecto
     * @param _freelancer Address del freelancer a asignar
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
     * @dev Crea un milestone para un proyecto
     * @param _projectId ID del proyecto
     * @param _description Descripción del milestone
     * @param _amount Monto del milestone
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
     * @dev Marca un milestone como completado
     * @param _projectId ID del proyecto
     * @param _milestoneId ID del milestone
     * @param _deliverableHash Hash IPFS del entregable
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
     * @dev Marca un proyecto como completado
     * @param _projectId ID del proyecto
     * @param _deliverablesHash Hash IPFS de todos los entregables
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
     * @dev Obtiene un proyecto completo
     * @param _projectId ID del proyecto
     * @return Project proyecto completo
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
     * @dev Obtiene todos los milestones de un proyecto
     * @param _projectId ID del proyecto
     * @return Milestone[] array de milestones
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
     * @dev Obtiene un milestone específico
     * @param _projectId ID del proyecto
     * @param _milestoneId ID del milestone
     * @return Milestone milestone solicitado
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

