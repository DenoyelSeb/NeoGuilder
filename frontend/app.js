console.log("✅ app.js loaded successfully!");

let TOKEN_ADDRESS, NFT_ADDRESS, DAO_ADDRESS, KYC_ADDRESS;
let TOKEN_ABI, NFT_ABI, DAO_ABI, KYC_ABI;
let tokenContract, nftContract, daoContract, kycContract;
let provider, signer;

// === SWITCH TO SEPOLIA ===
async function switchNetwork() {
    const sepoliaChainId = "0xaa36a7";
    if (!window.ethereum) throw new Error("MetaMask not found!");
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
        });
        console.log("✅ Switched to Sepolia");
    } catch (err) {
        if (err.code === 4902) {
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
            throw err;
        }
    }
}

// === LOAD CONFIG ===
async function loadAddresses() {
    const res = await fetch("deployed.json");
    const data = await res.json();
    TOKEN_ADDRESS = data.NeoGuilder;
    NFT_ADDRESS = data.NeoGuilderNFT;
    DAO_ADDRESS = data.NeoGuilderDAO;
    KYC_ADDRESS = data.KYC;
    console.log("✅ Addresses loaded.");
}

async function loadABIs() {
    const [tokenRes, nftRes, daoRes, kycRes] = await Promise.all([
        fetch("NeoGuilder.json"),
        fetch("NeoGuilderNFT.json"),
        fetch("NeoGuilderDAO.json"),
        fetch("KYC.json")
    ]);
    const tokenData = await tokenRes.json();
    const nftData = await nftRes.json();
    const daoData = await daoRes.json();
    const kycData = await kycRes.json();
    TOKEN_ABI = tokenData.abi;
    NFT_ABI = nftData.abi;
    DAO_ABI = daoData.abi;
    KYC_ABI = kycData.abi;
    console.log("✅ ABIs loaded.");
}

// === INIT ===
async function verifyContract(address) {
    const code = await provider.getCode(address);
    if (code === "0x") throw new Error(`No contract at ${address}`);
}

async function initializeContracts() {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    await verifyContract(TOKEN_ADDRESS);
    await verifyContract(NFT_ADDRESS);
    await verifyContract(DAO_ADDRESS);
    await verifyContract(KYC_ADDRESS);
    tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
    nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, signer);
    daoContract = new ethers.Contract(DAO_ADDRESS, DAO_ABI, signer);
    kycContract = new ethers.Contract(KYC_ADDRESS, KYC_ABI, signer);
    console.log("✅ Contracts ready");
}

// === WALLET ===
async function connectWallet() {
    if (!window.ethereum) return alert("❌ MetaMask not detected!");
    try {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const user = await signer.getAddress();
        document.getElementById("wallet-address").innerText = `Address: ${user}`;
        console.log("✅ Wallet connected:", user);
    } catch (err) {
        console.error("❌ Wallet connection error:", err);
    }
}

// === BALANCE ===
async function getBalance() {
    if (!tokenContract) return alert("❌ Connect your wallet first!");
    const user = await signer.getAddress();
    const balance = await tokenContract.balanceOf(user);
    document.getElementById("balance").innerText = `Balance: ${ethers.formatUnits(balance, 18)} NGD`;
}

// === TRANSFER WITH TAX ===
async function transferTokens() {
    if (!tokenContract) return alert("❌ Connect your wallet first!");
    const recipient = document.getElementById("recipient").value;
    const amount = document.getElementById("amount").value;
    if (!ethers.isAddress(recipient)) return alert("❌ Invalid recipient address");
    try {
        const parsedAmount = ethers.parseUnits(amount, 18);
        const taxRate = BigInt(3);
        const taxAmount = (parsedAmount * taxRate) / BigInt(100);
        const netAmount = parsedAmount - taxAmount;
        const tx = await tokenContract.transfer(recipient, parsedAmount);
        await tx.wait();
        alert(`✅ Transferred! Net received after tax: ${ethers.formatUnits(netAmount, 18)} NGD`);
        getBalance();
        checkIfTopHolder(); // update logo
    } catch (err) {
        console.error("❌ Transfer error:", err);
    }
}

// === BURN ===
async function burnTokens() {
    if (!tokenContract) return alert("❌ Connect your wallet first!");
    const amount = document.getElementById("burn-amount").value;
    try {
        const tx = await tokenContract.burn(ethers.parseUnits(amount, 18));
        await tx.wait();
        alert("🔥 Tokens burned");
        getBalance();
        checkIfTopHolder();
    } catch (err) {
        console.error("❌ Burn error:", err);
    }
}

// === STAKE ===
async function stakeTokens() {
    if (!tokenContract) return alert("❌ Connect your wallet first!");
    const amount = document.getElementById("stake-amount").value;
    try {
        const tx = await tokenContract.stake(ethers.parseUnits(amount, 18));
        await tx.wait();
        alert("✅ Staked");
        getBalance();
        checkIfTopHolder();
    } catch (err) {
        console.error("❌ Stake error:", err);
    }
}

// === UNSTAKE ===
async function unstakeTokens() {
    if (!tokenContract) return alert("❌ Connect your wallet first!");
    try {
        const tx = await tokenContract.unstake();
        await tx.wait();
        alert("✅ Unstaked");
        getBalance();
        checkIfTopHolder();
    } catch (err) {
        console.error("❌ Unstake error:", err);
    }
}

// === CHECK TOP HOLDER ===
async function checkIfTopHolder() {
    try {
        const user = (await signer.getAddress()).toLowerCase();
        const top = (await tokenContract.getTopHolder()).toLowerCase();
        if (user === top) {
            document.getElementById("nft-badge").style.display = "block";
            console.log("👑 You are top holder. Badge shown.");
        } else {
            document.getElementById("nft-badge").style.display = "none";
            console.log("🙅 Not top holder.");
        }
    } catch (err) {
        console.error("❌ Top holder check error:", err);
    }
}

// === DAO: Delegate ===
async function delegate() {
    const to = document.getElementById("delegate-to").value;
    if (!ethers.isAddress(to)) return alert("❌ Invalid address to delegate to.");
    try {
        const tx = await tokenContract.delegate(to);
        await tx.wait();
        alert(`✅ Successfully delegated to ${to}`);
    } catch (err) {
        console.error("❌ Delegate error:", err);
    }
}

// === DAO: Propose (Tax Rate Change) ===
// Suppose que la proposition appelle la fonction `updateTaxRate(uint256)` sur le token
async function proposeTaxUpdate() {
    const newRate = parseInt(document.getElementById("new-tax").value);
    if (isNaN(newRate) || newRate < 0 || newRate > 10) return alert("❌ Tax rate must be between 0 and 10");

    try {
        const iface = new ethers.Interface(TOKEN_ABI);
        const calldata = iface.encodeFunctionData("updateTaxRate", [newRate]);
        const tx = await daoContract.propose(
            [TOKEN_ADDRESS], // targets
            [0],             // values
            [calldata],      // calldatas
            `Proposal: Set tax rate to ${newRate}%` // description
        );
        const receipt = await tx.wait();
        const proposalId = receipt.logs[0].args[0];
        alert(`✅ Proposal created! ID: ${proposalId}`);
    } catch (err) {
        console.error("❌ Proposal error:", err);
    }
}

// === DAO: Vote ===
async function voteOnProposal() {
    const id = document.getElementById("vote-proposal-id").value;
    const choice = document.getElementById("vote-choice").value;
    const support = (choice === "for") ? 1 : 0;
    try {
        const tx = await daoContract.castVote(id, support);
        await tx.wait();
        alert(`✅ Vote cast on proposal ${id}`);
    } catch (err) {
        console.error("❌ Voting error:", err);
    }
}

// === DAO: Execute ===
async function executeProposal() {
    const id = document.getElementById("execute-proposal-id").value;
    try {
        // Get proposal details from contract
        const proposal = await daoContract.proposals(id);
        const iface = new ethers.Interface(TOKEN_ABI);
        const description = `Proposal: Set tax rate to ???`; // or store separately

        const descriptionHash = ethers.id(description); // keccak256 hash
        const tx = await daoContract.execute(
            proposal.targets,
            proposal.values,
            proposal.calldatas,
            descriptionHash
        );
        await tx.wait();
        alert(`✅ Proposal ${id} executed!`);
    } catch (err) {
        console.error("❌ Execution error:", err);
    }
}

// === Verify KYC ===

async function verifyKYC() {
    try {
        const tx = await kycContract.verify(await signer.getAddress());
        await tx.wait();
        alert("✅ You are now KYC-verified.");
        document.getElementById("kyc-status").innerText = "KYC Status: Verified";
    } catch (err) {
        console.error("❌ KYC verify error:", err);
        alert("❌ KYC failed. Are you the owner?");
    }
}

// === DOM ===
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await switchNetwork();
        await loadAddresses();
        await loadABIs();
        await connectWallet();
        await initializeContracts();
        await getBalance();
        await checkIfTopHolder();
    } catch (err) {
        alert(`❌ Init error: ${err.message}`);
        console.error(err);
    }

    document.getElementById("connect-button").onclick = connectWallet;
    document.getElementById("balance-button").onclick = getBalance;
    document.getElementById("transfer-button").onclick = transferTokens;
    document.getElementById("burn-button").onclick = burnTokens;
    document.getElementById("stake-button").onclick = stakeTokens;
    document.getElementById("unstake-button").onclick = unstakeTokens;
    document.getElementById("delegate-button").onclick = delegate;
    document.getElementById("propose-button").onclick = proposeTaxUpdate;
    document.getElementById("vote-button").onclick = voteOnProposal;
    document.getElementById("execute-button").onclick = executeProposal;
    document.getElementById("kyc-verify-button").onclick = verifyKYC;
});
