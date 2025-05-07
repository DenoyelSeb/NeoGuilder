// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AutoSustainability {
    address public dao;
    IERC20 public treasuryToken;

    address public treasuryWallet;
    uint256 public transferPercent = 1; // 1% by default

    event Distributed(uint256 amount, address indexed to);
    event TreasuryWalletUpdated(address newWallet);
    event TransferPercentUpdated(uint256 newPercent);

    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO can call this");
        _;
    }

    constructor(address _dao, address _treasuryToken, address _treasuryWallet) {
        dao = _dao;
        treasuryToken = IERC20(_treasuryToken);
        treasuryWallet = _treasuryWallet;
    }

    function distribute() external onlyDAO {
        uint256 balance = treasuryToken.balanceOf(address(this));
        uint256 amount = (balance * transferPercent) / 100;
        require(amount > 0, "Nothing to distribute");
        treasuryToken.transfer(treasuryWallet, amount);
        emit Distributed(amount, treasuryWallet);
    }

    function updateTreasuryWallet(address newWallet) external onlyDAO {
        treasuryWallet = newWallet;
        emit TreasuryWalletUpdated(newWallet);
    }

    function updateTransferPercent(uint256 newPercent) external onlyDAO {
        require(newPercent <= 100, "Cannot exceed 100%");
        transferPercent = newPercent;
        emit TransferPercentUpdated(newPercent);
    }

    function transferDAO(address newDAO) external onlyDAO {
        dao = newDAO;
    }

    function setDAO(address _dao) public onlyDAO {
    dao = _dao;
    }
}