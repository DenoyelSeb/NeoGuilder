require("dotenv/config");
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Déploiement avec l'adresse: ${deployer.address}`);

    const initialSupply = process.env.INITIAL_SUPPLY || "1000000"; // 1M tokens
    const taxRate = process.env.TAX_RATE || "3"; // 3% Tax

    const Token = await hre.ethers.getContractFactory("Token");
    const token = await Token.deploy(initialSupply, taxRate);

    await token.waitForDeployment();
    console.log(`Token déployé à l'adresse: ${await token.getAddress()}`);
}

main().catch((error) => {
    console.error("Erreur de déploiement:", error);
    process.exit(1);
});