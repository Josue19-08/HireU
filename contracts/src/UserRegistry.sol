// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserRegistry
 * @dev Registro de usuarios con verificación y propiedad de datos
 * @notice Todos los datos de usuarios son inmutables y propiedad del usuario
 */
contract UserRegistry {
    struct UserProfile {
        address userAddress;
        string username;
        string email;
        string profileHash; // IPFS hash del perfil
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
        address verifier; // Address que verificó (puede ser el mismo usuario o un oráculo)
    }

    // Mapping de address a perfil de usuario
    mapping(address => UserProfile) public userProfiles;
    
    // Mapping de address a datos de verificación
    mapping(address => VerificationData) public verifications;
    
    // Mapping para verificar si un username ya está en uso
    mapping(string => bool) public usernameTaken;
    
    // Mapping para verificar si un email ya está registrado
    mapping(string => bool) public emailRegistered;
    
    // Eventos
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
     * @dev Registra un nuevo usuario en la plataforma
     * @param _username Nombre de usuario único
     * @param _email Email del usuario
     * @param _profileHash Hash IPFS del perfil completo
     * @param _isFreelancer Si el usuario es freelancer
     * @param _isClient Si el usuario es cliente
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
     * @dev Actualiza el perfil del usuario (solo el usuario puede actualizar su perfil)
     * @param _profileHash Nuevo hash IPFS del perfil
     * @notice Los datos históricos permanecen inmutables, solo se actualiza el hash
     */
    function updateProfile(string memory _profileHash) external onlyRegistered {
        require(bytes(_profileHash).length > 0, "UserRegistry: Profile hash cannot be empty");
        
        userProfiles[msg.sender].profileHash = _profileHash;
        userProfiles[msg.sender].lastUpdateDate = block.timestamp;

        emit ProfileUpdated(msg.sender, _profileHash);
    }

    /**
     * @dev Verifica un usuario (puede ser auto-verificación o por oráculo)
     * @param _user Address del usuario a verificar
     * @param _verificationMethod Método de verificación usado
     * @notice Solo el usuario mismo o un oráculo autorizado puede verificar
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
            msg.sender == _user || msg.sender == address(this), // Permitir auto-verificación o oráculo
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
     * @dev Obtiene el perfil completo de un usuario
     * @param _user Address del usuario
     * @return UserProfile completo del usuario
     */
    function getUserProfile(address _user) external view returns (UserProfile memory) {
        require(
            userProfiles[_user].registrationDate > 0,
            "UserRegistry: User not registered"
        );
        return userProfiles[_user];
    }

    /**
     * @dev Obtiene los datos de verificación de un usuario
     * @param _user Address del usuario
     * @return VerificationData datos de verificación
     */
    function getVerificationData(address _user) external view returns (VerificationData memory) {
        return verifications[_user];
    }

    /**
     * @dev Verifica si un usuario está registrado
     * @param _user Address del usuario
     * @return bool true si está registrado
     */
    function isUserRegistered(address _user) external view returns (bool) {
        return userProfiles[_user].registrationDate > 0;
    }

    /**
     * @dev Verifica si un usuario está verificado
     * @param _user Address del usuario
     * @return bool true si está verificado
     */
    function isUserVerified(address _user) external view returns (bool) {
        return userProfiles[_user].isVerified && verifications[_user].isVerified;
    }
}

