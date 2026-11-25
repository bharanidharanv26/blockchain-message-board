import { useState } from "react";
import { ethers } from "ethers";
import artifact from "./contracts/MessageBoard.json";
import "./App.css";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const REQUIRED_CHAIN_ID = 31337n;

function Icon({ name, className = "" }) {
  const paths = {
    wallet: "M20 8V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v11H6a3 3 0 0 1-3-3V6m17 7h-4v3h4",
    send: "m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13",
    refresh: "M20 7v5h-5M4 17v-5h5m10-4a8 8 0 0 0-13-2L4 8m16 8-2 2A8 8 0 0 1 5 16",
    message: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l2-5a8.5 8.5 0 1 1 16-3.5ZM8 9h8m-8 4h5",
    info: "M12 8h.01M12 11v5m10-4a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  };

  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function App() {
  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Connect your wallet to get started.");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedMessages, setHasLoadedMessages] = useState(false);

  async function connectWallet() {
    setIsConnecting(true);

    try {
      if (!window.ethereum) {
        setStatus("Install MetaMask in your browser to connect your wallet.");
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
    } finally {
      setIsConnecting(false);
    }
  }

  async function postMessage() {
    setIsPosting(true);

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

      setStatus("Confirm the transaction in your wallet to post your message.");

      const transaction = await contract.postMessage(message.trim());

      setStatus("Transaction submitted. Waiting for confirmation...");

      await transaction.wait();

      setMessage("");
      setStatus("Message stored on the blockchain!");
      await loadMessages();
    } catch (error) {
      console.error(error);
      setStatus(error.shortMessage || error.message);
    } finally {
      setIsPosting(false);
    }
  }

  async function loadMessages() {
    setIsLoading(true);

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
          timestamp: new Date(Number(item[2]) * 1000).toISOString(),
        });
      }

      setMessages(loadedMessages);
      setHasLoadedMessages(true);
    } catch (error) {
      console.error(error);
      setStatus(error.shortMessage || error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <span className="network-badge">
          <span className="network-dot" />
          Hardhat Local <span className="chain-id">/ 31337</span>
        </span>
        <h1>Decentralized Message Board</h1>
        <p>A shared space for your thoughts. Stored on the blockchain.</p>
      </header>

      <section className="wallet-panel" aria-label="Wallet connection">
        <div className="wallet-details">
          <span className="wallet-icon"><Icon name="wallet" /></span>
          <div className="wallet-copy">
            <p className="wallet-label">
              {account ? "Wallet connected" : "Your wallet"}
              {account && <span className="connected-dot" />}
            </p>
            <p className={account ? "wallet-address" : "wallet-hint"}>
              {account || "Connect MetaMask to join the conversation."}
            </p>
          </div>
        </div>
        <button
          className="button button-secondary"
          onClick={connectWallet}
          disabled={isConnecting || isPosting || isLoading}
        >
          {isConnecting ? "Connecting…" : account ? "Wallet connected" : "Connect MetaMask"}
        </button>
      </section>

      <section className="message-box" aria-labelledby="compose-heading">
        <div className="section-heading">
          <h2 id="compose-heading"><label htmlFor="message">Write a message</label></h2>
          <span className="section-note">Make it yours.</span>
        </div>
        <textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What would you like to share?"
          aria-describedby="message-hint"
          disabled={isPosting}
        />
        <div className="compose-footer">
          <p id="message-hint">Messages are public and stored on-chain.</p>
          <button
            className="button button-primary"
            onClick={postMessage}
            disabled={!account || !message.trim() || isPosting || isConnecting || isLoading}
          >
            <Icon name="send" />
            {isPosting ? "Posting…" : "Post message"}
          </button>
        </div>
      </section>

      <p className="status" role="status">
        <Icon name="info" />
        <span>{status}</span>
      </p>

      <section className="messages-section" aria-labelledby="messages-heading" aria-busy={isLoading}>
        <div className="section-heading messages-heading">
          <div className="heading-with-count">
            <h2 id="messages-heading">Messages on blockchain</h2>
            {hasLoadedMessages && <span className="message-count" aria-label={`${messages.length} messages`}>{messages.length}</span>}
          </div>
          <button
            className="button button-secondary"
            onClick={loadMessages}
            disabled={!account || isLoading || isPosting || isConnecting}
          >
            <Icon name="refresh" />
            {isLoading ? "Loading…" : hasLoadedMessages ? "Refresh" : "Load messages"}
          </button>
        </div>

        {messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon"><Icon name="message" /></span>
            <h3>{isLoading ? "Loading messages…" : hasLoadedMessages ? "No messages yet" : "Messages will appear here"}</h3>
            <p>
              {isLoading
                ? "Reading the board from Hardhat Local."
                : hasLoadedMessages
                  ? "Be the first to leave a message on the board."
                  : account
                    ? "Load the board to see what others have shared."
                    : "Connect your wallet, then load messages to explore the board."}
            </p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((item, index) => (
              <article className="message-card" key={index}>
                <div className="message-meta">
                  <span className="message-author" title={item.sender}>
                    <Icon name="wallet" />
                    <span>{item.sender}</span>
                  </span>
                  <time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleString()}</time>
                </div>
                <p>{item.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
