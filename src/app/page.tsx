// src/app/page.tsx
"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { FC, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import bs58 from "bs58";
import nacl from "tweetnacl";

// Interfaces (same as before)
interface TokenAccount { mint: string; amount: string; decimals: number; }
interface TokenMetadata { name: string; symbol: string; logoURI: string; }

// TransferForm Component (same as before)
const TransferForm: FC<{ token: TokenAccount; metadata: TokenMetadata | undefined; onClose: () => void; }> = ({ token, metadata, onClose }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");

  const handleSend = useCallback(async () => {
    if (!publicKey || !recipient || !amount) { setError("Please fill out all fields."); return; }
    setError(""); setSignature(""); setIsSending(true);
    try {
      const recipientPubKey = new PublicKey(recipient);
      const mintPubKey = new PublicKey(token.mint);
      const fromAta = await getAssociatedTokenAddress(mintPubKey, publicKey);
      const toAta = await getAssociatedTokenAddress(mintPubKey, recipientPubKey);
      const transaction = new Transaction();
      const toAtaInfo = await connection.getAccountInfo(toAta);
      if (!toAtaInfo) {
        transaction.add(createAssociatedTokenAccountInstruction(publicKey, toAta, recipientPubKey, mintPubKey));
      }
      transaction.add(
        createTransferInstruction(fromAta, toAta, publicKey, parseFloat(amount) * Math.pow(10, token.decimals))
      );
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setSignature(signature);
    } catch (err: any) { setError(err.message || "An unknown error occurred."); } finally { setIsSending(false); }
  }, [publicKey, connection, sendTransaction, token, recipient, amount]);

  return (
    <div className="mt-6 w-full max-w-md text-left">
      <div className="flex items-center gap-3 mb-4">
        {metadata?.logoURI ? <Image src={metadata.logoURI} alt={metadata.name} width={40} height={40} className="w-10 h-10 rounded-full"/> : <div className="w-10 h-10 rounded-full bg-gray-700"/>}
        <div><h2 className="text-xl font-semibold text-white">Send {metadata?.symbol || "Token"}</h2><p className="text-sm text-gray-400">Balance: {token.amount}</p></div>
      </div>
      <div className="flex flex-col gap-4">
        <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient's Wallet Address" className="p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        <div className="flex gap-2"><button onClick={handleSend} disabled={isSending} className="flex-1 px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500">{isSending ? "Sending..." : "Send"}</button><button onClick={onClose} className="px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">Cancel</button></div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {signature && <p className="text-green-500 text-sm mt-2">Success! Tx: {signature.substring(0,12)}...</p>}
      </div>
    </div>
  );
};

// New SignMessage Component
const Signer: FC = () => {
    const { publicKey, signMessage } = useWallet();
    const [message, setMessage] = useState("Sign this message to prove you own this wallet");
    const [signature, setSignature] = useState("");
    const [verificationResult, setVerificationResult] = useState<boolean | null>(null);

    const handleSign = useCallback(async () => {
        setSignature("");
        setVerificationResult(null);
        if (!publicKey || !signMessage) { alert("Wallet not connected!"); return; }
        try {
            const encodedMessage = new TextEncoder().encode(message);
            const signedMessage = await signMessage(encodedMessage);
            setSignature(bs58.encode(signedMessage));
        } catch (error) {
            console.error("Failed to sign message:", error);
            alert(`Signing failed: ${error}`);
        }
    }, [publicKey, signMessage, message]);

    const handleVerify = useCallback(() => {
        if (!publicKey || !signature || !message) { return; }
        try {
            const signatureBytes = bs58.decode(signature);
            const messageBytes = new TextEncoder().encode(message);
            const publicKeyBytes = publicKey.toBytes();
            const result = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
            setVerificationResult(result);
        } catch (error) {
            console.error("Verification failed:", error);
            setVerificationResult(false);
        }
    }, [publicKey, signature, message]);

    return (
        <div className="mt-6 w-full max-w-md text-left">
            <h2 className="text-xl font-semibold text-white mb-2">Sign & Verify Message</h2>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <div className="flex gap-2 mt-2">
                <button onClick={handleSign} disabled={!publicKey} className="flex-1 px-4 py-2 font-bold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-500">Sign Message</button>
                <button onClick={handleVerify} disabled={!signature} className="flex-1 px-4 py-2 font-bold text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-gray-500">Verify Signature</button>
            </div>
            {signature && <p className="text-sm text-gray-300 mt-2 break-all">Signature: {signature}</p>}
            {verificationResult !== null && (
                <p className={`text-lg font-bold mt-2 ${verificationResult ? 'text-green-500' : 'text-red-500'}`}>
                    Verification: {verificationResult ? "Successful!" : "Failed!"}
                </p>
            )}
        </div>
    );
};

// Main Home Component
export default function Home() {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({});
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<TokenAccount | null>(null);

  const fetchTokenMetadata = useCallback(async () => {
    setIsMetadataLoading(true);
    try {
      const response = await fetch("https://token.jup.ag/all");
      const data = await response.json();
      const metadataMap: Record<string, TokenMetadata> = data.reduce((acc: any, token: any) => { acc[token.address] = { name: token.name, symbol: token.symbol, logoURI: token.logoURI }; return acc; }, {});
      setTokenMetadata(metadataMap);
    } catch (error) { console.error("Failed to fetch token metadata:", error); } finally { setIsMetadataLoading(false); }
  }, []);

  const fetchAllBalances = useCallback(async () => {
    if (!publicKey) return;
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
      const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
      const filteredAccounts = accounts.value.map(a => ({ mint: a.account.data.parsed.info.mint, amount: a.account.data.parsed.info.tokenAmount.uiAmountString, decimals: a.account.data.parsed.info.tokenAmount.decimals })).filter(a => parseFloat(a.amount) > 0);
      setTokenAccounts(filteredAccounts);
    } catch (error) { console.error("Failed to fetch balances:", error); }
  }, [publicKey, connection]);

  useEffect(() => { fetchTokenMetadata(); }, [fetchTokenMetadata]);
  useEffect(() => { if (connected && publicKey) { fetchAllBalances(); } else { setBalance(null); setTokenAccounts([]); setSelectedToken(null); } }, [connected, publicKey, fetchAllBalances]);

  const handleAirdrop = useCallback(async () => {
    if (!publicKey) return; setIsAirdropping(true);
    try {
      const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction({ signature, ...(await connection.getLatestBlockhash()) });
      await fetchAllBalances();
    } catch (error) { console.error("Airdrop failed:", error); } finally { setIsAirdropping(false); }
  }, [publicKey, connection, fetchAllBalances]);

  const handleTransferClose = () => { setSelectedToken(null); fetchAllBalances(); };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center justify-center gap-4 p-6 bg-gray-800/50 rounded-lg shadow-xl min-w-[450px]">
        <WalletMultiButton />
        {connected && publicKey ? (
          <div className="text-center mt-4 w-full">
            {selectedToken ? (
              <TransferForm token={selectedToken} metadata={tokenMetadata[selectedToken.mint]} onClose={handleTransferClose} />
            ) : (
              <>
                <p className="text-2xl font-bold text-white">SOL Balance: {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}</p>
                <button onClick={handleAirdrop} disabled={isAirdropping} className="mt-4 px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">{isAirdropping ? "Airdropping..." : "Request 1 SOL Airdrop"}</button>
                <div className="mt-6 w-full max-w-md"><h2 className="text-xl font-semibold text-white mb-2">Your Tokens</h2><div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">{isMetadataLoading ? <p className="text-gray-400">Loading token info...</p> : tokenAccounts.length > 0 ? (tokenAccounts.map((token) => {const metadata = tokenMetadata[token.mint];return (<div key={token.mint} className="bg-gray-900/70 p-3 rounded-md text-left flex items-center justify-between"><div className="flex items-center gap-3">{metadata?.logoURI ? <Image src={metadata.logoURI} alt={metadata.name} width={24} height={24} className="w-6 h-6 rounded-full"/> : <div className="w-6 h-6 rounded-full bg-gray-700"/>}<div><p className="font-bold text-white">{metadata?.symbol || "Unknown"}</p></div></div><div className="flex items-center gap-4"><span className="font-bold text-white">{token.amount}</span><button onClick={() => setSelectedToken(token)} className="px-3 py-1 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700">Send</button></div></div>)})) : (<p className="text-gray-400">No tokens found.</p>)}</div></div>
                <hr className="w-full border-gray-700 my-6" />
                <Signer />
              </>
            )}
          </div>
        ) : (
          <p className="text-white mt-4">Connect your wallet to get started.</p>
        )}
      </div>
    </main>
  );
}