# CryptoSplitter ⛓️

> **Trustless, on-chain expense splitting for groups — pay in ETH or LINK, with equal or custom payment amounts, no middleman, no fees, no trust required.**

🌐 **Live Demo:** https://cryptosplitter.app/



# What is CryptoSplitter?

CryptoSplitter is a decentralized Web3 application that enables groups to split shared expenses completely on-chain.

Whether it's a vacation, dinner, Airbnb, concert tickets, or any shared purchase, simply create an expense event, invite participants by wallet address, and let the smart contract handle settlement securely.

Expenses can be split either **equally** between all participants or using **custom payment amounts**, allowing every participant to pay exactly what they owe.

For example, if the total expense is **€7**, the owner can assign one participant to pay **€2** and another participant to pay **€5**, instead of splitting the amount equally.

Unlike traditional expense-sharing apps, CryptoSplitter never holds user funds. Payments are made directly between participants using blockchain transactions, eliminating intermediaries and removing the need to trust a centralized service.

Users can settle expenses using either **ETH** or **Chainlink LINK** on the Sepolia testnet.

---

# Features

- 🔗 **Fully on-chain settlements** powered by Solidity smart contracts
- 💱 **35+ supported fiat currencies** converted automatically to USD
- 👥 **Split expenses** between 2–10 participants
- ⚖️ **Equal or custom payment amounts**
- 💳 **Pay using ETH or LINK**
- 🔄 **Automatic token conversion** using Chainlink Price Feeds
- 👛 **Multiple wallet support**
  - MetaMask
  - Coinbase Wallet
  - Rainbow
  - Rabby
  - Zerion

- 📊 **My Events dashboard**
- ✅ **One-click payments**
- 🔍 **Real-time payment status**
- 🔒 **Trustless payment validation**
- ⚡ Direct wallet-to-wallet transfers
- 🌐 No banks, no PayPal, no custodial wallets

---

# Tech Stack

| Layer       | Technology                             |
| ----------- | -------------------------------------- |
| Frontend    | React 18 + TypeScript + Vite           |
| Styling     | Custom CSS                             |
| Blockchain  | Solidity 0.8 + Foundry                 |
| Web3 SDK    | Thirdweb v5                            |
| Tokens      | ETH + Chainlink LINK                   |
| Price Feeds | Chainlink ETH/USD + LINK/USD           |
| Backend     | Node.js + Express + TypeScript         |
| Database    | Supabase (PostgreSQL)                  |
| Hosting     | Netlify (Frontend) + Railway (Backend) |

---

# Supported Networks

| Network          | Supported Tokens | Status         |
| ---------------- | ---------------- | -------------- |
| Sepolia Testnet  | ETH, LINK        | ✅ Live        |
| Ethereum Mainnet | ETH, LINK        | 🔜 Coming Soon |
| Polygon          | Native Token     | 🔜 Coming Soon |
| Arbitrum         | ETH              | 🔜 Coming Soon |
| Base             | ETH              | 🔜 Coming Soon |

---

# Supported Payment Tokens

| Token            | Network | Status       |
| ---------------- | ------- | ------------ |
| ETH              | Sepolia | ✅ Supported |
| Chainlink (LINK) | Sepolia | ✅ Supported |

Participants can choose their preferred payment token when settling an expense.

The application automatically calculates the required token amount using live Chainlink Price Feeds, ensuring every participant pays exactly their assigned USD-equivalent amount.

---

# How It Works

```text
1. Connect your wallet

2. Create a new expense
   • Event name
   • Category
   • Currency
   • Total amount

3. Add participants
   • Name
   • Wallet address

4. Choose the split type
   • Equal split
   • Custom amounts

5. Assign individual amounts (for custom split)
   • Example:
     Alice → €2
     Bob → €5

6. Review the payment distribution

7. Confirm the transaction
   → Smart contract creates the event

8. Participants choose a payment method
   • ETH
   • LINK

9. Pay directly from the application

10. Smart contract validates each payment using Chainlink Price Feeds

11. Funds are transferred directly to the creator's wallet

12. Event status updates automatically
    Pending → Partial → Settled
```

---

# Example

Instead of splitting every expense equally, CryptoSplitter also supports custom payment amounts.

**Example**

| Participant | Amount Owed |
| ----------- | ----------: |
| Alice       |          €2 |
| Bob         |          €5 |

**Total Expense:** €7

Each participant pays only their assigned amount.

This makes CryptoSplitter suitable for restaurant bills, group shopping, vacations, Airbnb bookings, concert tickets, or any situation where participants owe different amounts.

---

# Smart Contract

The CryptoSplitter smart contract is written in Solidity and deployed on the Sepolia testnet.

It supports:

- Equal expense splitting
- Custom participant amounts
- ETH payments
- LINK (ERC-20) payments
- Chainlink Price Feed validation
- Automatic payment verification
- Direct wallet-to-wallet settlement
- Event completion tracking

**Contract Address (Sepolia)**

```text
0x219dbA77360054Ea2c002E4ccc88ABd935Fa6CbE
```

---

# Smart Contract Functions

| Function                                                               | Description                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------- |
| `createEvent(bytes32 offChainId, uint256 priceUsd, address[] debtors)` | Creates a new expense event                       |
| `payment(bytes32 offChainId)`                                          | Pay using ETH                                     |
| `paymentLINK(bytes32 offChainId)`                                      | Pay using LINK                                    |
| `getSharedPriceInEth(bytes32 offChainId)`                              | Returns required ETH amount                       |
| `getSharedPriceInLink(bytes32 offChainId)`                             | Returns required LINK amount                      |
| `getPrice(bytes32 offChainId)`                                         | Returns the participant's assigned payment amount |
| `completed(bytes32 offChainId)`                                        | Returns true when everyone has paid               |
| `closeEvent(bytes32 offChainId)`                                       | Closes an event                                   |

---

# Payment Validation

CryptoSplitter uses **Chainlink Price Feeds** to determine the correct payment amount in real time.

Supported payment methods:

- ETH using the ETH/USD Price Feed
- LINK using the LINK/USD Price Feed

To account for market volatility between quote generation and transaction confirmation, the smart contract applies a **2% payment tolerance** (`TOLERANCE_BPS = 200`).

Each participant's individual debt is stored separately, allowing both equal and custom payment distributions while maintaining fully trustless on-chain verification.

---

# Project Structure

```text
CryptoSplitter/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CryptoSplitter.tsx
│   │   │   ├── MyEventsTab.tsx
│   │   │   ├── PrivacyPolicy.tsx
│   │   │   └── TermsOfUse.tsx
│   │   ├── blockchain/
│   │   │   └── contract.ts
│   │   └── ThirdwebClient.tsx
│   └── .env
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── events.ts
│   │   ├── config/
│   │   │   └── supabase.ts
│   │   └── index.ts
│   └── .env
│
├── contracts/
│
└── README.md
```

---

# Getting Started

## Prerequisites

- Node.js 18+
- MetaMask or another supported wallet
- Thirdweb account
- Supabase account

---

## Clone the repository

```bash
git clone https://github.com/dimk472/CryptoSplitter.git

cd CryptoSplitter
```

---

## Frontend Setup

```bash
cd frontend

npm install
```

Create:

```env
frontend/.env
```

```env
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Run:

```bash
npm run dev
```

---

## Backend Setup

```bash
cd backend

npm install
```

Create:

```env
backend/.env
```

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Run:

```bash
npm run dev
```

---

# Supabase Schema

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  off_chain_id TEXT UNIQUE,
  title TEXT NOT NULL,
  category TEXT,
  total_amount TEXT,
  currency TEXT,
  creator_wallet TEXT,
  chain_id INTEGER,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  debtor_wallet TEXT,
  creditor_wallet TEXT,
  name TEXT,
  amount NUMERIC,
  paid BOOLEAN DEFAULT FALSE
);
```

---

# API Endpoints

| Method | Endpoint                  | Description               |
| ------ | ------------------------- | ------------------------- |
| GET    | `/events?wallet=0x...`    | Get events                |
| POST   | `/events`                 | Create event              |
| POST   | `/events/:offChainId/pay` | Mark payment as completed |

---

# Deployment

| Service         | Platform          |
| --------------- | ----------------- |
| Frontend        | Netlify           |
| Backend         | Railway           |
| Database        | Supabase          |
| Smart Contracts | Foundry → Sepolia |

---

# Roadmap

- ✅ ETH payments
- ✅ LINK payments
- ✅ Chainlink Price Feeds
- ✅ Custom expense amounts
- 🔜 Ethereum Mainnet
- 🔜 Polygon
- 🔜 Base
- 🔜 Arbitrum
- 🔜 Recurring shared expenses
- 🔜 Email / Wallet notifications
- 🔜 Expense analytics

---

# Developer

Designed & developed by **Dimitrios Kazantzis**

📧 [dimitriskaza2007@gmail.com](mailto:dimitriskaza2007@gmail.com)

💼 https://www.linkedin.com/in/dimitris-kazantzis-5b575936a/

---

---

# ❤️ Support the Project

If you enjoy using **CryptoSplitter** and would like to support its development, you can buy me a coffee or donate using PayPal or cryptocurrency.

## ☕ Buy Me a Coffee

**PayPal**

👉 https://paypal.me/dimkaza

Every contribution helps improve the project and add new features. Thank you for your support! ❤️

## 💰 Cryptocurrency Donations

### Supported Coins

| Coin               | Address                                        |
| ------------------ | ---------------------------------------------- |
| **Bitcoin (BTC)**  | `bc1q9n45lwyj0rz9kxk7n0zeqr2hf4hu056aznk8j2`   |
| **Ethereum (ETH)** | `0x19b2963c6a3a9e674390bab025a96b755137e774`   |
| **USDT (ERC-20)**  | `0x19b2963c6a3a9e674390bab025a96b755137e774`   |
| **USDC (ERC-20)**  | `0x19b2963c6a3a9e674390bab025a96b755137e774`   |
| **BNB**            | `0x19b2963c6a3a9e674390bab025a96b755137e774`   |
| **Solana (SOL)**   | `GB2FU6f7rAfzbGiLBYrmfJRJkKxb9nnzVTQJej2PzSGf` |

Thank you for supporting the development of **CryptoSplitter**! 🚀❤️

[dimitriskaza2007@gmail.com](mailto:dimitriskaza2007@gmail.com)
