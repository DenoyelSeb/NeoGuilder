// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    uint256 public taxRate; 
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public stakingStartTime;
    uint256 public constant REWARD_RATE = 100; 

    constructor(uint256 initialSupply, uint256 _taxRate)
        ERC20("NeoGuilder", "NGD")
        Ownable(msg.sender)
    {
        _mint(msg.sender, initialSupply * 10 ** decimals());
        taxRate = _taxRate;
    }

    function setTaxRate(uint256 _taxRate) external onlyOwner {
        require(_taxRate <= 10, "Maximum tax rate is 10%");
        taxRate = _taxRate;
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function stake(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient funds");
        _taxedTransfer(msg.sender, address(this), amount);
        stakedBalances[msg.sender] += amount;
        stakingStartTime[msg.sender] = block.timestamp;
    }

    function claimRewards() external {
        require(stakedBalances[msg.sender] > 0, "No active staking");
        uint256 stakedTime = block.timestamp - stakingStartTime[msg.sender];
        uint256 reward = (stakedBalances[msg.sender] * REWARD_RATE * stakedTime) / (365 days);
        _mint(msg.sender, reward);
        stakingStartTime[msg.sender] = block.timestamp; 
    }

    function unstake() external {
        require(stakedBalances[msg.sender] > 0, "No active staking");
        uint256 amount = stakedBalances[msg.sender];
        stakedBalances[msg.sender] = 0;
        stakingStartTime[msg.sender] = 0;
        _taxedTransfer(address(this), msg.sender, amount);
    }

    function _taxedTransfer(address from, address to, uint256 amount) internal {
        uint256 taxAmount = (amount * taxRate) / 100;
        uint256 amountAfterTax = amount - taxAmount;
        super._transfer(from, to, amountAfterTax);
        if (taxAmount > 0) {
            super._transfer(from, owner(), taxAmount);
        }
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        _taxedTransfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        _taxedTransfer(from, to, amount);
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        _approve(from, msg.sender, currentAllowance - amount);
        return true;
    }
}
