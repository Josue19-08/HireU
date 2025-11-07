// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserStatistics
 * @dev Immutable statistics de freelancers, owned by the user
 * @notice All statistics are immutable and verifiable on-chain
 */
contract UserStatistics {
    struct WorkRecord {
        uint256 projectId;
        address freelancer;
        address client;
        uint256 amount;
        uint256 completionDate;
        string workHash; // IPFS hash of the work delivered
        bool verified;
        uint256 rating; // Rating from 1 to 5
    }

    struct FreelancerStats {
        address freelancer;
        uint256 totalProjects;
        uint256 completedProjects;
        uint256 totalEarned;
        uint256 averageRating;
        uint256 totalRatings;
        uint256 onTimeDeliveries;
        uint256 totalDeliveries;
        uint256 registrationDate;
    }
    
    // Mapping separate for work history (to avoid gas issues)
    mapping(address => WorkRecord[]) public freelancerWorkHistory;

    // Mapping from freelancer to their statistics
    mapping(address => FreelancerStats) public freelancerStats;
    
    // Mapping from projectId to WorkRecord for cross-verification
    mapping(uint256 => WorkRecord) public workRecords;

    // Events
    event WorkRecorded(
        address indexed freelancer,
        uint256 indexed projectId,
        address indexed client,
        uint256 amount,
        uint256 rating
    );
    
    event WorkVerified(
        address indexed freelancer,
        uint256 indexed projectId,
        bool verified
    );

    modifier onlyValidFreelancer(address _freelancer) {
        require(_freelancer != address(0), "UserStatistics: Invalid freelancer address");
        _;
    }

    /**
     * @dev Records a new completed work completedo
     * @param _freelancer Freelancer address
     * @param _projectId Unique project ID
     * @param _client Client address
     * @param _amount Amount paid for the work
     * @param _workHash IPFS hash of the work delivered
     * @param _rating Rating given by the client (1-5)
     * @notice Can only be called by the escrow contract after completing a payment
     */
    function recordWork(
        address _freelancer,
        uint256 _projectId,
        address _client,
        uint256 _amount,
        string memory _workHash,
        uint256 _rating
    ) external onlyValidFreelancer(_freelancer) {
        require(
            workRecords[_projectId].completionDate == 0,
            "UserStatistics: Work already recorded"
        );
        require(_rating >= 1 && _rating <= 5, "UserStatistics: Rating must be 1-5");
        require(_amount > 0, "UserStatistics: Amount must be greater than 0");

        WorkRecord memory newWork = WorkRecord({
            projectId: _projectId,
            freelancer: _freelancer,
            client: _client,
            amount: _amount,
            completionDate: block.timestamp,
            workHash: _workHash,
            verified: false,
            rating: _rating
        });

        workRecords[_projectId] = newWork;

        // Update statistics of the freelancer
        FreelancerStats storage stats = freelancerStats[_freelancer];
        
        if (stats.registrationDate == 0) {
            stats.freelancer = _freelancer;
            stats.registrationDate = block.timestamp;
        }

        stats.totalProjects++;
        stats.completedProjects++;
        stats.totalEarned += _amount;
        stats.totalDeliveries++;
        freelancerWorkHistory[_freelancer].push(newWork);

        // Calculate new average rating
        stats.totalRatings++;
        stats.averageRating = ((stats.averageRating * (stats.totalRatings - 1)) + _rating) / stats.totalRatings;

        emit WorkRecorded(_freelancer, _projectId, _client, _amount, _rating);
    }

    /**
     * @dev Verifies a work as delivered on time or not
     * @param _projectId Project ID
     * @param _verified If the work was delivered on time
     * @notice Can only be called by el contrato de ProjectManager o Escrow
     */
    function verifyWorkDelivery(uint256 _projectId, bool _verified) external {
        require(
            workRecords[_projectId].completionDate > 0,
            "UserStatistics: Work not recorded"
        );

        WorkRecord storage work = workRecords[_projectId];
        work.verified = _verified;

        address freelancer = work.freelancer;
        if (_verified && freelancer != address(0)) {
            freelancerStats[freelancer].onTimeDeliveries++;
        }

        emit WorkVerified(freelancer, _projectId, _verified);
    }

    /**
     * @dev Gets the statistics complete of a freelancer
     * @param _freelancer Freelancer address
     * @return FreelancerStats complete statistics
     */
    function getFreelancerStats(address _freelancer)
        external
        view
        onlyValidFreelancer(_freelancer)
        returns (FreelancerStats memory)
    {
        return freelancerStats[_freelancer];
    }

    /**
     * @dev Gets the history of work of a freelancer
     * @param _freelancer Freelancer address
     * @param _startIndex Start index
     * @param _count Number of records to get
     * @return WorkRecord[] array of work records
     */
    function getWorkHistory(
        address _freelancer,
        uint256 _startIndex,
        uint256 _count
    ) external view onlyValidFreelancer(_freelancer) returns (WorkRecord[] memory) {
        WorkRecord[] storage history = freelancerWorkHistory[_freelancer];
        uint256 totalWorks = history.length;
        
        if (_startIndex >= totalWorks) {
            return new WorkRecord[](0);
        }

        uint256 endIndex = _startIndex + _count;
        if (endIndex > totalWorks) {
            endIndex = totalWorks;
        }

        uint256 resultLength = endIndex - _startIndex;
        WorkRecord[] memory result = new WorkRecord[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = history[_startIndex + i];
        }

        return result;
    }

    /**
     * @dev Gets a record of specific work
     * @param _projectId Project ID
     * @return WorkRecord work record
     */
    function getWorkRecord(uint256 _projectId) external view returns (WorkRecord memory) {
        require(
            workRecords[_projectId].completionDate > 0,
            "UserStatistics: Work not recorded"
        );
        return workRecords[_projectId];
    }

    /**
     * @dev Calculates the percentage of on-time deliveries
     * @param _freelancer Freelancer address
     * @return uint256 porcentaje (0-100)
     */
    function getOnTimeDeliveryRate(address _freelancer)
        external
        view
        onlyValidFreelancer(_freelancer)
        returns (uint256)
    {
        FreelancerStats storage stats = freelancerStats[_freelancer];
        if (stats.totalDeliveries == 0) {
            return 0;
        }
        return (stats.onTimeDeliveries * 100) / stats.totalDeliveries;
    }

    /**
     * @dev Gets the total number of works of a freelancer
     * @param _freelancer Freelancer address
     * @return uint256 total number of works
     */
    function getTotalWorks(address _freelancer)
        external
        view
        onlyValidFreelancer(_freelancer)
        returns (uint256)
    {
        return freelancerWorkHistory[_freelancer].length;
    }
}

