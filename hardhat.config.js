require('@nomicfoundation/hardhat-ethers');
require('dotenv').config();


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: 'https://sepolia.infura.io/v3/c52322527c514bb992462d1a1e5e4269',
      accounts: [`0x${process.env.MNEMONIC}`],
    }
  }
};
