
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:8545"
);

const privateKey = process.env.LOCAL_PRIVATE_KEY;

if (!privateKey) {
    throw new Error("LOCAL_PRIVATE_KEY is not set");
}

const wallet = new ethers.Wallet(privateKey, provider);

// Connect to our deployed contract
const contractAddress =
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const artifact = await import(
    "../artifacts/contracts/MessageBoard.sol/MessageBoard.json",
    { with: { type: "json" } }
);

const contract = new ethers.Contract(
    contractAddress,
    artifact.default.abi,
    wallet
);

// Write a message
console.log("Sending message to blockchain...");

const transaction = await contract.postMessage(
    "Hello Blockchain! My first Web3 transaction."
);

console.log("Transaction submitted:", transaction.hash);

// Wait for mining
const receipt = await transaction.wait();

console.log("Transaction mined!");
console.log("Block number:", receipt.blockNumber);

// Read message count
const count = await contract.getMessageCount();

console.log("Total messages:", count.toString());

// Read our first message
const message = await contract.getMessage(0);

console.log("\nStored Message:");
console.log("Sender:", message[0]);
console.log("Content:", message[1]);
console.log("Timestamp:", message[2].toString());
