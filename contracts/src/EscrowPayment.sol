// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ProjectManager.sol";
import "./UserStatistics.sol";

/**
 * @title EscrowPayment
 * @dev Sistema de pagos con escrow usando SRCW (Smart Contract Revenue Wallets)
 * @notice Integra wallets inteligentes para gestionar pagos de forma segura
 */
contract EscrowPayment is ReentrancyGuard, Ownable {
    enum PaymentStatus {
        Pending,
        Funded,
        Released,
        Refunded,
        Disputed
    }

    struct Payment {
        uint256 paymentId;
        uint256 projectId;
        address client;
        address freelancer;
        address token; // Address del token (address(0) para AVAX)
        uint256 amount;
        uint256 fundedAt;
        uint256 releasedAt;
        PaymentStatus status;
        string workHash; // IPFS hash del trabajo verificado
    }

    struct SRCWWalletInfo {
        address walletAddress;
        address owner;
        bool isActive;
        uint256 balance;
    }
    
    // Mapping de paymentId a Payment
    mapping(uint256 => Payment) public payments;
    
    // Mapping de projectId a paymentId
    mapping(uint256 => uint256) public projectPayments;
    
    // Mapping de address a SRCWWalletInfo
    mapping(address => SRCWWalletInfo) public srcwWallets;
    
    // Mapping separado para token balances (address => token => balance)
    mapping(address => mapping(address => uint256)) public srcwTokenBalances;
    
    // Contador de pagos
    uint256 public paymentCounter;
    
    // Referencias a otros contratos
    ProjectManager public projectManager;
    UserStatistics public userStatistics;
    
    // Fee del contrato (en basis points, 100 = 1%)
    uint256 public platformFee = 250; // 2.5%
    address public feeRecipient;

    // Eventos
    event PaymentCreated(
        uint256 indexed paymentId,
        uint256 indexed projectId,
        address indexed client,
        address freelancer,
        uint256 amount
    );
    
    event PaymentFunded(
        uint256 indexed paymentId,
        address indexed client,
        uint256 amount
    );
    
    event PaymentReleased(
        uint256 indexed paymentId,
        address indexed freelancer,
        uint256 amount,
        uint256 fee
    );
    
    event PaymentRefunded(
        uint256 indexed paymentId,
        address indexed client,
        uint256 amount
    );
    
    event SRCWWalletCreated(
        address indexed walletAddress,
        address indexed owner
    );
    
    event DisputeOpened(
        uint256 indexed paymentId,
        address indexed disputer
    );

    modifier onlyProjectManager() {
        require(
            msg.sender == address(projectManager),
            "EscrowPayment: Only project manager can call this"
        );
        _;
    }

    modifier validPayment(uint256 _paymentId) {
        require(
            payments[_paymentId].paymentId > 0,
            "EscrowPayment: Payment does not exist"
        );
        _;
    }

    constructor(address _projectManager, address _userStatistics) Ownable(msg.sender) {
        require(_projectManager != address(0), "EscrowPayment: Invalid project manager");
        require(_userStatistics != address(0), "EscrowPayment: Invalid user statistics");
        projectManager = ProjectManager(_projectManager);
        userStatistics = UserStatistics(_userStatistics);
        feeRecipient = msg.sender;
    }

    /**
     * @dev Crea un SRCW wallet para un usuario
     * @param _owner Address del propietario del wallet
     * @return address Address del wallet creado
     */
    function createSRCWWallet(address _owner) external returns (address) {
        require(_owner != address(0), "EscrowPayment: Invalid owner address");
        require(
            !srcwWallets[_owner].isActive,
            "EscrowPayment: Wallet already exists"
        );

        // En producción, esto sería un contrato de wallet desplegado
        // Por ahora, usamos el address del usuario como wallet
        address walletAddress = _owner;
        
        srcwWallets[_owner] = SRCWWalletInfo({
            walletAddress: walletAddress,
            owner: _owner,
            isActive: true,
            balance: 0
        });

        emit SRCWWalletCreated(walletAddress, _owner);
        return walletAddress;
    }

    /**
     * @dev Crea un pago en escrow para un proyecto
     * @param _projectId ID del proyecto
     * @param _token Address del token (address(0) para AVAX)
     * @param _amount Monto a depositar
     * @return uint256 ID del pago creado
     */
    function createPayment(
        uint256 _projectId,
        address _token,
        uint256 _amount
    ) external payable nonReentrant returns (uint256) {
        require(_amount > 0, "EscrowPayment: Amount must be greater than 0");
        
        // Verificar que el proyecto existe y está en estado correcto
        ProjectManager.Project memory project = projectManager.getProject(_projectId);
        require(
            project.status == ProjectManager.ProjectStatus.InProgress ||
            project.status == ProjectManager.ProjectStatus.Published,
            "EscrowPayment: Invalid project status"
        );
        require(
            project.client == msg.sender,
            "EscrowPayment: Only client can create payment"
        );
        require(
            project.freelancer != address(0),
            "EscrowPayment: Freelancer must be assigned"
        );
        require(
            projectPayments[_projectId] == 0,
            "EscrowPayment: Payment already exists for this project"
        );

        paymentCounter++;
        
        payments[paymentCounter] = Payment({
            paymentId: paymentCounter,
            projectId: _projectId,
            client: msg.sender,
            freelancer: project.freelancer,
            token: _token,
            amount: _amount,
            fundedAt: 0,
            releasedAt: 0,
            status: PaymentStatus.Pending,
            workHash: ""
        });

        projectPayments[_projectId] = paymentCounter;

        emit PaymentCreated(
            paymentCounter,
            _projectId,
            msg.sender,
            project.freelancer,
            _amount
        );

        // Si es AVAX, recibir el pago directamente
        if (_token == address(0)) {
            require(msg.value == _amount, "EscrowPayment: AVAX amount mismatch");
            payments[paymentCounter].status = PaymentStatus.Funded;
            payments[paymentCounter].fundedAt = block.timestamp;
            emit PaymentFunded(paymentCounter, msg.sender, _amount);
        } else {
            // Para tokens ERC20, el usuario debe hacer approve primero
            // Este contrato debería llamar transferFrom después
            revert("EscrowPayment: ERC20 funding not implemented yet");
        }

        return paymentCounter;
    }

    /**
     * @dev Fondea un pago con tokens ERC20
     * @param _paymentId ID del pago
     */
    function fundPaymentWithToken(uint256 _paymentId) external nonReentrant validPayment(_paymentId) {
        Payment storage payment = payments[_paymentId];
        require(
            payment.status == PaymentStatus.Pending,
            "EscrowPayment: Payment not in pending status"
        );
        require(payment.client == msg.sender, "EscrowPayment: Only client can fund");
        require(payment.token != address(0), "EscrowPayment: Use createPayment for AVAX");

        IERC20 token = IERC20(payment.token);
        require(
            token.transferFrom(msg.sender, address(this), payment.amount),
            "EscrowPayment: Token transfer failed"
        );

        payment.status = PaymentStatus.Funded;
        payment.fundedAt = block.timestamp;

        emit PaymentFunded(_paymentId, msg.sender, payment.amount);
    }

    /**
     * @dev Libera el pago al freelancer después de completar el trabajo
     * @param _paymentId ID del pago
     * @param _workHash Hash IPFS del trabajo completado
     * @param _rating Rating del trabajo (1-5)
     */
    function releasePayment(
        uint256 _paymentId,
        string memory _workHash,
        uint256 _rating
    ) external nonReentrant validPayment(_paymentId) {
        Payment storage payment = payments[_paymentId];
        require(
            payment.status == PaymentStatus.Funded,
            "EscrowPayment: Payment must be funded"
        );
        require(
            payment.client == msg.sender,
            "EscrowPayment: Only client can release payment"
        );
        require(
            projectManager.getProject(payment.projectId).status ==
                ProjectManager.ProjectStatus.Completed,
            "EscrowPayment: Project must be completed"
        );

        uint256 fee = (payment.amount * platformFee) / 10000;
        uint256 freelancerAmount = payment.amount - fee;

        // Transferir fondos
        if (payment.token == address(0)) {
            // AVAX
            (bool successFee, ) = feeRecipient.call{value: fee}("");
            (bool successFreelancer, ) = payment.freelancer.call{value: freelancerAmount}("");
            require(successFee && successFreelancer, "EscrowPayment: Transfer failed");
        } else {
            // ERC20
            IERC20 token = IERC20(payment.token);
            require(token.transfer(feeRecipient, fee), "EscrowPayment: Fee transfer failed");
            require(
                token.transfer(payment.freelancer, freelancerAmount),
                "EscrowPayment: Freelancer transfer failed"
            );
        }

        payment.status = PaymentStatus.Released;
        payment.releasedAt = block.timestamp;
        payment.workHash = _workHash;

        // Registrar trabajo en UserStatistics
        userStatistics.recordWork(
            payment.freelancer,
            payment.projectId,
            payment.client,
            freelancerAmount,
            _workHash,
            _rating
        );

        emit PaymentReleased(_paymentId, payment.freelancer, freelancerAmount, fee);
    }

    /**
     * @dev Reembolsa el pago al cliente
     * @param _paymentId ID del pago
     */
    function refundPayment(uint256 _paymentId)
        external
        nonReentrant
        validPayment(_paymentId)
    {
        Payment storage payment = payments[_paymentId];
        require(
            payment.status == PaymentStatus.Funded,
            "EscrowPayment: Payment must be funded"
        );
        require(
            payment.client == msg.sender || msg.sender == owner(),
            "EscrowPayment: Unauthorized refund"
        );

        // Transferir de vuelta al cliente
        if (payment.token == address(0)) {
            (bool success, ) = payment.client.call{value: payment.amount}("");
            require(success, "EscrowPayment: Refund transfer failed");
        } else {
            IERC20 token = IERC20(payment.token);
            require(
                token.transfer(payment.client, payment.amount),
                "EscrowPayment: Refund transfer failed"
            );
        }

        payment.status = PaymentStatus.Refunded;

        emit PaymentRefunded(_paymentId, payment.client, payment.amount);
    }

    /**
     * @dev Obtiene un pago completo
     * @param _paymentId ID del pago
     * @return Payment pago completo
     */
    function getPayment(uint256 _paymentId)
        external
        view
        validPayment(_paymentId)
        returns (Payment memory)
    {
        return payments[_paymentId];
    }

    /**
     * @dev Obtiene el ID de pago de un proyecto
     * @param _projectId ID del proyecto
     * @return uint256 ID del pago
     */
    function getPaymentByProject(uint256 _projectId)
        external
        view
        returns (uint256)
    {
        return projectPayments[_projectId];
    }

    /**
     * @dev Establece el fee de la plataforma
     * @param _fee Nuevo fee en basis points
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "EscrowPayment: Fee too high (max 10%)");
        platformFee = _fee;
    }

    /**
     * @dev Establece el recipient del fee
     * @param _feeRecipient Nuevo address para recibir fees
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "EscrowPayment: Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // Función para recibir AVAX
    receive() external payable {}
}

