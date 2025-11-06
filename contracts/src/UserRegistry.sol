// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserRegistry
 * @dev User registration with verification and data ownership
 * @notice All user data is immutable and owned by the user
 */
contract UserRegistry {
    struct UserProfile {
        address userAddress;
        string username;
        string email;
        string profileHash; // IPFS hash of the profile
        bool isVerified;
        bool isFreelancer;
        bool isClient;
        uint256 registrationDate;
        uint256 lastUpdateDate;
    }

    struct VerificationData {
        bool isVerified;
        string verificationMethod; // "KYC", "SOCIAL", "REPUTATION"
        uint256 verificationDate;
        address verifier; // Address that verified (can be the user themselves or an oracle)
    }

    // Mapping from address to user profile
    mapping(address => UserProfile) public userProfiles;
    
    // Mapping from address to verification data
    mapping(address => VerificationData) public verifications;
    
    // Mapping to check if a username is already taken
    mapping(string => bool) public usernameTaken;
    
    // Mapping to check if an email is already registered
    mapping(string => bool) public emailRegistered;
    
    // Events
    event UserRegistered(
        address indexed user,
        string username,
        bool isFreelancer,
        bool isClient
    );
    
    event UserVerified(
        address indexed user,
        string verificationMethod,
        address indexed verifier
    );
    
    event ProfileUpdated(
        address indexed user,
        string profileHash
    );

    modifier onlyRegistered() {
        require(
            userProfiles[msg.sender].registrationDate > 0,
            "UserRegistry: User not registered"
        );
        _;
    }

    modifier onlyUnregistered() {
        require(
            userProfiles[msg.sender].registrationDate == 0,
            "UserRegistry: User already registered"
        );
        _;
    }

    /**
     * @dev Registers a new user on the platform
     * @param _username Unique username
     * @param _email User email
     * @param _profileHash IPFS hash of the complete profile
     * @param _isFreelancer Whether the user is a freelancer
     * @param _isClient Whether the user is a client
     */
    function registerUser(
        string memory _username,
        string memory _email,
        string memory _profileHash,
        bool _isFreelancer,
        bool _isClient
    ) external onlyUnregistered {
        require(bytes(_username).length > 0, "UserRegistry: Username cannot be empty");
        require(bytes(_email).length > 0, "UserRegistry: Email cannot be empty");
        require(!usernameTaken[_username], "UserRegistry: Username already taken");
        require(!emailRegistered[_email], "UserRegistry: Email already registered");
        require(_isFreelancer || _isClient, "UserRegistry: Must be freelancer or client");

        userProfiles[msg.sender] = UserProfile({
            userAddress: msg.sender,
            username: _username,
            email: _email,
            profileHash: _profileHash,
            isVerified: false,
            isFreelancer: _isFreelancer,
            isClient: _isClient,
            registrationDate: block.timestamp,
            lastUpdateDate: block.timestamp
        });

        usernameTaken[_username] = true;
        emailRegistered[_email] = true;

        emit UserRegistered(msg.sender, _username, _isFreelancer, _isClient);
    }

    /**
     * @dev Updates the user profile (only the user can update their profile)
     * @param _profileHash New IPFS hash of the profile
     * @notice Historical data remains immutable, only the hash is updated
     */
    function updateProfile(string memory _profileHash) external onlyRegistered {
        require(bytes(_profileHash).length > 0, "UserRegistry: Profile hash cannot be empty");
        
        userProfiles[msg.sender].profileHash = _profileHash;
        userProfiles[msg.sender].lastUpdateDate = block.timestamp;

        emit ProfileUpdated(msg.sender, _profileHash);
    }

    /**
     * @dev Verifies a user (can be self-verification or by oracle)
     * @param _user Address of the user to verify
     * @param _verificationMethod Verification method used
     * @notice Only the user themselves or an authorized oracle can verify
     */
    function verifyUser(
        address _user,
        string memory _verificationMethod
    ) external {
        require(
            userProfiles[_user].registrationDate > 0,
            "UserRegistry: User not registered"
        );
        require(
            msg.sender == _user || msg.sender == address(this), // Allow self-verification or oracle
            "UserRegistry: Unauthorized verification"
        );

        verifications[_user] = VerificationData({
            isVerified: true,
            verificationMethod: _verificationMethod,
            verificationDate: block.timestamp,
            verifier: msg.sender
        });

        userProfiles[_user].isVerified = true;

        emit UserVerified(_user, _verificationMethod, msg.sender);
    }

    /**
     * @dev Gets the complete profile of a user
     * @param _user Address of the user
     * @return UserProfile complete user profile
     */
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        require(
            userProfiles[_user].registrationDate > 0,
            "UserRegistry: User not registered"
        );
        return userProfiles[_user];
    }

    /**
     * @dev Gets the verification data of a user
     * @param _user Address of the user
     * @return VerificationData verification data
     */
    function getVerificationData(address _user) external view returns (VerificationData memory) {
        return verifications[_user];
    }

    /**
     * @dev Checks if a user is registered
     * @param _user Address of the user
     * @return bool true if registered
     */
    function isUserRegistered(address _user) external view returns (bool) {
        return userProfiles[_user].registrationDate > 0;
    }

    /**
     * @dev Checks if a user is verified
     * @param _user Address of the user
     * @return bool true if verified
     */
    function isUserVerified(address _user) external view returns (bool) {
        return userProfiles[_user].isVerified && verifications[_user].isVerified;
    }
}

