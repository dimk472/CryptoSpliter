export const SITE_URL = "https://cryptosplitter.app";
export const SITE_NAME = "CryptoSplitter";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export type SeoConfig = {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

export const HOME_SEO: SeoConfig = {
  title: "Split Crypto Expenses & Bills On-Chain | CryptoSplitter",
  description:
    "Split crypto expenses & group bills with friends on Ethereum, Base, Polygon & 10+ chains. Create shared events, set shares, and settle payments directly from your wallet.",
  path: "/",
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description:
          "Split crypto expenses & bills instantly with friends on multiple blockchains.",
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.png`,
        },
      },
      {
        "@type": "WebApplication",
        name: "CryptoSplitter – Split Crypto Expenses",
        url: SITE_URL,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        browserRequirements: "Requires a Web3 wallet (MetaMask, Coinbase Wallet, etc.)",
        description:
          "The decentralized app to split crypto expenses, divide shared bills, and settle payments on-chain.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "Split crypto expenses across Ethereum, Base, Polygon, Arbitrum, & 10+ chains",
          "Wallet-native P2P crypto payments",
          "On-chain crypto bill splitting ledger",
          "Contact management for quick crypto splits",
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do I split crypto expenses with CryptoSplitter?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "To split crypto expenses, connect your Web3 wallet, create an event, enter total costs and participants' wallet addresses, and let everyone settle their share directly on-chain.",
            },
          },
          {
            "@type": "Question",
            name: "What is the best app to split crypto bills?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CryptoSplitter is the premier decentralized app to split crypto bills with friends. It supports ETH, USDC, USDT, and popular EVM networks with instant wallet-to-wallet settlement.",
            },
          },
          {
            "@type": "Question",
            name: "Which blockchains can I use to split crypto?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "CryptoSplitter supports Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, BNB Chain, Linea, Scroll, and ZKsync Sepolia testnet.",
            },
          },
          {
            "@type": "Question",
            name: "Do I need a crypto wallet to use CryptoSplitter?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Connect a Web3 wallet such as MetaMask, Coinbase Wallet, Rainbow, Rabby, or Zerion to create events and send payments on-chain.",
            },
          },
        ],
      },
    ],
  },
};

export const PRIVACY_SEO: SeoConfig = {
  title: "Privacy Policy",
  description:
    "Learn how CryptoSplitter collects, uses, and protects your data. We never store private keys and respect your privacy on our decentralized expense-splitting platform.",
  path: "/privacy",
};

export const TERMS_SEO: SeoConfig = {
  title: "Terms of Use",
  description:
    "Read the CryptoSplitter Terms of Use. Understand your responsibilities, platform limitations, and the risks of on-chain cryptocurrency transactions.",
  path: "/terms",
};

export const DONATE_SEO: SeoConfig = {
  title: "Support CryptoSplitter",
  description:
    "Support the development of CryptoSplitter. Donate via PayPal or send BTC, ETH, USDT, USDC, BNB, or SOL to help keep the project running.",
  path: "/donate",
};
