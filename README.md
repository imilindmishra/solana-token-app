# Solana Token Toolkit


## ✨ Features

This application covers the vast majority of core interactions required for a modern Solana dApp.

* **Wallet Integration:** Connects to popular Solana wallets like Phantom and Solflare using `@solana/wallet-adapter`.
* **Balance Display:** Fetches and displays the user's native SOL balance.
* **Devnet SOL Airdrop:** A one-click button to request test SOL from the faucet on the Devnet.
* **SPL Token Display:** Fetches and lists all SPL (Solana Program Library) tokens held by the user.
* **Token Metadata:** Enriches the token list by fetching names, symbols, and logos from the Jupiter Token List API.
* **SPL Token Transfers:** A complete transfer flow, including:
    * Finding Associated Token Accounts (ATAs).
    * Automatically creating the recipient's ATA if it doesn't exist.
    * Constructing and sending the transfer transaction.
* **Cryptographic Message Signing:** Allows users to prove wallet ownership by signing a custom message (a gas-less operation).
* **Signature Verification:** Verifies the authenticity of a signed message using the public key, message, and signature.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Solana Core Libraries:**
    * `@solana/web3.js`: For core Solana data structures and RPC communication.
    * `@solana/spl-token`: For SPL Token instructions and utilities.
* **Wallet Interaction:**
    * `@solana/wallet-adapter`: The standard set of libraries for integrating Solana wallets into a React app.
* **Cryptography Utilities:**
    * `bs58`: For encoding/decoding data in Base58 format.
    * `tweetnacl`: For performing high-speed cryptographic signature verification.
* **Data Source:**
    * [Jupiter Token List API](https://token.jup.ag/all): For fetching SPL token metadata.
