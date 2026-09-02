import { SITE_NAME, SITE_URL, type SeoConfig } from "./seoConfig";

export type SplitPage = {
  slug: string;
  kind: "chain" | "token";
  label: string;
  headline: string;
  subheadline: string;
  intro: string;
  benefits: string[];
  steps: string[];
  faqs: { question: string; answer: string }[];
  relatedSlugs: string[];
};

function buildSeo(page: SplitPage): SeoConfig {
  const path = `/split-${page.slug}`;
  const title =
    page.kind === "chain"
      ? `Split Crypto Expenses on ${page.label}`
      : `Split ${page.label} Bills with Friends`;

  const description =
    page.kind === "chain"
      ? `Split shared crypto expenses on ${page.label}. Create events, assign shares, and settle payments on-chain from your wallet. Fast, transparent, 0.5% fee.`
      : `Split ${page.label} expenses with friends on-chain. Track who owes what and pay your share directly from MetaMask, Coinbase Wallet, or Rainbow.`;

  return {
    title,
    description,
    path,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: title,
          url: `${SITE_URL}${path}`,
          description,
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        },
        {
          "@type": "FAQPage",
          mainEntity: page.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        },
      ],
    },
  };
}

const sharedSteps = [
  "Connect your Web3 wallet (MetaMask, Coinbase Wallet, Rainbow, and more).",
  "Create a split event, add participants, and set each person's share.",
  "Everyone settles their portion with an on-chain payment — no middleman.",
];

export const SPLIT_PAGES: Record<string, SplitPage> = {
  eth: {
    slug: "eth",
    kind: "token",
    label: "ETH",
    headline: "Split ETH expenses with your crew",
    subheadline: "Shared gas, dinners, trips — settle in Ether on-chain",
    intro:
      "Whether you covered gas for the group, paid for a team dinner, or fronted a shared purchase, CryptoSplitter makes it easy to split ETH expenses. Everyone sees exactly what they owe and pays directly from their wallet.",
    benefits: [
      "Settle in native ETH on Ethereum, Base, Arbitrum, and other EVM chains",
      "Transparent on-chain ledger — no spreadsheets or trust required",
      "Custom shares per person, not just equal splits",
      "Works with MetaMask, Coinbase Wallet, Rainbow, Rabby, and Zerion",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Can I split ETH on multiple chains?",
        answer:
          "Yes. CryptoSplitter supports Ethereum mainnet, Base, Arbitrum, Polygon, Optimism, and more. Connect your wallet and choose the chain when creating an event.",
      },
      {
        question: "Do I need to send ETH manually to each person?",
        answer:
          "Each participant pays their own share from their wallet. You don't need to collect and redistribute funds yourself.",
      },
      {
        question: "What fees does CryptoSplitter charge?",
        answer: "CryptoSplitter charges a 0.5% platform fee on settlements, plus standard network gas fees.",
      },
    ],
    relatedSlugs: ["ethereum", "base", "arbitrum", "usdc"],
  },

  usdc: {
    slug: "usdc",
    kind: "token",
    label: "USDC",
    headline: "Split USDC bills on-chain",
    subheadline: "Stablecoin expense sharing without the awkward follow-ups",
    intro:
      "USDC is the go-to stablecoin for shared costs — rent splits, group subscriptions, travel expenses. CryptoSplitter lets you track who owes what and settle in USDC across major EVM networks.",
    benefits: [
      "Split dollar-pegged expenses without price volatility during settlement",
      "Supported on Ethereum, Base, Arbitrum, Polygon, and more",
      "Clear breakdown of each participant's share before anyone pays",
      "On-chain proof of payment for every settlement",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Is USDC supported on Base and Arbitrum?",
        answer:
          "Yes. You can create and settle USDC splits on Base, Arbitrum, Ethereum, Polygon, Optimism, and other supported chains.",
      },
      {
        question: "Can I split a bill unevenly in USDC?",
        answer:
          "Absolutely. Assign custom amounts or percentages to each participant — you're not limited to equal splits.",
      },
      {
        question: "Is USDC the same as USD in CryptoSplitter?",
        answer:
          "Events can be denominated in fiat for tracking, but settlement happens on-chain in the native token or stablecoin of your chosen network.",
      },
    ],
    relatedSlugs: ["usdt", "base", "ethereum", "eth"],
  },

  usdt: {
    slug: "usdt",
    kind: "token",
    label: "USDT",
    headline: "Split USDT expenses with friends",
    subheadline: "Tether settlements made simple and transparent",
    intro:
      "Split group costs settled in USDT across EVM chains. CryptoSplitter tracks contributions and balances so everyone knows their share before sending a single transaction.",
    benefits: [
      "Split Tether (USDT) expenses on major EVM networks",
      "Avoid manual calculations and payment chasing",
      "Wallet-to-wallet settlements — you keep custody",
      "Full transaction history on-chain",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Which chains support USDT splits?",
        answer:
          "USDT splits are available on Ethereum, BNB Chain, Polygon, Arbitrum, and other EVM chains supported by CryptoSplitter.",
      },
      {
        question: "How is USDT different from USDC on CryptoSplitter?",
        answer:
          "The splitting workflow is identical. Choose the stablecoin and network that your group prefers when connecting a wallet and creating an event.",
      },
    ],
    relatedSlugs: ["usdc", "bnb", "polygon", "ethereum"],
  },

  ethereum: {
    slug: "ethereum",
    kind: "chain",
    label: "Ethereum",
    headline: "Split crypto expenses on Ethereum",
    subheadline: "Mainnet expense sharing with full on-chain transparency",
    intro:
      "Split shared costs on Ethereum mainnet with CryptoSplitter. Create an event, invite participants, and let everyone settle their share with a direct wallet payment on the world's leading smart-contract network.",
    benefits: [
      "Native Ethereum mainnet support with MetaMask and major wallets",
      "Immutable on-chain record of every split and payment",
      "Support for ETH and ERC-20 stablecoins like USDC and USDT",
      "No custodial accounts — funds never pass through us",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Does CryptoSplitter work on Ethereum mainnet?",
        answer:
          "Yes. Connect your wallet, select Ethereum, create a split event, and participants pay on mainnet.",
      },
      {
        question: "What about Ethereum L2s?",
        answer:
          "CryptoSplitter also supports Base, Arbitrum, Optimism, Linea, and Scroll for lower-fee settlements.",
      },
    ],
    relatedSlugs: ["eth", "usdc", "base", "arbitrum"],
  },

  base: {
    slug: "base",
    kind: "chain",
    label: "Base",
    headline: "Split crypto bills on Base",
    subheadline: "Low-fee expense sharing on Coinbase's L2",
    intro:
      "Base offers fast, cheap transactions — perfect for splitting everyday expenses. Use CryptoSplitter to divide restaurant tabs, subscription costs, or group purchases and settle on Base in seconds.",
    benefits: [
      "Low gas fees compared to Ethereum mainnet",
      "Ideal for frequent small splits among friends",
      "Compatible with Coinbase Wallet and MetaMask",
      "ETH and USDC settlements on Base",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Why split on Base instead of Ethereum mainnet?",
        answer:
          "Base typically has lower transaction fees, making it better for smaller or frequent splits among friends.",
      },
      {
        question: "Can I use Coinbase Wallet with CryptoSplitter on Base?",
        answer: "Yes. Coinbase Wallet is fully supported alongside MetaMask, Rainbow, and other wallets.",
      },
    ],
    relatedSlugs: ["ethereum", "usdc", "eth", "optimism"],
  },

  arbitrum: {
    slug: "arbitrum",
    kind: "chain",
    label: "Arbitrum",
    headline: "Split expenses on Arbitrum",
    subheadline: "Fast L2 settlements for shared crypto costs",
    intro:
      "Arbitrum One combines Ethereum security with lower fees. CryptoSplitter lets your group split expenses and pay on Arbitrum without the mainnet gas overhead.",
    benefits: [
      "Arbitrum One L2 support with low transaction costs",
      "Settle in ETH, USDC, or USDT on Arbitrum",
      "On-chain transparency for every participant",
      "Works with all major EVM wallets",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Is Arbitrum safe for splitting payments?",
        answer:
          "Arbitrum inherits Ethereum's security model. All settlements are standard on-chain transactions you can verify on Arbiscan.",
      },
      {
        question: "Can I bridge funds before splitting on Arbitrum?",
        answer:
          "Yes. Bridge ETH or stablecoins to Arbitrum using your preferred bridge, then connect and create a split event.",
      },
    ],
    relatedSlugs: ["ethereum", "base", "optimism", "usdc"],
  },

  polygon: {
    slug: "polygon",
    kind: "chain",
    label: "Polygon",
    headline: "Split crypto on Polygon",
    subheadline: "Affordable on-chain expense sharing for groups",
    intro:
      "Polygon's low fees make it practical for splitting everyday expenses. Track shared costs and settle with MATIC, USDC, or USDT directly from your wallet.",
    benefits: [
      "Very low transaction fees on Polygon PoS",
      "Wide wallet support including MetaMask and Rainbow",
      "Stablecoin and native token settlements",
      "Instant on-chain confirmation for payments",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "What tokens can I split on Polygon?",
        answer:
          "You can settle splits using MATIC, USDC, USDT, and other tokens supported on Polygon PoS.",
      },
    ],
    relatedSlugs: ["usdc", "usdt", "ethereum", "bnb"],
  },

  optimism: {
    slug: "optimism",
    kind: "chain",
    label: "Optimism",
    headline: "Split bills on Optimism",
    subheadline: "OP Stack L2 expense sharing with low fees",
    intro:
      "Split group expenses on Optimism with fast, inexpensive transactions. CryptoSplitter handles the math — your crew handles the payments from their own wallets.",
    benefits: [
      "Optimism mainnet support with sub-cent typical fees",
      "ETH and stablecoin settlements",
      "Part of the Superchain ecosystem alongside Base",
      "No account signup — just connect a wallet",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "How is Optimism different from Base for splits?",
        answer:
          "Both are L2s with low fees. Choose whichever network your group already uses — the CryptoSplitter workflow is the same.",
      },
    ],
    relatedSlugs: ["base", "ethereum", "arbitrum", "eth"],
  },

  avalanche: {
    slug: "avalanche",
    kind: "chain",
    label: "Avalanche",
    headline: "Split crypto expenses on Avalanche",
    subheadline: "C-Chain settlements for shared costs",
    intro:
      "Use Avalanche C-Chain for quick, low-cost expense splits. CryptoSplitter creates a clear ledger so everyone in the group knows exactly what to pay.",
    benefits: [
      "Avalanche C-Chain support with fast finality",
      "AVAX and stablecoin settlements",
      "Ideal for DeFi-native friend groups",
      "Transparent on-chain payment history",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Does CryptoSplitter support Avalanche C-Chain?",
        answer: "Yes. Connect your wallet, switch to Avalanche, and create a split event.",
      },
    ],
    relatedSlugs: ["ethereum", "polygon", "bnb", "usdc"],
  },

  bnb: {
    slug: "bnb",
    kind: "chain",
    label: "BNB Chain",
    headline: "Split expenses on BNB Chain",
    subheadline: "BSC expense sharing with minimal fees",
    intro:
      "Split shared costs on BNB Smart Chain with CryptoSplitter. Perfect for groups already active in the BSC ecosystem who want transparent, wallet-native settlements.",
    benefits: [
      "BNB Chain (BSC) support with low gas",
      "BNB and BEP-20 stablecoin settlements",
      "Compatible with MetaMask and Trust Wallet",
      "No intermediaries holding your funds",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Can I split USDT on BNB Chain?",
        answer: "Yes. USDT on BSC is commonly used for group settlements on CryptoSplitter.",
      },
    ],
    relatedSlugs: ["usdt", "polygon", "avalanche", "ethereum"],
  },

  linea: {
    slug: "linea",
    kind: "chain",
    label: "Linea",
    headline: "Split crypto on Linea",
    subheadline: "zkEVM L2 expense sharing made simple",
    intro:
      "Linea brings Ethereum-compatible, low-cost transactions. Split expenses with your group and settle on Linea without leaving the EVM ecosystem you already use.",
    benefits: [
      "Linea zkEVM L2 support",
      "Low fees for small group splits",
      "Full EVM wallet compatibility",
      "On-chain audit trail for every payment",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "What wallets work with Linea on CryptoSplitter?",
        answer:
          "Any EVM-compatible wallet such as MetaMask, Rabby, or Rainbow works with Linea.",
      },
    ],
    relatedSlugs: ["scroll", "ethereum", "base", "arbitrum"],
  },

  scroll: {
    slug: "scroll",
    kind: "chain",
    label: "Scroll",
    headline: "Split expenses on Scroll",
    subheadline: "zkRollup settlements for shared crypto bills",
    intro:
      "Scroll offers Ethereum-grade security with zkRollup efficiency. Use CryptoSplitter to divide costs and pay your share on Scroll from any supported wallet.",
    benefits: [
      "Scroll zkRollup mainnet support",
      "Ethereum-equivalent security with lower fees",
      "ETH and stablecoin settlements",
      "Simple 3-step split workflow",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Is Scroll good for small expense splits?",
        answer:
          "Yes. Scroll's low fees make it practical even for smaller amounts split among friends.",
      },
    ],
    relatedSlugs: ["linea", "ethereum", "base", "usdc"],
  },
};

export const SPLIT_PAGE_SLUGS = Object.keys(SPLIT_PAGES);

export function getSplitPage(slug: string): SplitPage | undefined {
  return SPLIT_PAGES[slug];
}

export function getSplitPageSeo(slug: string): SeoConfig | undefined {
  const page = getSplitPage(slug);
  return page ? buildSeo(page) : undefined;
}

export function getAllSplitPagePaths(): string[] {
  return SPLIT_PAGE_SLUGS.map((slug) => `/split-${slug}`);
}
