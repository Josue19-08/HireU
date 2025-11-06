const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProjectManager", function () {
  let userRegistry;
  let projectManager;
  let owner;
  let client;
  let freelancer;

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
  });

  describe("Project Creation", function () {
    it("Should create a new project", async function () {
      const title = "Test Project";
      const description = "Test Description";
      const requirementsHash = "ipfs-requirements";
      const budget = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days

      const tx = await projectManager.connect(client).createProject(
        title,
        description,
        requirementsHash,
        budget,
        deadline
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      const projectId = await projectManager.projectCounter();
      expect(projectId).to.equal(1n);

      const project = await projectManager.getProject(1);
      expect(project.title).to.equal(title);
      expect(project.client).to.equal(client.address);
      expect(project.status).to.equal(0); // Draft
    });

    it("Should not allow non-clients to create projects", async function () {
      const title = "Test Project";
      const description = "Test Description";
      const requirementsHash = "ipfs-requirements";
      const budget = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;

      await expect(
        projectManager.connect(freelancer).createProject(
          title,
          description,
          requirementsHash,
          budget,
          deadline
        )
      ).to.be.revertedWith("ProjectManager: Only clients can create projects");
    });
  });

  describe("Project Publishing", function () {
    let projectId;

    beforeEach(async function () {
      const title = "Test Project";
      const description = "Test Description";
      const requirementsHash = "ipfs-requirements";
      const budget = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;

      const tx = await projectManager.connect(client).createProject(
        title,
        description,
        requirementsHash,
        budget,
        deadline
      );
      const receipt = await tx.wait();
      projectId = 1;
    });

    it("Should publish a project", async function () {
      await projectManager.connect(client).publishProject(projectId);
      
      const project = await projectManager.getProject(projectId);
      expect(project.status).to.equal(1); // Published
    });

    it("Should not allow non-client to publish", async function () {
      await expect(
        projectManager.connect(freelancer).publishProject(projectId)
      ).to.be.revertedWith("ProjectManager: Only client can perform this action");
    });
  });

  describe("Freelancer Assignment", function () {
    let projectId;

    beforeEach(async function () {
      const title = "Test Project";
      const description = "Test Description";
      const requirementsHash = "ipfs-requirements";
      const budget = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400 * 30;

      await projectManager.connect(client).createProject(
        title,
        description,
        requirementsHash,
        budget,
        deadline
      );
      projectId = 1;
      await projectManager.connect(client).publishProject(projectId);
    });

    it("Should assign a freelancer", async function () {
      await projectManager.connect(client).assignFreelancer(projectId, freelancer.address);
      
      const project = await projectManager.getProject(projectId);
      expect(project.freelancer).to.equal(freelancer.address);
      expect(project.status).to.equal(2); // InProgress
    });
  });
});

