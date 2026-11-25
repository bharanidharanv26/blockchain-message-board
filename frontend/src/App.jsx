
import { useState } from "react";
import { ethers } from "ethers";
import artifact from "./contracts/MessageBoard.json";
import "./App.css";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const REQUIRED_CHAIN_ID = 31337n;

function App() {
  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Connect your wallet to get started.");

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setStatus("MetaMask is not installed.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      await provider.send("eth_requestAccounts", []);

      let network = await provider.getNetwork();

      if (network.chainId !== REQUIRED_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x7a69" }],
        });

        network = await provider.getNetwork();
      }

      if (network.chainId !== REQUIRED_CHAIN_ID) {
        setStatus("Please switch to Hardhat Local.");
        return;
      }

      const signer = await provider.getSigner();
      setAccount(await signer.getAddress());
      setStatus("Wallet connected successfully!");
    } catch (error) {
      console.error(error);
      setStatus(error.shortMessage || error.message);
    }
  }

  async function postMessage() {
    try {
      if (!window.ethereum) {
        setStatus("Please install MetaMask.");
        return;
      }

      if (!message.trim()) {
        setStatus("Please enter a message.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        artifact.abi,
        signer
      );

      setStatus("Waiting for transaction confirmation...");

      const transaction = await contract.postMessage(message.trim());

      setStatus("Transaction submitted. Waiting for confirmation...");

      await transaction.wait();

      setMessage("");
      setStatus("Message stored on the blockchain!");
      await loadMessages();
    } catch (error) {
      console.error(error);
      setStatus(error.shortMessage || error.message);
    }
  }

  async function loadMessages() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        artifact.abi,
        provider
      );

      const count = await contract.getMessageCount();
      const loadedMessages = [];

      for (let i = 0; i < Number(count); i++) {
        const item = await contract.getMessage(i);

        loadedMessages.push({
          sender: item[0],
          content: item[1],
          timestamp: new Date(Number(item[2]) * 1000).toLocaleString(),
        });
      }

      setMessages(loadedMessages);
    } catch (error) {
      console.error(error);
      setStatus(error.shortMessage || error.message);
    }
  }

  return (
    <main className="app">
      <h1>Decentralized Message Board</h1>
      <p>Post messages directly to the blockchain.</p>

      <button onClick={connectWallet}>
        {account ? "Wallet Connected" : "Connect MetaMask"}
      </button>

      {account && <p>Connected account: {account}</p>}

      <section className="message-box">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your message..."
        />

        <button onClick={postMessage}>Post Message</button>
        <button onClick={loadMessages}>Load Messages</button>
      </section>

      <p className="status">{status}</p>

      <section>
        <h2>Messages on Blockchain</h2>

        {messages.map((item, index) => (
          <article className="message-card" key={index}>
            <p>{item.content}</p>
            <small>From: {item.sender}</small>
            <br />
            <small>{item.timestamp}</small>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
