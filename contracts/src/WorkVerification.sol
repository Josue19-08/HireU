// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ProjectManager.sol";
import "./UserStatistics.sol";
import "./EscrowPayment.sol";

/**
 * @title WorkVerification
 * @dev Work verification system of  delivereds with immutable validation
 * @notice Each verification is permanent y verificable on-chain
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
        address verifier; // Address that verified (can be client or oracle)
        string workHash; // IPFS hash of the work delivered
        string requirementsHash; // IPFS hash of requirements original
        VerificationStatus status;
        uint256 verifiedAt;
        string rejectionReason;
        bool meetsDeadline;
        uint256 deadline;
        uint256 submittedAt;
    }

    struct WorkEvidence {
        uint256 verificationId;
        string[] evidenceHashes; // Array of IPFS hashes with evidence
        uint256 timestamp;
        address submitter;
    }

    // Mapping from verificationId to Verification
    mapping(uint256 => Verification) public verifications;
    
    // Mapping from projectId to verificationId
    mapping(uint256 => uint256) public projectVerifications;
    
    // Mapping from verificationId to WorkEvidence
    mapping(uint256 => WorkEvidence) public workEvidence;
    
    // Counter for verificaciones
    uint256 public verificationCounter;
    
    // References to other contracts
    ProjectManager public projectManager;
    UserStatistics public userStatistics;
    EscrowPayment public escrowPayment;
    
    // Mapping from address to bool to check if it is an oracle authorized
    mapping(address => bool) public authorizedOracles;

    // Events
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
     * @dev Authorizes an oracle to verify work
     * @param _oracle Address of the oracle to authorize
     */
    function authorizeOracle(address _oracle) external {
        require(_oracle != address(0), "WorkVerification: Invalid oracle address");
        authorizedOracles[_oracle] = true;
    }

    /**
     * @dev Creates a new verification for a project
     * @param _projectId Project ID
     * @return uint256 ID of the created verification
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
     * @dev The freelancer submits their work for verification
     * @param _verificationId Verification ID
     * @param _workHash IPFS hash of the work delivered
     * @param _evidenceHashes Array of IPFS hashes with additional evidence
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

        // Save evidence
        workEvidence[_verificationId] = WorkEvidence({
            verificationId: _verificationId,
            evidenceHashes: _evidenceHashes,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        emit VerificationSubmitted(_verificationId, _workHash, msg.sender);
        
        // Emit events for each evidence
        for (uint256 i = 0; i < _evidenceHashes.length; i++) {
            emit EvidenceAdded(_verificationId, _evidenceHashes[i]);
        }
    }

    /**
     * @dev Verifies a work (client or oracle)
     * @param _verificationId Verification ID
     * @param _verified true if the work meets the requirements
     * @param _reason Rejection reason (if applicable)
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
            
            // Notify UserStatistics that the work was delivered on time
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
     * @dev Adds additional evidence to a verification
     * @param _verificationId Verification ID
     * @param _evidenceHash IPFS hash of the evidence
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
     * @dev Gets a verification complete
     * @param _verificationId Verification ID
     * @return Verification complete verification
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
     * @dev Gets the evidence of a work
     * @param _verificationId Verification ID
     * @return WorkEvidence work evidence
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
     * @dev Gets the ID of verification of a project
     * @param _projectId Project ID
     * @return uint256 Verification ID
     */
    function getVerificationByProject(uint256 _projectId)
        external
        view
        returns (uint256)
    {
        return projectVerifications[_projectId];
    }

    /**
     * @dev Checks if a work was delivered on time
     * @param _verificationId Verification ID
     * @return bool true si was delivered on time
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

