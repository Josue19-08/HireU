const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying OFFER-HUB contracts...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Desplegando con la cuenta:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "AVAX\n");

  // 1. Desplegar UserRegistry
  console.log("1️⃣ Desplegando UserRegistry...");
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("✅ UserRegistry desplegado en:", userRegistryAddress);

  // 2. Desplegar UserStatistics
  console.log("\n2️⃣ Desplegando UserStatistics...");
  const UserStatistics = await hre.ethers.getContractFactory("UserStatistics");
  const userStatistics = await UserStatistics.deploy();
  await userStatistics.waitForDeployment();
  const userStatisticsAddress = await userStatistics.getAddress();
  console.log("✅ UserStatistics desplegado en:", userStatisticsAddress);

  // 3. Desplegar ProjectManager
  console.log("\n3️⃣ Desplegando ProjectManager...");
  const ProjectManager = await hre.ethers.getContractFactory("ProjectManager");
  const projectManager = await ProjectManager.deploy(userRegistryAddress);
  await projectManager.waitForDeployment();
  const projectManagerAddress = await projectManager.getAddress();
  console.log("✅ ProjectManager desplegado en:", projectManagerAddress);

  // 4. Desplegar EscrowPayment
  console.log("\n4️⃣ Desplegando EscrowPayment...");
  const EscrowPayment = await hre.ethers.getContractFactory("EscrowPayment");
  const escrowPayment = await EscrowPayment.deploy(projectManagerAddress, userStatisticsAddress);
  await escrowPayment.waitForDeployment();
  const escrowPaymentAddress = await escrowPayment.getAddress();
  console.log("✅ EscrowPayment desplegado en:", escrowPaymentAddress);

  // 5. Desplegar WorkVerification
  console.log("\n5️⃣ Desplegando WorkVerification...");
  const WorkVerification = await hre.ethers.getContractFactory("WorkVerification");
  const workVerification = await WorkVerification.deploy(
    projectManagerAddress,
    userStatisticsAddress,
    escrowPaymentAddress
  );
  await workVerification.waitForDeployment();
  const workVerificationAddress = await workVerification.getAddress();
  console.log("✅ WorkVerification desplegado en:", workVerificationAddress);

  // 6. Configurar referencias cruzadas
  console.log("\n6️⃣ Configurando referencias cruzadas...");
  
  // ProjectManager -> EscrowPayment
  const setEscrowTx = await projectManager.setEscrowContract(escrowPaymentAddress);
  await setEscrowTx.wait();
  console.log("✅ ProjectManager -> EscrowPayment configurado");

  console.log("\n🎉 ¡Todos los contratos desplegados exitosamente!\n");
  console.log("📋 Resumen de direcciones:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("UserRegistry:      ", userRegistryAddress);
  console.log("UserStatistics:    ", userStatisticsAddress);
  console.log("ProjectManager:    ", projectManagerAddress);
  console.log("EscrowPayment:     ", escrowPaymentAddress);
  console.log("WorkVerification:  ", workVerificationAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Guardar direcciones en un archivo
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    contracts: {
      UserRegistry: userRegistryAddress,
      UserStatistics: userStatisticsAddress,
      ProjectManager: projectManagerAddress,
      EscrowPayment: escrowPaymentAddress,
      WorkVerification: workVerificationAddress,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment information saved in deployments/" + hre.network.name + ".json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

