const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("NeoGuilderDAO Governance Flow", function () {
  let token, dao, timelock, proposer;

  before(async () => {
    [proposer] = await ethers.getSigners();

    // 1) Deploy Token
    const Token = await ethers.getContractFactory("NeoGuilder");
    token = await Token.deploy("1000000", 3);

    // 2) Deploy TimelockController with proposer and executor = proposer EOA
    const Timelock = await ethers.getContractFactory("TimelockController");
    timelock = await Timelock.deploy(
      3600,
      [await proposer.getAddress()],
      [await proposer.getAddress()],
      await proposer.getAddress()
    );

    // 3) Deploy DAO
    const DAO = await ethers.getContractFactory("NeoGuilderDAO");
    dao = await DAO.deploy(
      await token.getAddress(),
      await timelock.getAddress()
    );

    // 3.1) Transfer ownership of the token to the Timelock
    await token.transferOwnership(await timelock.getAddress());

    // 4) Grant Timelock roles to the DAO contract itself
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    await timelock.grantRole(PROPOSER_ROLE, await dao.getAddress());
    await timelock.grantRole(EXECUTOR_ROLE, await dao.getAddress());

    // 5) Disable KYC check for testing
    await dao.setKYCContract(ethers.ZeroAddress);
  });

  it("should propose, vote, queue and execute a DAO action", async () => {
    // Delegate voting power to self
    await token.connect(proposer).delegate(await proposer.getAddress());

    // Prepare calldata to call setDAOAddress on the token
    const setDAOcalldata = token.interface.encodeFunctionData(
      "setDAOAddress",
      [await dao.getAddress()]
    );

    // Build description and its hash
    const description = "Set DAO as controller of NeoGuilder";
    const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description));

    // Compute proposalId deterministically
    const proposalId = await dao.hashProposal(
      [await token.getAddress()],
      [0],
      [setDAOcalldata],
      descriptionHash
    );

    // Submit the proposal
    await dao.connect(proposer).propose(
      [await token.getAddress()],
      [0],
      [setDAOcalldata],
      description
    );

    // Advance exactly 1 block (votingDelay)
    await network.provider.send("hardhat_mine", ["0x1"]);

    // Cast a vote FOR
    await dao.connect(proposer).castVote(proposalId, 1);

    // Advance votingPeriod blocks
    const votingPeriod = await dao.votingPeriod();
    await network.provider.send("hardhat_mine", [
      `0x${votingPeriod.toString(16)}`
    ]);

    // Queue the proposal in the timelock
    await dao.queue(
      [await token.getAddress()],
      [0],
      [setDAOcalldata],
      descriptionHash
    );

    // Fast‑forward time by the timelock delay
    const delay = await timelock.getMinDelay();
    await network.provider.send("evm_increaseTime", [Number(delay)]);
    await network.provider.send("evm_mine");

    // Execute the proposal
    await dao.execute(
      [await token.getAddress()],
      [0],
      [setDAOcalldata],
      descriptionHash
    );

    // Verify the DAO was set on the token
    expect(await token.dao()).to.equal(await dao.getAddress());
  });
});