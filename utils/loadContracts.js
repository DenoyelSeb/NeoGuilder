const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

function loadABI(contractName) {
  const artifact = require(path.join(
    __dirname,
    `../artifacts/contracts/${contractName}.sol/${contractName}.json`
  ));
  return artifact.abi;
}

async function loadContracts() {
  const addresses = JSON.parse(fs.readFileSync("deployed.json", "utf-8"));
  const [signer] = await ethers.getSigners();

  return {
    token: new ethers.Contract(addresses.NeoGuilder, loadABI("NeoGuilder"), signer),
    nft: new ethers.Contract(addresses.NeoGuilderNFT, loadABI("NeoGuilderNFT"), signer),
    kyc: new ethers.Contract(addresses.KYC, loadABI("KYC"), signer),
    reputation: new ethers.Contract(addresses.Reputation, loadABI("Reputation"), signer),
    sustainability: new ethers.Contract(addresses.AutoSustainability, loadABI("AutoSustainability"), signer),
    dao: new ethers.Contract(addresses.NeoGuilderDAO, loadABI("NeoGuilderDAO"), signer),
    timelock: new ethers.Contract(addresses.Timelock, loadABI("TimelockController"), signer),
  };
}

module.exports = { loadContracts };