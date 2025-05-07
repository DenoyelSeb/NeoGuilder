// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IToken {
    function balanceOf(address account) external view returns (uint256);
    function holderAt(uint256 index) external view returns (address);
    function getHolderCount() external view returns (uint256);
}

contract NeoGuilderNFT is ERC721, Ownable {
    uint256 public constant NFT_ID = 1;
    address public tokenAddress;
    address public currentTopHolder;
    address public dao;

    event TopHolderChanged(address indexed previous, address indexed current);

    constructor(address _tokenAddress)
        ERC721("NeoGuilder Crown", "NGC")
        Ownable(msg.sender)  // Passe l'adresse du propriétaire initial
    {
        tokenAddress = _tokenAddress;
        currentTopHolder = msg.sender;
        _safeMint(msg.sender, NFT_ID);
    }

    function updateTopHolder() external {
        address newTopHolder = _findTopHolder();
        if (newTopHolder != address(0) && newTopHolder != currentTopHolder) {
            _transfer(currentTopHolder, newTopHolder, NFT_ID);
            emit TopHolderChanged(currentTopHolder, newTopHolder);
            currentTopHolder = newTopHolder;
        }
    }

    function _findTopHolder() internal view returns (address topHolder) {
        IToken token = IToken(tokenAddress);
        uint256 max = 0;
        address candidate;
        uint256 count = token.getHolderCount();

        for (uint256 i = 0; i < count; i++) {
            address holder = token.holderAt(i);
            uint256 balance = token.balanceOf(holder);
            if (balance > max) {
                max = balance;
                candidate = holder;
            }
        }
        return candidate;
    }

    function updateTokenAddress(address newAddress) external onlyOwner {
        tokenAddress = newAddress;
    }

    function setDAO(address _dao) public onlyOwner {
        dao = _dao;
    }
}