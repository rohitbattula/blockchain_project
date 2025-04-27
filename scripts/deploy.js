// scripts/deploy.js
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  // 1. Deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 2. DAOHiring
  const DAOHiringFactory = await hre.ethers.getContractFactory("DAOHiring");
  const daoHiring = await DAOHiringFactory.deploy(/* constructor args if any */);
  await daoHiring.waitForDeployment();
  console.log("→ DAOHiring deployed to:", daoHiring.target);

  // 3. JobBoard
  const JobBoardFactory = await hre.ethers.getContractFactory("JobBoard");
  const jobBoard = await JobBoardFactory.deploy();
  await jobBoard.waitForDeployment();
  console.log("→ JobBoard deployed to:", jobBoard.target);

  // 4. ReputationSystem
  const ReputationFactory = await hre.ethers.getContractFactory("ReputationSystem");
  const reputation = await ReputationFactory.deploy();
  await reputation.waitForDeployment();
  console.log("→ ReputationSystem deployed to:", reputation.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
