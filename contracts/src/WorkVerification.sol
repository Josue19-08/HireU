// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ProjectManager.sol";
import "./UserStatistics.sol";
import "./EscrowPayment.sol";

/**
 * @title WorkVerification
 * @dev Sistema de verificación de trabajos entregados con validación inmutable
 * @notice Cada verificación es permanente y verificable on-chain
 */
contract WorkVerification {
    enum VerificationStatus {
        Pending,
        Verified,
        Rejected,
        Disputed
    }

    struct Verification {
        uint256 verificationId;
        uint256 projectId;
        address freelancer;
        address client;
        address verifier; // Address que verificó (puede ser cliente u oráculo)
        string workHash; // IPFS hash del trabajo entregado
        string requirementsHash; // IPFS hash de los requisitos originales
        VerificationStatus status;
        uint256 verifiedAt;
        string rejectionReason;
        bool meetsDeadline;
        uint256 deadline;
        uint256 submittedAt;
    }

    struct WorkEvidence {
        uint256 verificationId;
        string[] evidenceHashes; // Array de hashes IPFS con evidencia
        uint256 timestamp;
        address submitter;
    }

    // Mapping de verificationId a Verification
    mapping(uint256 => Verification) public verifications;
    
    // Mapping de projectId a verificationId
    mapping(uint256 => uint256) public projectVerifications;
    
    // Mapping de verificationId a WorkEvidence
    mapping(uint256 => WorkEvidence) public workEvidence;
    
    // Contador de verificaciones
    uint256 public verificationCounter;
    
    // Referencias a otros contratos
    ProjectManager public projectManager;
    UserStatistics public userStatistics;
    EscrowPayment public escrowPayment;
    
    // Mapping de address a bool para verificar si es oráculo autorizado
    mapping(address => bool) public authorizedOracles;

    // Eventos
    event VerificationCreated(
        uint256 indexed verificationId,
        uint256 indexed projectId,
        address indexed freelancer
    );
    
    event VerificationSubmitted(
        uint256 indexed verificationId,
        string workHash,
        address indexed freelancer
    );
    
    event VerificationCompleted(
        uint256 indexed verificationId,
        VerificationStatus status,
        address indexed verifier
    );
    
    event VerificationRejected(
        uint256 indexed verificationId,
        string reason
    );
    
    event EvidenceAdded(
        uint256 indexed verificationId,
        string evidenceHash
    );

    modifier onlyRegistered() {
        require(
            msg.sender != address(0),
            "WorkVerification: Invalid sender"
        );
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedOracles[msg.sender] || msg.sender == address(this),
            "WorkVerification: Unauthorized"
        );
        _;
    }

    modifier validVerification(uint256 _verificationId) {
        require(
            verifications[_verificationId].verificationId > 0,
            "WorkVerification: Verification does not exist"
        );
        _;
    }

    constructor(
        address _projectManager,
        address _userStatistics,
        address _escrowPayment
    ) {
        require(_projectManager != address(0), "WorkVerification: Invalid project manager");
        require(_userStatistics != address(0), "WorkVerification: Invalid user statistics");
        require(_escrowPayment != address(0), "WorkVerification: Invalid escrow payment");
        
        projectManager = ProjectManager(_projectManager);
        userStatistics = UserStatistics(_userStatistics);
        escrowPayment = EscrowPayment(payable(_escrowPayment));
    }

    /**
     * @dev Autoriza un oráculo para verificar trabajos
     * @param _oracle Address del oráculo a autorizar
     */
    function authorizeOracle(address _oracle) external {
        require(_oracle != address(0), "WorkVerification: Invalid oracle address");
        authorizedOracles[_oracle] = true;
    }

    /**
     * @dev Crea una nueva verificación para un proyecto
     * @param _projectId ID del proyecto
     * @return uint256 ID de la verificación creada
     */
    function createVerification(uint256 _projectId)
        external
        onlyRegistered
        returns (uint256)
    {
        ProjectManager.Project memory project = projectManager.getProject(_projectId);
        require(
            project.status == ProjectManager.ProjectStatus.InProgress ||
            project.status == ProjectManager.ProjectStatus.Completed,
            "WorkVerification: Invalid project status"
        );
        require(
            project.freelancer != address(0),
            "WorkVerification: Freelancer not assigned"
        );
        require(
            projectVerifications[_projectId] == 0,
            "WorkVerification: Verification already exists"
        );
        require(
            msg.sender == project.client || msg.sender == project.freelancer,
            "WorkVerification: Only client or freelancer can create verification"
        );

        verificationCounter++;

        verifications[verificationCounter] = Verification({
            verificationId: verificationCounter,
            projectId: _projectId,
            freelancer: project.freelancer,
            client: project.client,
            verifier: address(0),
            workHash: "",
            requirementsHash: project.requirementsHash,
            status: VerificationStatus.Pending,
            verifiedAt: 0,
            rejectionReason: "",
            meetsDeadline: false,
            deadline: project.deadline,
            submittedAt: 0
        });

        projectVerifications[_projectId] = verificationCounter;

        emit VerificationCreated(verificationCounter, _projectId, project.freelancer);
        return verificationCounter;
    }

    /**
     * @dev El freelancer envía su trabajo para verificación
     * @param _verificationId ID de la verificación
     * @param _workHash Hash IPFS del trabajo entregado
     * @param _evidenceHashes Array de hashes IPFS con evidencia adicional
     */
    function submitWork(
        uint256 _verificationId,
        string memory _workHash,
        string[] memory _evidenceHashes
    ) external onlyRegistered validVerification(_verificationId) {
        Verification storage verification = verifications[_verificationId];
        require(
            verification.status == VerificationStatus.Pending,
            "WorkVerification: Verification not in pending status"
        );
        require(
            verification.freelancer == msg.sender,
            "WorkVerification: Only freelancer can submit work"
        );
        require(bytes(_workHash).length > 0, "WorkVerification: Work hash cannot be empty");

        verification.workHash = _workHash;
        verification.submittedAt = block.timestamp;
        verification.meetsDeadline = block.timestamp <= verification.deadline;

        // Guardar evidencia
        workEvidence[_verificationId] = WorkEvidence({
            verificationId: _verificationId,
            evidenceHashes: _evidenceHashes,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        emit VerificationSubmitted(_verificationId, _workHash, msg.sender);
        
        // Emitir eventos para cada evidencia
        for (uint256 i = 0; i < _evidenceHashes.length; i++) {
            emit EvidenceAdded(_verificationId, _evidenceHashes[i]);
        }
    }

    /**
     * @dev Verifica un trabajo (cliente u oráculo)
     * @param _verificationId ID de la verificación
     * @param _verified true si el trabajo cumple con los requisitos
     * @param _reason Razón de rechazo (si aplica)
     */
    function verifyWork(
        uint256 _verificationId,
        bool _verified,
        string memory _reason
    ) external onlyRegistered validVerification(_verificationId) {
        Verification storage verification = verifications[_verificationId];
        require(
            verification.status == VerificationStatus.Pending,
            "WorkVerification: Verification not in pending status"
        );
        require(
            bytes(verification.workHash).length > 0,
            "WorkVerification: Work not submitted yet"
        );
        require(
            msg.sender == verification.client || authorizedOracles[msg.sender],
            "WorkVerification: Only client or authorized oracle can verify"
        );

        verification.verifier = msg.sender;
        verification.verifiedAt = block.timestamp;

        if (_verified) {
            verification.status = VerificationStatus.Verified;
            
            // Notificar a UserStatistics que el trabajo fue entregado a tiempo
            userStatistics.verifyWorkDelivery(
                verification.projectId,
                verification.meetsDeadline
            );

            emit VerificationCompleted(_verificationId, VerificationStatus.Verified, msg.sender);
        } else {
            verification.status = VerificationStatus.Rejected;
            verification.rejectionReason = _reason;
            emit VerificationRejected(_verificationId, _reason);
            emit VerificationCompleted(_verificationId, VerificationStatus.Rejected, msg.sender);
        }
    }

    /**
     * @dev Agrega evidencia adicional a una verificación
     * @param _verificationId ID de la verificación
     * @param _evidenceHash Hash IPFS de la evidencia
     */
    function addEvidence(
        uint256 _verificationId,
        string memory _evidenceHash
    ) external onlyRegistered validVerification(_verificationId) {
        Verification storage verification = verifications[_verificationId];
        require(
            verification.freelancer == msg.sender,
            "WorkVerification: Only freelancer can add evidence"
        );
        require(bytes(_evidenceHash).length > 0, "WorkVerification: Evidence hash cannot be empty");

        workEvidence[_verificationId].evidenceHashes.push(_evidenceHash);
        emit EvidenceAdded(_verificationId, _evidenceHash);
    }

    /**
     * @dev Obtiene una verificación completa
     * @param _verificationId ID de la verificación
     * @return Verification verificación completa
     */
    function getVerification(uint256 _verificationId)
        external
        view
        validVerification(_verificationId)
        returns (Verification memory)
    {
        return verifications[_verificationId];
    }

    /**
     * @dev Obtiene la evidencia de un trabajo
     * @param _verificationId ID de la verificación
     * @return WorkEvidence evidencia del trabajo
     */
    function getWorkEvidence(uint256 _verificationId)
        external
        view
        validVerification(_verificationId)
        returns (WorkEvidence memory)
    {
        return workEvidence[_verificationId];
    }

    /**
     * @dev Obtiene el ID de verificación de un proyecto
     * @param _projectId ID del proyecto
     * @return uint256 ID de la verificación
     */
    function getVerificationByProject(uint256 _projectId)
        external
        view
        returns (uint256)
    {
        return projectVerifications[_projectId];
    }

    /**
     * @dev Verifica si un trabajo fue entregado a tiempo
     * @param _verificationId ID de la verificación
     * @return bool true si fue entregado a tiempo
     */
    function wasWorkOnTime(uint256 _verificationId)
        external
        view
        validVerification(_verificationId)
        returns (bool)
    {
        return verifications[_verificationId].meetsDeadline;
    }
}

