<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
=======
# CryptoSplitter ⛓️

> **Trustless, on-chain expense splitting for groups — no middleman, no fees, no trust required.**

🌐 **Live Demo:** https://cryptosplitter.app/

<img width="1887" height="867" alt="image" src="https://github.com/user-attachments/assets/59d735cb-814b-4575-9ede-c46d419c3266" />

<img width="1887" height="731" alt="image" src="https://github.com/user-attachments/assets/94959453-e051-4709-b7f9-4eb28e1558ee" />

<img width="1877" height="652" alt="image" src="https://github.com/user-attachments/assets/50ab6719-394f-40f3-98c4-7d226b640a75" />

<img width="1882" height="712" alt="image" src="https://github.com/user-attachments/assets/360a925c-7123-4bd8-8d0a-4c3b69dc79ff" />

---

## What is CryptoSplitter?

CryptoSplitter is a decentralized Web3 application that lets groups split shared expenses on-chain. Whether it's a trip, dinner, or shared accommodation — simply create an event, add your friends' wallet addresses, and let the smart contract handle the rest.

No banks. No PayPal. No trust required.

---

## Features

- 🔗 **On-chain settlements** — every expense event is registered on the blockchain via a smart contract
- 💱 **Multi-currency support** — enter amounts in 35+ fiat currencies (EUR, USD, GBP, JPY and more), automatically converted to USD for on-chain storage
- 👥 **Group splitting** — split expenses equally among 2–10 participants
- 💳 **Multi-wallet support** — MetaMask, Coinbase Wallet, Rainbow, Rabby, Zerion
- 📊 **My Events dashboard** — track all your events, see who has paid and who hasn't
- ✅ **Pay now button** — participants can pay their share directly from the app
- 🔍 **Real-time status** — Pending / Partial / Settled per event
- 🔒 **Trustless** — smart contract enforces payment rules with a 2% tolerance via Chainlink price feeds

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Custom CSS |
| Blockchain | Solidity 0.8 + Foundry |
| Web3 SDK | Thirdweb v5 |
| Price Feed | Chainlink ETH/USD Oracle |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL) |
| Hosting | Netlify (frontend) + Railway (backend) |

---

## Supported Networks

| Network | Status |
|---------|--------|
| Sepolia Testnet | ✅ Live |
| Ethereum Mainnet | 🔜 Coming soon |
| Polygon | 🔜 Coming soon |
| Arbitrum | 🔜 Coming soon |
| Base | 🔜 Coming soon |

---

## How It Works

```
1. Connect your wallet
2. Create a splitting event (name, currency, amount, category)
3. Add participants (names + wallet addresses)
4. Review the split breakdown
5. Confirm on-chain → smart contract registers the event
6. Participants pay their share directly via "Pay now"
7. Smart contract verifies the ETH amount using Chainlink price feed
8. ETH is sent directly to the creator's wallet
```

---

## Smart Contract

The smart contract is written in Solidity and deployed on Sepolia testnet.

**Contract Address (Sepolia):** `0x219dbA77360054Ea2c002E4ccc88ABd935Fa6CbE`

### Key Functions

| Function | Description |
|----------|-------------|
| `createEvent(bytes32 offChainId, uint256 priceUsd, address[] debtors)` | Creates a new splitting event |
| `payment(bytes32 offChainId)` | Participant pays their share |
| `getSharedPriceInEth(bytes32 offChainId)` | Returns the share amount in ETH |
| `getPrice(bytes32 offChainId)` | Returns the share amount in USD (1e18) |
| `completed(bytes32 offChainId)` | Returns true if all participants have paid |
| `closeEvent(bytes32 offChainId)` | Owner closes an event |

### Payment Validation

The contract uses **Chainlink ETH/USD price feed** to validate payments. A **2% tolerance** (`TOLERANCE_BPS = 200`) is applied to account for price fluctuations between the time the user sees the amount and when the transaction is confirmed.

---

## Project Structure

```
CryptoSplitter/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── components/        # UI components
│   │   │   ├── CryptoSplitter.tsx   # Main app + splitting form
│   │   │   ├── MyEventsTab.tsx      # Events dashboard
│   │   │   ├── PrivacyPolicy.tsx
│   │   │   └── TermsOfUse.tsx
│   │   ├── blokchain/
│   │   │   └── contract.ts    # Thirdweb contract setup
│   │   └── ThirdwebClient.tsx
│   └── .env
│
├── backend/                   # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   └── events.ts      # REST endpoints
│   │   ├── config/
│   │   │   └── supabase.ts
│   │   └── index.ts
│   └── .env
│
└── README.md
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- MetaMask or any supported wallet
- Supabase account
- Thirdweb account

### 1. Clone the repository

```bash
git clone https://github.com/dimk472/CryptoSplitter.git
cd CryptoSplitter
```

### 2. Setup Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

```bash
npm run dev
```

### 3. Setup Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

```bash
npm run dev
```

### 4. Supabase Database Schema

```sql
-- Events table
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

-- Debts table
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

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/events?wallet=0x...` | Get all events for a wallet |
| `POST` | `/events` | Create a new event |
| `POST` | `/events/:offChainId/pay` | Mark a payment as paid |

---

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Netlify |
| Backend | Railway |
| Database | Supabase |
| Smart Contract | Foundry → Sepolia |

---

## Developer

Designed & developed by **Dimitrios Kazantzis**

- 📧 dimitriskaza2007@gmail.com
- 💼 [LinkedIn](https://www.linkedin.com/in/dimitris-kazantzis-5b575936a/)

---

## License

This project is for educational and portfolio purposes.
>>>>>>> 15831d80b9e5867055aa02e5f0a7d70ae77d842f
