require("dotenv/config");
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with address: ${deployer.address}`);

  const initialSupply = process.env.INITIAL_SUPPLY || "1000000";
  const taxRate = process.env.TAX_RATE || "3";

  // 1. Deploy Token
  const NeoGuilder = await hre.ethers.getContractFactory("NeoGuilder");
  const neoGuilder = await NeoGuilder.deploy(initialSupply, taxRate);
  await neoGuilder.waitForDeployment();
  const neoGuilderAddress = await neoGuilder.getAddress();
  console.log(`NeoGuilder token deployed at: ${neoGuilderAddress}`);

  // 2. Deploy NFT
  const NeoGuilderNFT = await hre.ethers.getContractFactory("NeoGuilderNFT");
  const nft = await NeoGuilderNFT.deploy(neoGuilderAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log(`NeoGuilderNFT deployed at: ${nftAddress}`);

  // 3. Deploy KYC
  const KYC = await hre.ethers.getContractFactory("KYC");
  const kyc = await KYC.deploy(deployer.address);
  await kyc.waitForDeployment();
  const kycAddress = await kyc.getAddress();
  console.log(`KYC deployed at: ${kycAddress}`);

  // 4. Deploy Reputation
  const Reputation = await hre.ethers.getContractFactory("Reputation");
  const reputation = await Reputation.deploy(deployer.address);
  await reputation.waitForDeployment();
  const reputationAddress = await reputation.getAddress();
  console.log(`Reputation deployed at: ${reputationAddress}`);

  // 5. Deploy Sustainability
  const AutoSustainability = await hre.ethers.getContractFactory("AutoSustainability");
  const sustainability = await AutoSustainability.deploy(deployer.address, neoGuilderAddress, deployer.address);
  await sustainability.waitForDeployment();
  const sustainabilityAddress = await sustainability.getAddress();
  console.log(`AutoSustainability deployed at: ${sustainabilityAddress}`);

  // 6. Deploy Timelock
  const Timelock = await hre.ethers.getContractFactory("TimelockController");
  const timelock = await Timelock.deploy(3600, [deployer.address], [deployer.address], deployer.address);
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log(`TimelockController deployed at: ${timelockAddress}`);

  // 7. Deploy DAO
  const NeoGuilderDAO = await hre.ethers.getContractFactory("NeoGuilderDAO");
  const dao = await NeoGuilderDAO.deploy(neoGuilderAddress, timelockAddress);
  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();
  console.log(`NeoGuilderDAO deployed at: ${daoAddress}`);

  // 8. Deploy FakeDAO (testing only)
  const FakeDAO = await hre.ethers.getContractFactory("FakeDAO");
  const fakeDao = await FakeDAO.deploy();
  await fakeDao.waitForDeployment();
  const fakeDaoAddress = await fakeDao.getAddress();
  console.log(`FakeDAO deployed at: ${fakeDaoAddress}`);

  // 9. Set FakeDAO as DAO in all modules using onlyDAO
  await neoGuilder.setDAOAddress(fakeDaoAddress);

  const kycIface = (await hre.ethers.getContractFactory("KYC")).interface;
  const callDataKYC = kycIface.encodeFunctionData("transferDAO", [fakeDaoAddress]);
  const repIface = (await hre.ethers.getContractFactory("Reputation")).interface;
  const callDataRep = repIface.encodeFunctionData("transferDAO", [fakeDaoAddress]);
  const sustIface = (await hre.ethers.getContractFactory("AutoSustainability")).interface;
  const callDataSust = sustIface.encodeFunctionData("transferDAO", [fakeDaoAddress]);

  // 10. Token knows sustainability contract
  await neoGuilder.setAutoSustainabilityContract(sustainabilityAddress);

  // 11. DAO contract sets dependencies (useful for production only)
  await dao.setKYCContract(kycAddress);
  await dao.setReputationContract(reputationAddress);
  await dao.setAutoSustainabilityContract(sustainabilityAddress);

  // 12. Save all addresses
  const deployments = {
    NeoGuilder: neoGuilderAddress,
    NeoGuilderNFT: nftAddress,
    KYC: kycAddress,
    Reputation: reputationAddress,
    AutoSustainability: sustainabilityAddress,
    Timelock: timelockAddress,
    NeoGuilderDAO: daoAddress,
    FakeDAO: fakeDaoAddress
  };

  fs.writeFileSync("deployed.json", JSON.stringify(deployments, null, 2));
  console.log("✅ Contracts saved to deployed.json");
  console.log("✅ Deployment complete.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});