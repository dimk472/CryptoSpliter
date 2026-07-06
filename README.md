# CryptoSplitter ⛓️

> **Trustless, on-chain expense splitting for groups — pay in ETH or LINK, with equal or custom payment amounts, no middleman, no fees, no trust required.**

🌐 **Live Demo:** https://cryptosplitter.app/

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

![Solidity](https://img.shields.io/badge/Solidity-0.8-363636?logo=solidity)

![Foundry](https://img.shields.io/badge/Foundry-Smart%20Contracts-orange)

![Chainlink](https://img.shields.io/badge/Chainlink-Price%20Feeds-375BD2)

![Sepolia](https://img.shields.io/badge/Network-Sepolia-green)

![ETH](https://img.shields.io/badge/Payments-ETH-blue)

![LINK](https://img.shields.io/badge/Payments-LINK-2A5ADA)

<img width="1887" height="867" alt="image" src="https://github.com/user-attachments/assets/59d735cb-814b-4575-9ede-c46d419c3266" />

<img width="1887" height="731" alt="image" src="https://github.com/user-attachments/assets/94959453-e051-4709-b7f9-4eb28e1558ee" />

<img width="1877" height="652" alt="image" src="https://github.com/user-attachments/assets/50ab6719-394f-40f3-98c4-7d226b640a75" />

<img width="1882" height="712" alt="image" src="https://github.com/user-attachments/assets/360a925c-7123-4bd8-8d0a-4c3b69dc79ff" />

---

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

# License

Copyright (c) 2026 DIMITRIOS KAZANTZIS

All Rights Reserved.

This software, including all source code, documentation, designs, and associated files, is the exclusive property of the copyright holder.

No permission is granted to use, copy, modify, merge, publish, distribute, sublicense, sell, license, host, deploy, or otherwise exploit this software, in whole or in part, without the prior written permission of the copyright holder.

Commercial use of this software is strictly prohibited.

Creating derivative works or products based on this software is prohibited without prior written authorization.

Viewing or accessing this repository does not grant any license or right to use the software.

Unauthorized use, reproduction, or distribution may result in legal action under applicable copyright laws.

For licensing inquiries, contact:

[dimitriskaza2007@gmail.com](mailto:dimitriskaza2007@gmail.com)
