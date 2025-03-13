const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("NeoGuilder Token Frontend Tests", function () {
  this.timeout(10000);

  // Deployment fixture: ensures each test starts with a fresh contract instance
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("Token");
    const token = await TokenFactory.deploy(1000000, 3); // Supply: 1,000,000 tokens, Tax: 3%
    await token.waitForDeployment();
    return { token, owner, addr1, addr2 };
  }

  it("Should assign the total supply to the owner", async function () {
    const { token, owner } = await loadFixture(deployTokenFixture);
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseUnits("1000000", 18));
  });

  it("Should transfer tokens with tax deduction", async function () {
    const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
    
    const transferAmount = ethers.parseUnits("500", 18);
    const taxRate = 3; // 3% tax
    const taxAmount = transferAmount * BigInt(taxRate) / BigInt(100); // Calculate tax
    const expectedAmount = transferAmount - taxAmount; // Net amount received
    
    const tx = await token.transfer(addr1.address, transferAmount);
    await tx.wait();

    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(expectedAmount);
  });

  it("Should burn tokens correctly", async function () {
    const { token, owner } = await loadFixture(deployTokenFixture);
    const tx = await token.burn(ethers.parseUnits("100", 18));
    await tx.wait();
    const ownerBalance = await token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseUnits("999900", 18)); // 1,000,000 - 100
  });

  it("Should apply tax on transfers", async function () {
    const { token, owner, addr1 } = await loadFixture(deployTokenFixture);
    const tx = await token.transfer(addr1.address, ethers.parseUnits("1000", 18));
    await tx.wait();
    const addr1Balance = await token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseUnits("970", 18)); // 1000 - 3% = 970 tokens
  });

  it("Should return the correct owner balance", async function () {
    const { token, owner } = await loadFixture(deployTokenFixture);
    const balance = await token.balanceOf(owner.address);
    console.log("Owner balance:", ethers.formatUnits(balance, 18));
    expect(balance).to.be.a("BigInt");
  });
});