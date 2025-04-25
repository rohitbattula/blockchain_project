async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    const JobBoard = await ethers.getContractFactory("JobBoard");
    const jobBoard = await JobBoard.deploy();
    console.log("JobBoard contract deployed to:", jobBoard.address);
  
    const DAOHiring = await ethers.getContractFactory("DAOHiring");
    const daoHiring = await DAOHiring.deploy();
    console.log("DAOHiring contract deployed to:", daoHiring.address);
  
    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    const reputationSystem = await ReputationSystem.deploy();
    console.log("ReputationSystem contract deployed to:", reputationSystem.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  