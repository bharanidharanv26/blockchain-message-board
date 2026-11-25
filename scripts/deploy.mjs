
import { ethers } from "ethers";
import { readFileSync } from "node:fs";

const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:8545"
);

const privateKey = process.env.LOCAL_PRIVATE_KEY;

if (!privateKey) {
    throw new Error("LOCAL_PRIVATE_KEY is not set");
}

const artifactPath = new URL(
    "../artifacts/contracts/MessageBoard.sol/MessageBoard.json",
    import.meta.url
);

const artifact = JSON.parse(
    readFileSync(artifactPath, "utf8")
);

const wallet = new ethers.Wallet(privateKey, provider);

const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
);

console.log("Deploying MessageBoard...");

const contract = await factory.deploy();

await contract.waitForDeployment();

console.log("Deployment successful!");
console.log("Contract address:", await contract.getAddress());
console.log("Wallet address:", wallet.address);
