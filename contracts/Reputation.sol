// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Reputation {
    address public dao;

    mapping(address => uint256) private _reputation;

    event ReputationUpdated(address indexed user, uint256 amount, uint256 total);

    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO can call this");
        _;
    }

    constructor(address _dao) {
        dao = _dao;
    }

    function reward(address user, uint256 amount) external onlyDAO {
        _reputation[user] += amount;
        emit ReputationUpdated(user, amount, _reputation[user]);
    }

    function getReputation(address user) external view returns (uint256) {
        return _reputation[user];
    }

    function getTier(address user) external view returns (string memory) {
        uint256 rep = _reputation[user];
        if (rep >= 10000) return "Platinum";
        if (rep >= 5000) return "Gold";
        if (rep >= 1000) return "Silver";
        if (rep >= 100) return "Bronze";
        return "Newbie";
    }

    function transferDAO(address newDAO) external onlyDAO {
        dao = newDAO;
    }

    function setDAO(address _dao) public onlyDAO {
        dao = _dao;
    }
}
