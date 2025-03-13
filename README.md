NeoGuilder

NeoGuilder is an ERC-20 token with taxation, burning, and staking, deployed on the Sepolia testnet. It comes with a frontend (ethers.js), unit tests, and a Hardhat setup for local testing and deployment.

Inspired by the Guilder, the world's first global currency, NeoGuilder is my first full blockchain project, where I tried to grasp as many Web3 concepts as possible in a short time.

🚀 Features

- Taxed Transactions (3% transfer tax)
- Token Burning
- Staking & Unstaking
- MetaMask Wallet Integration
- Unit Tests with Hardhat
- Basic Frontend (ethers.js) (Not fully tested)

🛠️ Planned Features

- A unique NFT owned by the largest NeoGuilder holder
- NeoGuilderDAO for governance



📦 Installation & Setup

1️/ Prerequisites

Make sure you have:

Node.js
MetaMask
Hardhat

2/ Clone the Repository

git clone https://github.com/DenoyelSeb/NeoGuilder.git
cd NeoGuilder

3/ Install Dependencies

npm install

Dependencies used:

ethers
hardhat
dotenv
@openzeppelin/contracts
@openzeppelin/hardhat-upgrades
express
cors

4️/ Start a Local Hardhat Network

npx hardhat node

5/ Deploy the Contract Locally

npx hardhat run scripts/DeployToken.js --network localhost



🔗 Smart Contract Deployment :

✅ Deployed on Sepolia Testnet
 📍 Contract Address: 0x8591EBE7c06Fa1C98359EA99F1f62B63cB59a806

To verify deployment:

npx hardhat verify --network sepolia 0x8591EBE7c06Fa1C98359EA99F1f62B63cB59a806

To run unit tests:

npx hardhat test test/Token.js



🌐 Frontend Usage

NeoGuilder includes a basic frontend (ethers.js-based). To use it:

- Ensure MetaMask is connected to Sepolia.
- Open index.html in a browser.
- Click “Connect Wallet” to interact. (Other frontend functions have not been fully tested.)

✅ Confirmed to work with MetaMask




🤝 Contribution
This project is currently not open for contributions.



⚖️ License

Unlicensed – Code is visible but not authorized for reuse.



📢 Notes

This project was built as a learning experience but it's not meant for production use.
Feel free to fork or experiment with the code, but redistribution is not permitted.



🚀 Enjoy exploring Web3 with NeoGuilder!