// Required imports
const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(express.json());

// Contract ABI - Replace with your contract's ABI
const contractABI = [
    {
        "inputs": [],
        "name": "getValue",
        "outputs": [{"type": "uint256", "name": ""}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"type": "uint256", "name": "newValue"}],
        "name": "setValue",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract instance
const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    contractABI,
    wallet
);

// API endpoint to interact with contract
app.post('/contract/interact', async (req, res) => {
    try {
        const { functionName, params } = req.body;
        
        // Check if function exists in contract
        if (!contract.functions[functionName]) {
            return res.status(400).json({ 
                error: 'Function not found in contract' 
            });
        }

        // Call contract function
        const tx = await contract[functionName](...(params || []));
        
        // If transaction (not view function), wait for confirmation
        if (tx.wait) {
            const receipt = await tx.wait();
            return res.json({
                success: true,
                transactionHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber
            });
        }
        
        // For view functions, return the result directly
        return res.json({
            success: true,
            result: tx
        });

    } catch (error) {
        console.error('Contract interaction error:', error);
        res.status(500).json({ 
            error: error.message 
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!' 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});