// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

interface IAutoSustainability {
    function distribute() external;
}

contract NeoGuilder is ERC20, Ownable, IVotes {
    uint256 public taxRate;
    address public dao;
    bool public daoAddressSet;

    address public autoSustainabilityContract;
    bool public autoSustainabilityContractSet;
    uint256 public sustainabilityShare;

    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public stakingStartTime;
    uint256 public constant REWARD_RATE = 100;

    address[] private holders;
    mapping(address => bool) private isHolder;

    address public topHolder;

    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO can call this");
        _;
    }

    constructor(uint256 initialSupply, uint256 _taxRate)
        ERC20("NeoGuilder", "NGD")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
        taxRate = _taxRate;
        sustainabilityShare = 30;
        _updateTopHolder(msg.sender);
    }

    // === DAO Configuration ===

    function setDAOAddress(address _dao) external onlyOwner {
        require(!daoAddressSet, "DAO address already set");
        dao = _dao;
        daoAddressSet = true;
    }

    function setDAO(address _dao) external onlyDAO {
        dao = _dao;
    }

    function updateTaxRate(uint256 _newRate) external onlyDAO {
        require(_newRate <= 10, "Max tax 10%");
        taxRate = _newRate;
    }

    // === Auto-Sustainability ===

    function setAutoSustainabilityContract(address _asc) external {
        require(!autoSustainabilityContractSet, "Already set");
        require(msg.sender == dao || msg.sender == owner(), "Only DAO or owner");
        autoSustainabilityContract = _asc;
        autoSustainabilityContractSet = true;
    }

    function setSustainabilityShare(uint256 percent) external onlyDAO {
        require(percent <= 100, "Cannot exceed 100%");
        sustainabilityShare = percent;
    }

    // === ERC20 Extensions ===

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        _updateTopHolder(msg.sender);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        _taxedTransfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _taxedTransfer(from, to, amount);
        uint256 allowed = allowance(from, msg.sender);
        require(allowed >= amount, "ERC20: transfer exceeds allowance");
        _approve(from, msg.sender, allowed - amount);
        return true;
    }

    // === Staking ===

    function stake(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient funds");
        _transfer(msg.sender, address(this), amount);
        stakedBalances[msg.sender] += amount;
        stakingStartTime[msg.sender] = block.timestamp;
        _updateTopHolder(msg.sender);
    }

    function unstake() external {
        require(stakedBalances[msg.sender] > 0, "No active staking");
        _claimRewards();
        uint256 amt = stakedBalances[msg.sender];
        stakedBalances[msg.sender] = 0;
        stakingStartTime[msg.sender] = 0;
        _transfer(address(this), msg.sender, amt);
        _updateTopHolder(msg.sender);
    }

    function _claimRewards() internal {
        uint256 duration = block.timestamp - stakingStartTime[msg.sender];
        uint256 reward = (stakedBalances[msg.sender] * REWARD_RATE * duration) / 365 days;
        _mint(msg.sender, reward);
        stakingStartTime[msg.sender] = block.timestamp;
        _updateTopHolder(msg.sender);
    }

    // === Tax Logic ===

    function _taxedTransfer(address from, address to, uint256 amount) internal {
        uint256 taxAmount = (amount * taxRate) / 100;
        uint256 net = amount - taxAmount;
        _transfer(from, to, net);

        if (taxAmount > 0) {
            uint256 share = (taxAmount * sustainabilityShare) / 100;
            uint256 daoShare = taxAmount - share;

            if (share > 0 && autoSustainabilityContract != address(0)) {
                _transfer(from, autoSustainabilityContract, share);
                try IAutoSustainability(autoSustainabilityContract).distribute() {} catch {}
            }
            if (daoShare > 0 && dao != address(0)) {
                _transfer(from, dao, daoShare);
            }
        }

        if (!isHolder[to]) {
            isHolder[to] = true;
            holders.push(to);
        }

        _updateTopHolder(from);
        _updateTopHolder(to);
    }

    // === Top Holder Logic ===

    function _updateTopHolder(address candidate) internal {
        if (balanceOf(candidate) > balanceOf(topHolder)) {
            topHolder = candidate;
        }
    }

    function getTopHolder() public view returns (address) {
        return topHolder;
    }

    // === Holder Enumeration ===

    function getHolderCount() external view returns (uint256) {
        return holders.length;
    }

    function holderAt(uint256 i) external view returns (address) {
        require(i < holders.length, "Out of bounds");
        return holders[i];
    }

    // === IVotes Implementation ===

    function delegate(address) external override {
        // no-op
    }

    function delegateBySig(
        address, uint256, uint256, uint8, bytes32, bytes32
    ) external pure override {
        revert("No delegation by sig");
    }

    function getVotes(address account) external view override returns (uint256) {
        return balanceOf(account);
    }

    function getPastVotes(address account, uint256) external view override returns (uint256) {
        return balanceOf(account);
    }

    function getPastTotalSupply(uint256) external view override returns (uint256) {
        return totalSupply();
    }

    function delegates(address) external pure override returns (address) {
        return address(0);
    }
}