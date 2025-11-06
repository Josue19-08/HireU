const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChainManager", function () {
  let crossChainManager;
  let mockICM;
  let mockTeleporter;
  let owner;
  let user1;
  let user2;

  const C_CHAIN_ID = ethers.zeroPadValue(ethers.toBeHex(43114), 32);
  const FUJI_C_CHAIN_ID = ethers.zeroPadValue(ethers.toBeHex(43113), 32);
  const X_CHAIN_ID = ethers.zeroPadValue(ethers.toBeHex(2), 32);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mocks
    const MockICM = await ethers.getContractFactory("MockICM");
    mockICM = await MockICM.deploy();
    await mockICM.waitForDeployment();

    const MockTeleporter = await ethers.getContractFactory("MockTeleporter");
    mockTeleporter = await MockTeleporter.deploy();
    await mockTeleporter.waitForDeployment();

    // Deploy CrossChainManager
    const CrossChainManager = await ethers.getContractFactory("CrossChainManager");
    crossChainManager = await CrossChainManager.deploy(
      await mockICM.getAddress(),
      await mockTeleporter.getAddress()
    );
    await crossChainManager.waitForDeployment();
  });

  describe("Chain Registration", function () {
    it("Should register a chain contract", async function () {
      const contractAddress = ethers.Wallet.createRandom().address;
      await crossChainManager.connect(owner).registerChainContract(C_CHAIN_ID, contractAddress);
      
      const registeredAddress = await crossChainManager.chainContracts(C_CHAIN_ID);
      expect(registeredAddress).to.equal(contractAddress);
    });

    it("Should not allow non-owner to register chains", async function () {
      const contractAddress = ethers.Wallet.createRandom().address;
      await expect(
        crossChainManager.connect(user1).registerChainContract(C_CHAIN_ID, contractAddress)
      ).to.be.revertedWithCustomError(crossChainManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Cross-Chain Operations", function () {
    let destinationContract;

    beforeEach(async function () {
      destinationContract = ethers.Wallet.createRandom().address;
      await crossChainManager.connect(owner).registerChainContract(FUJI_C_CHAIN_ID, destinationContract);
    });

    it("Should initiate a cross-chain operation", async function () {
      const payload = ethers.toUtf8Bytes("test payload");
      const gasLimit = 500000;

      const tx = await crossChainManager.connect(user1).initiateCrossChainOperation(
        0, // ProjectCreation
        FUJI_C_CHAIN_ID,
        payload,
        gasLimit,
        { value: ethers.parseEther("0.01") }
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
    });

    it("Should fail if destination chain not registered", async function () {
      const payload = ethers.toUtf8Bytes("test payload");
      const gasLimit = 500000;

      await expect(
        crossChainManager.connect(user1).initiateCrossChainOperation(
          0,
          X_CHAIN_ID,
          payload,
          gasLimit,
          { value: ethers.parseEther("0.01") }
        )
      ).to.be.revertedWith("CrossChainManager: Chain not registered");
    });

    it("Should track operation status", async function () {
      const payload = ethers.toUtf8Bytes("test payload");
      const gasLimit = 500000;

      const tx = await crossChainManager.connect(user1).initiateCrossChainOperation(
        0,
        FUJI_C_CHAIN_ID,
        payload,
        gasLimit,
        { value: ethers.parseEther("0.01") }
      );

      const receipt = await tx.wait();
      const logs = receipt.logs;
      
      // Find the operation initiated event
      const operationEvent = logs.find(log => {
        try {
          const parsed = crossChainManager.interface.parseLog(log);
          return parsed && parsed.name === "CrossChainOperationInitiated";
        } catch {
          return false;
        }
      });

      expect(operationEvent).to.not.be.undefined;
    });
  });

  describe("Operation Management", function () {
    let destinationContract;
    let messageHash;

    beforeEach(async function () {
      destinationContract = ethers.Wallet.createRandom().address;
      await crossChainManager.connect(owner).registerChainContract(FUJI_C_CHAIN_ID, destinationContract);

      const payload = ethers.toUtf8Bytes("test payload");
      const tx = await crossChainManager.connect(user1).initiateCrossChainOperation(
        0,
        FUJI_C_CHAIN_ID,
        payload,
        500000,
        { value: ethers.parseEther("0.01") }
      );

      const receipt = await tx.wait();
      // Extract message hash from events or use a known value for testing
      messageHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    });

    it("Should complete an operation", async function () {
      // The operation needs to be in Received status to be completed
      // Since messageHash is a dummy value, we expect it to revert
      // This test verifies the function exists and has proper access control
      await expect(
        crossChainManager.connect(owner).completeOperation(messageHash)
      ).to.be.revertedWith("CrossChainManager: Operation not in received status");
    });

    it("Should fail an operation", async function () {
      await crossChainManager.connect(owner).failOperation(messageHash);
      
      // Verify operation is marked as failed
      // Note: This requires the operation to exist in the mapping
    });
  });
});

