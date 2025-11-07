const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserRegistry", function () {
  let userRegistry;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();
  });

  describe("Registration", function () {
    it("Should register a new user", async function () {
      await userRegistry.connect(user1).registerUser(
        "alice",
        "alice@example.com",
        "ipfs-hash-123",
        true, // isFreelancer
        false // isClient
      );

      const profile = await userRegistry.getUserProfile(user1.address);
      expect(profile.username).to.equal("alice");
      expect(profile.isFreelancer).to.be.true;
      expect(profile.isClient).to.be.false;
    });

    it("Should not allow duplicate usernames", async function () {
      await userRegistry.connect(user1).registerUser(
        "alice",
        "alice@example.com",
        "ipfs-hash-123",
        true,
        false
      );

      await expect(
        userRegistry.connect(user2).registerUser(
          "alice",
          "bob@example.com",
          "ipfs-hash-456",
          true,
          false
        )
      ).to.be.revertedWith("UserRegistry: Username already taken");
    });

    it("Should not allow duplicate emails", async function () {
      await userRegistry.connect(user1).registerUser(
        "alice",
        "alice@example.com",
        "ipfs-hash-123",
        true,
        false
      );

      await expect(
        userRegistry.connect(user2).registerUser(
          "bob",
          "alice@example.com",
          "ipfs-hash-456",
          true,
          false
        )
      ).to.be.revertedWith("UserRegistry: Email already registered");
    });

    it("Should require user to be freelancer or client", async function () {
      await expect(
        userRegistry.connect(user1).registerUser(
          "alice",
          "alice@example.com",
          "ipfs-hash-123",
          false,
          false
        )
      ).to.be.revertedWith("UserRegistry: Must be freelancer or client");
    });
  });

  describe("Profile Updates", function () {
    beforeEach(async function () {
      await userRegistry.connect(user1).registerUser(
        "alice",
        "alice@example.com",
        "ipfs-hash-123",
        true,
        false
      );
    });

    it("Should allow user to update their profile", async function () {
      await userRegistry.connect(user1).updateProfile("ipfs-hash-456");
      const profile = await userRegistry.getUserProfile(user1.address);
      expect(profile.profileHash).to.equal("ipfs-hash-456");
    });

    it("Should not allow other users to update profile", async function () {
      await expect(
        userRegistry.connect(user2).updateProfile("ipfs-hash-456")
      ).to.be.revertedWith("UserRegistry: User not registered");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      await userRegistry.connect(user1).registerUser(
        "alice",
        "alice@example.com",
        "ipfs-hash-123",
        true,
        false
      );
    });

    it("Should allow user to verify themselves", async function () {
      await userRegistry.connect(user1).verifyUser(user1.address, "KYC");
      const isVerified = await userRegistry.isUserVerified(user1.address);
      expect(isVerified).to.be.true;
    });
  });
});

