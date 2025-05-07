// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract KYC {
    address public dao;
    mapping(address => bool) private _verified;

    event KYCApproved(address indexed user);
    event KYCRevoked(address indexed user);

    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO can call this");
        _;
    }

    constructor(address _dao) {
        dao = _dao;
    }

    function approve(address user) external onlyDAO {
        _verified[user] = true;
        emit KYCApproved(user);
    }

    function revoke(address user) external onlyDAO {
        _verified[user] = false;
        emit KYCRevoked(user);
    }

    function isVerified(address user) external view returns (bool) {
        return _verified[user];
    }

    function transferDAO(address newDAO) external onlyDAO {
        dao = newDAO;
    }

    function setDAO(address _dao) public onlyDAO {
        dao = _dao;
    }
}
