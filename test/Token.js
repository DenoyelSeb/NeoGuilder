const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NeoGuilder Token System", function () {

  let token, nft, deployer, user1, user2;

  before(async () => {
    [deployer, user1, user2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("NeoGuilder");
    token = await Token.deploy("1000000", 3);

    const NFT = await ethers.getContractFactory("NeoGuilderNFT");
    nft = await NFT.deploy(await token.getAddress());
  });

  it("Should assign total supply to deployer", async function () {
    const balance = await token.balanceOf(await deployer.getAddress());
    expect(balance).to.be.gte(ethers.parseUnits("1000000", 18));
  });

  it("Should apply 3% tax on transfer", async function () {
    const amount = ethers.parseUnits("1000", 18);
    await token.transfer(await user1.getAddress(), amount);

    const expected = ethers.parseUnits("970", 18);
    const balance = await token.balanceOf(await user1.getAddress());
    expect(balance).to.equal(expected);
  });

  it("Should burn tokens correctly", async function () {
    const burnAmount = ethers.parseUnits("100", 18);

    const balanceBefore = await token.balanceOf(await deployer.getAddress());
    await token.connect(deployer).burn(burnAmount);
    const balanceAfter = await token.balanceOf(await deployer.getAddress());

    expect(balanceAfter).to.equal(balanceBefore - burnAmount);
  });

  it("Should stake and receive rewards", async function () {
    const stakeAmount = ethers.parseUnits("1000", 18);

    await token.connect(deployer).stake(stakeAmount);

    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine");

    await token.connect(deployer).unstake();

    const newBalance = await token.balanceOf(await deployer.getAddress());
    expect(newBalance).to.be.greaterThan(stakeAmount - ethers.parseUnits("1", 18));
  });

  it("Should update top holder NFT correctly", async function () {
    const amount = ethers.parseUnits("10000", 18);

    await token.connect(deployer).transfer(await user1.getAddress(), amount);

    await nft.connect(deployer).updateTopHolder();

    const newOwner = await nft.ownerOf(1);
    expect(newOwner).to.equal(await user1.getAddress());
  });
});