// scripts/deploy.js
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // 1️⃣ Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👷‍♂️  Deploying contracts with account:", deployer.address);

  // 2️⃣ Deploy ReputationSystem
  const RepFactory = await ethers.getContractFactory("ReputationSystem");
  const reputation = await RepFactory.deploy();
  // waitUntil on‐chain
  await reputation.waitForDeployment();
  console.log("✅ ReputationSystem deployed to:", reputation.target);

  // 3️⃣ Deploy JobBoard, passing in the reputation system address
  const JBFactory = await ethers.getContractFactory("JobBoard");
  const jobBoard = await JBFactory.deploy(reputation.target);
  await jobBoard.waitForDeployment();
  console.log("✅ JobBoard deployed to:", jobBoard.target);

  // If you have other contracts to deploy, do it here...
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  });
