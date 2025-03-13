require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();
const { HardhatUserConfig } = require("hardhat/config");

const my_url = process.env.MY_URL;
const my_accounts = process.env.MY_ACCOUNTS ? process.env.MY_ACCOUNTS.split(',').map(acc => acc.trim()) : [];
const my_api_key = process.env.API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
  },
  networks: {
    sepolia: {
      url: my_url,
      accounts: my_accounts
    }
  },
  etherscan: {
    apiKey: my_api_key
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  }
};


