console.log("✅ app.js loaded successfully!");

window.CONTRACT_ABI = [];
window.contract = null;

// **Load ABI before using the contract**
async function loadABI() {
    try {
        console.log("⏳ Loading ABI...");
        const response = await fetch("config/ContractABI.json");
        if (!response.ok) {
            throw new Error(`❌ Failed to load ABI. HTTP Status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.abi) {
            throw new Error("❌ ABI not found in JSON.");
        }

        window.CONTRACT_ABI = data.abi;
        console.log("✅ ABI Loaded:", window.CONTRACT_ABI);
    } catch (error) {
        console.error("❌ Error loading ABI:", error);
    }
}

window.onload = async () => {
    console.log("🔍 Loading ABI before initializing contract...");
    await loadABI();
    await initializeContract();
};

// Contract Configuration
const CONTRACT_ADDRESS = "0x8591EBE7c06Fa1C98359EA99F1f62B63cB59a806"; 
let provider, signer, contract;

// **Initialize Contract**
async function initializeContract() {
    if (window.CONTRACT_ABI.length === 0) {
        console.warn("⚠️ ABI not loaded yet. Retrying...");
        await loadABI();
    }

    if (window.CONTRACT_ABI.length === 0) {
        throw new Error("🚨 ABI is still empty after loading!");
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, window.CONTRACT_ABI, signer);
    console.log("✅ Contract initialized:", contract);
}

// **Connect Wallet (MetaMask)**
async function connectWallet() {
    console.log("🔍 Connecting wallet...");
    if (window.ethereum) {
        try {
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            document.getElementById("wallet-address").innerText = `Address: ${await signer.getAddress()}`;
            contract = new ethers.Contract(CONTRACT_ADDRESS, window.CONTRACT_ABI, signer);
            window.contract = contract; 
            console.log("✅ Wallet connected!");
        } catch (error) {
            console.error("❌ Wallet connection error:", error);
            alert("❌ Error connecting to MetaMask!");
        }
    } else {
        alert("❌ MetaMask not detected!");
    }
}

// **Get Token Balance**
async function getBalance() {
    if (!contract) return alert("❌ Connect your wallet first!");
    
    try {
        const address = await signer.getAddress();
        if (!ethers.isAddress(address)) {
            return alert("❌ Invalid Ethereum address!");
        }

        console.log("⏳ Fetching balance...");
        const balance = await contract.balanceOf(address);
        document.getElementById("balance").innerText = `Balance: ${ethers.formatUnits(balance, 18)} NGD`;
    } catch (error) {
        console.error("❌ Balance retrieval error:", error);
    }
}

// **Transfer Tokens**
async function transferTokens() {
    if (!contract) return alert("❌ Connect your wallet first!");

    const recipient = document.getElementById("recipient").value;
    const amount = document.getElementById("amount").value;

    if (!ethers.isAddress(recipient)) return alert("❌ Invalid recipient address!");
    
    try {
        const tx = await contract.transfer(recipient, ethers.parseUnits(amount, 18));
        await tx.wait();
        alert("✅ Transfer successful!");
        getBalance();
    } catch (error) {
        console.error("❌ Transfer error:", error);
    }
}

// **Burn Tokens**
async function burnTokens() {
    if (!contract) return alert("❌ Connect your wallet first!");
    
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

// **Stake Tokens**
async function stakeTokens() {
    if (!contract) return alert("❌ Connect your wallet first!");
    
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

// **Unstake Tokens**
async function unstakeTokens() {
    if (!contract) return alert("❌ Connect your wallet first!");
    
    try {
        const tx = await contract.unstake();
        await tx.wait();
        alert("✅ Unstaking successful!");
        getBalance();
    } catch (error) {
        console.error("❌ Unstaking error:", error);
    }
}

// **Attach Events to Buttons**
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM fully loaded!");
    document.getElementById("connect-button").addEventListener("click", connectWallet);
    document.getElementById("balance-button").addEventListener("click", getBalance);
    document.getElementById("transfer-button").addEventListener("click", transferTokens);
    document.getElementById("burn-button").addEventListener("click", burnTokens);
    document.getElementById("stake-button").addEventListener("click", stakeTokens);
    document.getElementById("unstake-button").addEventListener("click", unstakeTokens);
});