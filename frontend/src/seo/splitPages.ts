import { SITE_NAME, SITE_URL, type SeoConfig } from "./seoConfig";

export type SplitPage = {
  slug: string;
  kind: "chain" | "token" | "usecase";
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
      : page.kind === "token"
      ? `Split ${page.label} Bills with Friends`
      : `${page.label} – CryptoSplitter`;

  const description =
    page.kind === "chain"
      ? `Split shared crypto expenses on ${page.label}. Create events, assign shares, and settle payments on-chain from your wallet. Fast, transparent, 0.5% fee.`
      : page.kind === "token"
      ? `Split ${page.label} expenses with friends on-chain. Track who owes what and pay your share directly from MetaMask, Coinbase Wallet, or Rainbow.`
      : page.intro;

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
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: page.label,
              item: `${SITE_URL}${path}`,
            },
          ],
        },
        {
          "@type": "HowTo",
          name: `How to split ${page.label} expenses with CryptoSplitter`,
          description: `Step-by-step guide to splitting ${page.label} expenses on-chain using your Web3 wallet.`,
          step: page.steps.map((stepText, idx) => ({
            "@type": "HowToStep",
            position: idx + 1,
            name: `Step ${idx + 1}`,
            text: stepText,
          })),
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
  "Connect your Web3 wallet (MetaMask, Coinbase Wallet, Rainbow, Rabby, and more).",
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
          "Each participant pays their own share directly from their wallet to the event creator. You don't need to collect and redistribute funds yourself.",
      },
      {
        question: "What fees does CryptoSplitter charge for ETH splits?",
        answer: "CryptoSplitter charges a small 0.5% platform fee on settlements, plus standard network gas fees.",
      },
    ],
    relatedSlugs: ["ethereum", "base", "arbitrum", "usdc", "link", "arb"],
  },

  usdc: {
    slug: "usdc",
    kind: "token",
    label: "USDC",
    headline: "Split USDC bills on-chain",
    subheadline: "Stablecoin expense sharing without price volatility",
    intro:
      "USDC is the gold-standard stablecoin for shared costs — rent splits, group subscriptions, travel expenses. CryptoSplitter lets you track who owes what and settle in USDC across major EVM networks.",
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
          "Target custom amounts or percentages for each participant — you're never limited to equal splits.",
      },
      {
        question: "Is USDC settlement instant?",
        answer:
          "Yes! Transactions settle on-chain directly from your Web3 wallet within seconds depending on network block time.",
      },
    ],
    relatedSlugs: ["usdt", "base", "ethereum", "eth", "arb"],
  },

  link: {
    slug: "link",
    kind: "token",
    label: "LINK",
    headline: "Split Chainlink (LINK) expenses on-chain",
    subheadline: "Pay group expenses and shared node costs in LINK",
    intro:
      "For Web3 builders, node operators, and crypto-native teams, CryptoSplitter makes splitting Chainlink (LINK) expenses seamless. Track contributions, calculate shares, and settle in LINK directly on-chain.",
    benefits: [
      "Settle shared node hosting, API costs, or group expenses in LINK",
      "Supported across Ethereum mainnet, Arbitrum, Polygon, and more",
      "Direct wallet-to-wallet transactions with transparent execution",
      "No custodial third party — full control in your wallet",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Which networks support LINK splits?",
        answer:
          "You can split LINK on Ethereum mainnet, Arbitrum, Polygon, and any supported EVM chain where LINK is deployed.",
      },
      {
        question: "How do I split a LINK expense with friends?",
        answer:
          "Connect your wallet, enter the total LINK amount or USD equivalent, add recipient wallet addresses, and confirm the split event on-chain.",
      },
    ],
    relatedSlugs: ["eth", "usdc", "arbitrum", "ethereum"],
  },

  arb: {
    slug: "arb",
    kind: "token",
    label: "ARB",
    headline: "Split Arbitrum (ARB) bills with your squad",
    subheadline: "Native token settlements for the Arbitrum community",
    intro:
      "Split expenses using Arbitrum's native governance token ARB. Perfect for DAO members, L2 enthusiasts, and groups active in the Arbitrum ecosystem.",
    benefits: [
      "Native ARB token bill splitting on Arbitrum One",
      "Ultra-low L2 transaction fees for instant settlements",
      "Custom share splits for equal or variable payment shares",
      "Complete transparency with on-chain verification",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Can I split ARB token payments on Arbitrum One?",
        answer:
          "Yes! Select Arbitrum network and ARB token when setting up your split event on CryptoSplitter.",
      },
      {
        question: "Why use ARB for splitting expenses?",
        answer:
          "ARB settlements take advantage of Arbitrum's low gas costs and fast finality, making small and large splits instant and inexpensive.",
      },
    ],
    relatedSlugs: ["arbitrum", "eth", "usdc", "ethereum"],
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
          "The splitting workflow is identical. Choose the stablecoin and network that your group prefers when connecting a wallet.",
      },
    ],
    relatedSlugs: ["usdc", "bnb", "polygon", "ethereum"],
  },

  base: {
    slug: "base",
    kind: "chain",
    label: "Base",
    headline: "Split crypto bills on Base network",
    subheadline: "Low-fee expense sharing on Coinbase's L2",
    intro:
      "Base offers fast, cheap transactions — perfect for splitting everyday expenses. Use CryptoSplitter to divide restaurant tabs, subscription costs, or group purchases and settle on Base in seconds.",
    benefits: [
      "Low gas fees compared to Ethereum mainnet",
      "Ideal for frequent small splits among friends",
      "Compatible with Coinbase Wallet, MetaMask, and Rainbow",
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
        answer: "Yes. Coinbase Wallet is fully supported alongside MetaMask, Rainbow, Rabby, and Zerion.",
      },
    ],
    relatedSlugs: ["ethereum", "usdc", "eth", "optimism"],
  },

  arbitrum: {
    slug: "arbitrum",
    kind: "chain",
    label: "Arbitrum",
    headline: "Split expenses on Arbitrum One",
    subheadline: "Fast L2 settlements for shared crypto costs",
    intro:
      "Arbitrum One combines Ethereum security with lower fees. CryptoSplitter lets your group split expenses and pay on Arbitrum without mainnet gas overhead.",
    benefits: [
      "Arbitrum One L2 support with low transaction costs",
      "Settle in ETH, USDC, USDT, or ARB on Arbitrum",
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
        question: "Can I split ARB and USDC on Arbitrum?",
        answer:
          "Yes. You can split native ETH, ARB governance tokens, or USDC stablecoins on Arbitrum.",
      },
    ],
    relatedSlugs: ["ethereum", "base", "arb", "eth", "usdc"],
  },

  ethereum: {
    slug: "ethereum",
    kind: "chain",
    label: "Ethereum",
    headline: "Split crypto expenses on Ethereum Mainnet",
    subheadline: "Mainnet expense sharing with full on-chain transparency",
    intro:
      "Split shared costs on Ethereum mainnet with CryptoSplitter. Create an event, invite participants, and let everyone settle their share with a direct wallet payment on the world's leading smart-contract network.",
    benefits: [
      "Native Ethereum mainnet support with MetaMask and major wallets",
      "Immutable on-chain record of every split and payment",
      "Support for ETH, LINK, and ERC-20 stablecoins like USDC and USDT",
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
    relatedSlugs: ["eth", "usdc", "base", "arbitrum", "link"],
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
          "You can settle splits using POL/MATIC, USDC, USDT, and other tokens supported on Polygon PoS.",
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
          "Both are L2s with low fees. Choose whichever network your group already uses — the CryptoSplitter workflow is identical.",
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

  "splitwise-crypto-alternative": {
    slug: "splitwise-crypto-alternative",
    kind: "usecase",
    label: "Crypto Splitwise Alternative",
    headline: "The Decentralized Splitwise Alternative for Web3",
    subheadline: "Split bills on-chain with zero subscription fees and instant wallet settlement",
    intro:
      "Tired of manual bank transfers, centralized fee limits, and IOUs? CryptoSplitter is the Web3 alternative to Splitwise. Create shared events, calculate custom shares, and let everyone settle directly from their Web3 wallet.",
    benefits: [
      "No custodial accounts, no central servers holding your money",
      "Pay directly with ETH, USDC, USDT, LINK, ARB, and more",
      "On-chain transparency — permanent verification of paid bills",
      "Works globally with zero border fees",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "How is CryptoSplitter better than traditional bill split apps?",
        answer:
          "Traditional apps require manual bank transfers or third-party payment processors. CryptoSplitter executes peer-to-peer wallet payments directly on smart contracts with zero middleman holding your funds.",
      },
      {
        question: "Do my friends need an account to use CryptoSplitter?",
        answer:
          "No! There are no signups or password forms. Users simply connect their Web3 wallet (MetaMask, Coinbase Wallet, Rainbow, etc.) and approve their share.",
      },
    ],
    relatedSlugs: ["eth", "usdc", "base", "arbitrum", "vacation", "roommates"],
  },

  vacation: {
    slug: "vacation",
    kind: "usecase",
    label: "Split Vacation Expenses",
    headline: "Split Group Trips & Travel Bills with Crypto",
    subheadline: "Hotels, flights, group dinners, and excursions — settled effortlessly on-chain",
    intro:
      "Planning a group holiday or ETH conference trip? CryptoSplitter helps traveling crews log expenses in any fiat currency and settle on-chain in USDC, ETH, or Layer-2 tokens.",
    benefits: [
      "Log expenses in USD, EUR, GBP, or 30+ fiat currencies while settling in crypto",
      "Avoid expensive international foreign exchange bank fees",
      "Custom split percentages for shared hotel rooms and rental cars",
      "Instant settlement on low-cost L2 networks like Base and Arbitrum",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Can we track expenses in EUR or USD and pay in USDC?",
        answer:
          "Yes! CryptoSplitter calculates foreign exchange rates so you can log bills in fiat currencies and convert to exact crypto amounts upon settlement.",
      },
    ],
    relatedSlugs: ["usdc", "eth", "base", "arbitrum", "splitwise-crypto-alternative"],
  },

  roommates: {
    slug: "roommates",
    kind: "usecase",
    label: "Split Roommate Bills",
    headline: "Split Rent, Utilities & Household Bills in Crypto",
    subheadline: "Automate shared apartment expenses with roommates without awkward conversations",
    intro:
      "Keep housemate expenses transparent and fair. CryptoSplitter makes it easy for roommates to divide monthly rent, internet bills, groceries, and utility costs with crypto settlements.",
    benefits: [
      "Monthly recurring ledger for housemates and roommates",
      "Clear breakdown of who owes what every month",
      "Stablecoin settlement in USDC/USDT to eliminate price fluctuations",
      "Immutable on-chain proof of rent payment",
    ],
    steps: sharedSteps,
    faqs: [
      {
        question: "Is stablecoin (USDC/USDT) best for roommate rent splits?",
        answer:
          "Yes! Using stablecoins ensures your rent share value stays fixed to USD/EUR without market fluctuations during payment.",
      },
    ],
    relatedSlugs: ["usdc", "usdt", "base", "ethereum", "splitwise-crypto-alternative"],
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

