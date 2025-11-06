// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserStatistics
 * @dev Estadísticas inmutables de freelancers, propiedad del usuario
 * @notice Todas las estadísticas son inmutables y verificables on-chain
 */
contract UserStatistics {
    struct WorkRecord {
        uint256 projectId;
        address freelancer;
        address client;
        uint256 amount;
        uint256 completionDate;
        string workHash; // IPFS hash del trabajo entregado
        bool verified;
        uint256 rating; // Rating del 1 al 5
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
    
    // Mapping separado para historial de trabajos (para evitar problemas de gas)
    mapping(address => WorkRecord[]) public freelancerWorkHistory;

    // Mapping de freelancer a sus estadísticas
    mapping(address => FreelancerStats) public freelancerStats;
    
    // Mapping de projectId a WorkRecord para verificación cruzada
    mapping(uint256 => WorkRecord) public workRecords;

    // Eventos
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
     * @dev Registra un nuevo trabajo completado
     * @param _freelancer Address del freelancer
     * @param _projectId ID único del proyecto
     * @param _client Address del cliente
     * @param _amount Monto pagado por el trabajo
     * @param _workHash Hash IPFS del trabajo entregado
     * @param _rating Rating dado por el cliente (1-5)
     * @notice Solo puede ser llamado por el contrato de escrow después de completar un pago
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

        // Actualizar estadísticas del freelancer
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

        // Calcular nuevo promedio de rating
        stats.totalRatings++;
        stats.averageRating = ((stats.averageRating * (stats.totalRatings - 1)) + _rating) / stats.totalRatings;

        emit WorkRecorded(_freelancer, _projectId, _client, _amount, _rating);
    }

    /**
     * @dev Verifica un trabajo como entregado a tiempo o no
     * @param _projectId ID del proyecto
     * @param _verified Si el trabajo fue entregado a tiempo
     * @notice Solo puede ser llamado por el contrato de ProjectManager o Escrow
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
     * @dev Obtiene las estadísticas completas de un freelancer
     * @param _freelancer Address del freelancer
     * @return FreelancerStats estadísticas completas
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
     * @dev Obtiene el historial de trabajos de un freelancer
     * @param _freelancer Address del freelancer
     * @param _startIndex Índice de inicio
     * @param _count Cantidad de registros a obtener
     * @return WorkRecord[] array de registros de trabajo
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
     * @dev Obtiene un registro de trabajo específico
     * @param _projectId ID del proyecto
     * @return WorkRecord registro del trabajo
     */
    function getWorkRecord(uint256 _projectId) external view returns (WorkRecord memory) {
        require(
            workRecords[_projectId].completionDate > 0,
            "UserStatistics: Work not recorded"
        );
        return workRecords[_projectId];
    }

    /**
     * @dev Calcula el porcentaje de entregas a tiempo
     * @param _freelancer Address del freelancer
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
     * @dev Obtiene el número total de trabajos de un freelancer
     * @param _freelancer Address del freelancer
     * @return uint256 número total de trabajos
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

