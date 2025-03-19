console.log("✅ app.js loaded successfully!");

async function switchNetwork() {
    const sepoliaChainId = "0xaa36a7"; // 11155111 en hexa
    if (!window.ethereum) {
        throw new Error("MetaMask not found!");
    }
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
        });
        console.log("✅ Switched to Sepolia");
    } catch (switchError) {
        // Si Sepolia n'existe pas, on l'ajoute :
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: sepoliaChainId,
                    chainName: 'Sepolia Test Network',
                    rpcUrls: ['https://rpc.sepolia.org'],
                    nativeCurrency: {
                        name: 'Sepolia ETH',
                        symbol: 'SEP',
                        decimals: 18,
                    },
                    blockExplorerUrls: ['https://sepolia.etherscan.io']
                }],
            });
        } else {
            throw switchError;
        }
    }
}

const CONTRACT_ADDRESS = "0xC49F8AC9FdFa04802ddE4d28abd95Ec45623AE3f";
window.contract = null;
window.provider = null;
window.signer = null;
window.CONTRACT_ABI = [];

// Charger ABI depuis JSON
async function loadABI() {
    try {
        console.log("⏳ Loading ABI...");
        const response = await fetch("./ContractABI.json");
        if (!response.ok) throw new Error(`Failed to load ABI. HTTP Status: ${response.status}`);
        
        const data = await response.json();
        if (!data.abi) throw new Error("ABI not found in JSON.");

        window.CONTRACT_ABI = data.abi;
        console.log("✅ ABI loaded successfully.");
    } catch (error) {
        console.error("❌ ABI loading error:", error);
    }
}

// Vérifier que le contrat existe
async function verifyContract() {
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === "0x") {
        throw new Error("🚨 No contract deployed at this address on current network!");
    } else {
        console.log("✅ Contract exists on network.");
    }
}

// Initialisation propre du provider, signer, contrat
async function initializeContract() {
    if (window.ethereum == null) {
        alert("❌ MetaMask not detected!");
        return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    await verifyContract();

    window.contract = new ethers.Contract(CONTRACT_ADDRESS, window.CONTRACT_ABI, signer);
    console.log("✅ Contract initialized successfully:", window.contract);
}

// Connect Wallet
async function connectWallet() {
    if (!window.ethereum) return alert("❌ MetaMask not detected!");
    try {
        console.log("🔍 Connecting wallet...");
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        document.getElementById("wallet-address").innerText = `Address: ${userAddress}`;
        console.log(`✅ Wallet connected with address: ${await signer.getAddress()}`);
    } catch (error) {
        console.error("❌ Wallet connection error:", error);
    }
}

// Get Token Balance
async function getBalance() {
    if (!window.contract) return alert("❌ Connect your wallet first!");
    try {
        const userAddress = await signer.getAddress();
        const balance = await window.contract.balanceOf(userAddress);
        document.getElementById("balance").innerText = `Balance: ${ethers.formatUnits(balance, 18)} NGD`;
        console.log("✅ Balance retrieved successfully:", balance.toString());
    } catch (error) {
        console.error("❌ Error retrieving balance:", error);
    }
}

// Transfer Tokens (avec taxe)
async function transferTokens() {
    if (!window.contract) return alert("❌ Connect your wallet first!");
    
    const recipient = document.getElementById("recipient").value;
    const amount = document.getElementById("amount").value;

    if (!ethers.isAddress(recipient)) return alert("❌ Invalid recipient address!");
    
    try {
        const parsedAmount = ethers.parseUnits(amount, 18);
        const taxRate = BigInt(3);
        const taxAmount = (parsedAmount * taxRate) / BigInt(100);
        const netAmount = parsedAmount - taxAmount;

        const tx = await contract.transfer(recipient, parsedAmount);
        await tx.wait();

        alert(`✅ Transfer successful! Recipient receives ${ethers.formatUnits(netAmount, 18)} NGD after tax.`);
        getBalance();
    } catch (error) {
        console.error("❌ Transfer error:", error);
    }
}

// Burn Tokens
async function burnTokens() {
    if (!window.contract) return alert("❌ Connect your wallet first!");
    const amount = document.getElementById("burn-amount").value;
    try {
        const tx = await contract.burn(ethers.parseUnits(amount, 18));
        await tx.wait();
        alert("🔥 Tokens burned successfully!");
        getBalance();
    } catch (error) {
        console.error("❌ Burn error:", error);
    }
}

// Stake Tokens
async function stakeTokens() {
    if (!window.contract) return alert("❌ Connect your wallet first!");
    const amount = document.getElementById("stake-amount").value;
    try {
        const tx = await contract.stake(ethers.parseUnits(amount, 18));
        await tx.wait();
        alert("✅ Tokens staked!");
        getBalance();
    } catch (error) {
        console.error("❌ Staking error:", error);
    }
}

// Unstake Tokens
async function unstakeTokens() {
    if (!window.contract) return alert("❌ Connect your wallet first!");
    try {
        const tx = await window.contract.unstake();
        await tx.wait();
        alert("✅ Unstaking successful!");
        getBalance();
    } catch (error) {
        console.error("❌ Unstaking error:", error);
    }
}

// Évènements DOM
document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ DOM fully loaded!");

    try {
        await switchNetwork(); // ✅ Forcer explicitement Sepolia
        await loadABI();
        await connectWallet();
        await initializeContract();
    } catch (err) {
        alert(`Erreur : ${err.message}`);
        console.error(err);
    }

    document.getElementById("connect-button").onclick = connectWallet;
    document.getElementById("balance-button").onclick = getBalance;
    document.getElementById("transfer-button").onclick = transferTokens;
    document.getElementById("burn-button").onclick = burnTokens;
    document.getElementById("stake-button").onclick = stakeTokens;
    document.getElementById("unstake-button").onclick = unstakeTokens;
});