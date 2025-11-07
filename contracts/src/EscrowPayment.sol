// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ProjectManager.sol";
import "./UserStatistics.sol";

/**
 * @title EscrowPayment
 * @dev Payment system with escrow using SRCW (Smart Contract Revenue Wallets)
 * @notice Integrates smart wallets to manage payments securely
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
        address token; // Token address (address(0) for AVAX)
        uint256 amount;
        uint256 fundedAt;
        uint256 releasedAt;
        PaymentStatus status;
        string workHash; // IPFS hash of the work verified
    }

    struct SRCWWalletInfo {
        address walletAddress;
        address owner;
        bool isActive;
        uint256 balance;
    }
    
    // Mapping from paymentId to Payment
    mapping(uint256 => Payment) public payments;
    
    // Mapping from projectId to paymentId
    mapping(uint256 => uint256) public projectPayments;
    
    // Mapping from address to SRCWWalletInfo
    mapping(address => SRCWWalletInfo) public srcwWallets;
    
    // Mapping separate for token balances (address => token => balance)
    mapping(address => mapping(address => uint256)) public srcwTokenBalances;
    
    // Counter for pagos
    uint256 public paymentCounter;
    
    // References to other contracts
    ProjectManager public projectManager;
    UserStatistics public userStatistics;
    
    // Fee of the contract (in basis points, 100 = 1%)
    uint256 public platformFee = 250; // 2.5%
    address public feeRecipient;

    // Events
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
     * @dev Creates an SRCW wallet for a user
     * @param _owner Address of the owner of the wallet
     * @return address Address of the wallet created
     */
    function createSRCWWallet(address _owner) external returns (address) {
        require(_owner != address(0), "EscrowPayment: Invalid owner address");
        require(
            !srcwWallets[_owner].isActive,
            "EscrowPayment: Wallet already exists"
        );

        // In production, this would be a deployed wallet contract
        // For now, we use the user address as wallet
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
     * @dev Creates a payment in escrow for a project
     * @param _projectId Project ID
     * @param _token Token address (address(0) for AVAX)
     * @param _amount Amount to deposit
     * @return uint256 Payment ID created
     */
    function createPayment(
        uint256 _projectId,
        address _token,
        uint256 _amount
    ) external payable nonReentrant returns (uint256) {
        require(_amount > 0, "EscrowPayment: Amount must be greater than 0");
        
        // Verify that the project exists and is in status correct
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

        // If it is AVAX, receive the payment directly
        if (_token == address(0)) {
            require(msg.value == _amount, "EscrowPayment: AVAX amount mismatch");
            payments[paymentCounter].status = PaymentStatus.Funded;
            payments[paymentCounter].fundedAt = block.timestamp;
            emit PaymentFunded(paymentCounter, msg.sender, _amount);
        } else {
            // For ERC20 tokens, the user must approve first
            // This contract should call transferFrom afterwards
            revert("EscrowPayment: ERC20 funding not implemented yet");
        }

        return paymentCounter;
    }

    /**
     * @dev Funds a payment with ERC20 tokens
     * @param _paymentId Payment ID
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
     * @dev Releases the payment to the freelancer after completing the work
     * @param _paymentId Payment ID
     * @param _workHash IPFS hash of the work completedo
     * @param _rating Work rating (1-5)
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

        // Register work in UserStatistics
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
     * @dev Refunds the payment to the client
     * @param _paymentId Payment ID
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

        // Transferir de vuelta to the client
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
     * @dev Gets a payment completo
     * @param _paymentId Payment ID
     * @return Payment complete payment
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
     * @dev Gets the payment ID of a project
     * @param _projectId Project ID
     * @return uint256 Payment ID
     */
    function getPaymentByProject(uint256 _projectId)
        external
        view
        returns (uint256)
    {
        return projectPayments[_projectId];
    }

    /**
     * @dev Sets the fee of the platform
     * @param _fee New fee in basis points
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "EscrowPayment: Fee too high (max 10%)");
        platformFee = _fee;
    }

    /**
     * @dev Sets the recipient of the fee
     * @param _feeRecipient New address to receive fees
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "EscrowPayment: Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // Function to receive AVAX
    receive() external payable {}
}

