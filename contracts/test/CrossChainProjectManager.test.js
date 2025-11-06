const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrossChainProjectManager", function () {
  let userRegistry;
  let projectManager;
  let crossChainProjectManager;
  let crossChainManager;
  let mockICM;
  let mockTeleporter;
  let owner;
  let client;
  let freelancer;

  const FUJI_C_CHAIN_ID = ethers.zeroPadValue(ethers.toBeHex(43113), 32);

  beforeEach(async function () {
    [owner, client, freelancer] = await ethers.getSigners();

    // Deploy UserRegistry
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();

    // Register users
    await userRegistry.connect(client).registerUser(
      "client",
      "client@example.com",
      "ipfs-client",
      false,
      true
    );

    await userRegistry.connect(freelancer).registerUser(
      "freelancer",
      "freelancer@example.com",
      "ipfs-freelancer",
      true,
      false
    );

    // Deploy ProjectManager
    const ProjectManager = await ethers.getContractFactory("ProjectManager");
    projectManager = await ProjectManager.deploy(await userRegistry.getAddress());
    await projectManager.waitForDeployment();

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

    // Deploy CrossChainProjectManager
    const CrossChainProjectManager = await ethers.getContractFactory("CrossChainProjectManager");
    crossChainProjectManager = await CrossChainProjectManager.deploy(
      await userRegistry.getAddress(),
      await crossChainManager.getAddress()
    );
    await crossChainProjectManager.waitForDeployment();

    // Register chain contract
    await crossChainManager.connect(owner).registerChainContract(
      FUJI_C_CHAIN_ID,
      await crossChainProjectManager.getAddress()
    );
  });

  describe("Cross-Chain Project Creation", function () {
    it("Should create a cross-chain project", async function () {
      const title = "Test Project";
      const description = "Test Description";
      const requirementsHash = "ipfs-requirements";
      const budget = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days
      const gasLimit = 500000;

      const tx = await crossChainProjectManager.connect(client).createCrossChainProject(
        title,
        description,
        requirementsHash,
        budget,
        deadline,
        FUJI_C_CHAIN_ID,
        gasLimit,
        { value: ethers.parseEther("0.01") }
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Verify project was created locally
      const projectId = await crossChainProjectManager.projectCounter();
      expect(projectId).to.equal(1n);
    });

    it("Should mark project as cross-chain", async function () {
      const title = "Test Project";
      const description = "Test Description";
      const requirementsHash = "ipfs-requirements";
      const budget = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      const gasLimit = 500000;

      await crossChainProjectManager.connect(client).createCrossChainProject(
        title,
        description,
        requirementsHash,
        budget,
        deadline,
        FUJI_C_CHAIN_ID,
        gasLimit,
        { value: ethers.parseEther("0.01") }
      );

      const projectId = 1;
      const isCrossChain = await crossChainProjectManager.isCrossChainProject(projectId);
      expect(isCrossChain).to.be.true;
    });

    it("Should get cross-chain project info", async function () {
      const title = "Test Project";
      const description = "Test Description";
      const requirementsHash = "ipfs-requirements";
      const budget = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;
      const gasLimit = 500000;

      await crossChainProjectManager.connect(client).createCrossChainProject(
        title,
        description,
        requirementsHash,
        budget,
        deadline,
        FUJI_C_CHAIN_ID,
        gasLimit,
        { value: ethers.parseEther("0.01") }
      );

      const projectId = 1;
      const crossChainInfo = await crossChainProjectManager.getCrossChainProjectInfo(projectId);
      expect(crossChainInfo.isCrossChain).to.be.true;
      expect(crossChainInfo.destinationChainId).to.equal(FUJI_C_CHAIN_ID);
    });
  });

  describe("Regular Project Creation", function () {
    it("Should still allow regular project creation", async function () {
      const title = "Regular Project";
      const description = "Regular Description";
      const requirementsHash = "ipfs-requirements";
      const budget = ethers.parseEther("5");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;

      const tx = await crossChainProjectManager.connect(client).createProject(
        title,
        description,
        requirementsHash,
        budget,
        deadline
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const projectId = await crossChainProjectManager.projectCounter();
      expect(projectId).to.equal(1n);

      const isCrossChain = await crossChainProjectManager.isCrossChainProject(projectId);
      expect(isCrossChain).to.be.false;
    });
  });
});

