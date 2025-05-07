const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NeoGuilder Functional Modules", function () {
  let kyc, reputation, sustainability, token, deployer, user;

  before(async () => {
    [deployer, user] = await ethers.getSigners();

    // Deploy token
    const Token = await ethers.getContractFactory("NeoGuilder");
    token = await Token.deploy("1000000", 3);

    // Deploy KYC
    const KYC = await ethers.getContractFactory("KYC");
    kyc = await KYC.deploy(await deployer.getAddress());

    // Deploy Reputation
    const Reputation = await ethers.getContractFactory("Reputation");
    reputation = await Reputation.deploy(await deployer.getAddress());

    // Deploy AutoSustainability
    const Auto = await ethers.getContractFactory("AutoSustainability");
    sustainability = await Auto.deploy(await deployer.getAddress(), await token.getAddress(), await deployer.getAddress());
  });

  it("should approve and revoke KYC status", async () => {
    await kyc.connect(deployer).approve(await user.getAddress());
    expect(await kyc.isVerified(await user.getAddress())).to.be.true;

    await kyc.connect(deployer).revoke(await user.getAddress());
    expect(await kyc.isVerified(await user.getAddress())).to.be.false;
  });

  it("should reward reputation and check tier", async () => {
    await reputation.connect(deployer).reward(await user.getAddress(), 6000);
    expect(await reputation.getReputation(await user.getAddress())).to.equal(6000n);
    expect(await reputation.getTier(await user.getAddress())).to.equal("Gold");
  });

  it("should distribute funds from AutoSustainability", async () => {
    // fund the contract
    const deposit = ethers.parseUnits("1000", 18);
    await token.transfer(await sustainability.getAddress(), deposit);

    const before = await token.balanceOf(await deployer.getAddress());
    await sustainability.connect(deployer).distribute();
    const after = await token.balanceOf(await deployer.getAddress());

    expect(after).to.be.gt(before);
  });
});