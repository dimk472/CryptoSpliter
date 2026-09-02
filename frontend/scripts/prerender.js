import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const TEMPLATE_PATH = path.resolve(DIST_DIR, 'index.html');

const SITE_URL = 'https://cryptosplitter.app';
const SITE_NAME = 'CryptoSplitter';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const sharedSteps = [
  "Connect your Web3 wallet (MetaMask, Coinbase Wallet, Rainbow, Rabby, and more).",
  "Create a split event, add participants, and set each person's share.",
  "Everyone settles their portion with an on-chain payment — no middleman.",
];

const PAGES = [
  {
    path: '/',
    title: 'Split Crypto Expenses & Bills On-Chain | CryptoSplitter',
    description: 'Split crypto expenses & group bills with friends on Ethereum, Base, Polygon & 10+ chains. Create shared events and settle payments directly from your wallet.',
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          description: "Split crypto expenses & bills instantly with friends on multiple blockchains.",
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
          description: "The decentralized app to split crypto expenses, divide shared bills, and settle payments on-chain.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        },
      ],
    },
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | CryptoSplitter',
    description: 'Learn how CryptoSplitter collects, uses, and protects your data. We never store private keys and respect your privacy on our decentralized expense-splitting platform.',
  },
  {
    path: '/terms',
    title: 'Terms of Use | CryptoSplitter',
    description: 'Read the CryptoSplitter Terms of Use. Understand your responsibilities, platform limitations, and the risks of on-chain cryptocurrency transactions.',
  },
  {
    path: '/donate',
    title: 'Support CryptoSplitter | CryptoSplitter',
    description: 'Support the development of CryptoSplitter. Donate via PayPal or send BTC, ETH, USDT, USDC, BNB, or SOL to help keep the project running.',
  },
  {
    path: '/split-eth',
    title: 'Split ETH Bills with Friends | CryptoSplitter',
    description: 'Split ETH expenses with friends on-chain. Track who owes what and pay your share directly from MetaMask, Coinbase Wallet, or Rainbow.',
    label: 'ETH',
    faqs: [
      { question: "Can I split ETH on multiple chains?", answer: "Yes. CryptoSplitter supports Ethereum mainnet, Base, Arbitrum, Polygon, Optimism, and more." },
      { question: "Do I need to send ETH manually to each person?", answer: "Each participant pays their own share directly from their wallet." },
      { question: "What fees does CryptoSplitter charge for ETH splits?", answer: "CryptoSplitter charges a small 0.5% platform fee on settlements, plus standard network gas fees." },
    ],
  },
  {
    path: '/split-usdc',
    title: 'Split USDC Bills with Friends | CryptoSplitter',
    description: 'Split USDC expenses with friends on-chain. Track who owes what and pay your share directly from MetaMask, Coinbase Wallet, or Rainbow.',
    label: 'USDC',
    faqs: [
      { question: "Is USDC supported on Base and Arbitrum?", answer: "Yes. You can create and settle USDC splits on Base, Arbitrum, Ethereum, Polygon, Optimism, and other supported chains." },
      { question: "Can I split a bill unevenly in USDC?", answer: "Target custom amounts or percentages for each participant — you're never limited to equal splits." },
    ],
  },
  {
    path: '/split-link',
    title: 'Split LINK Bills with Friends | CryptoSplitter',
    description: 'Split Chainlink (LINK) expenses with friends on-chain. Track shared node costs and group bills directly from your Web3 wallet.',
    label: 'LINK',
    faqs: [
      { question: "Which networks support LINK splits?", answer: "You can split LINK on Ethereum mainnet, Arbitrum, Polygon, and any supported EVM chain." },
    ],
  },
  {
    path: '/split-arb',
    title: 'Split ARB Bills with Friends | CryptoSplitter',
    description: 'Split Arbitrum (ARB) expenses with friends on-chain. Fast, cheap L2 settlements for the Arbitrum community.',
    label: 'ARB',
    faqs: [
      { question: "Can I split ARB token payments on Arbitrum One?", answer: "Yes! Select Arbitrum network and ARB token when setting up your split event." },
    ],
  },
  {
    path: '/split-usdt',
    title: 'Split USDT Bills with Friends | CryptoSplitter',
    description: 'Split USDT expenses with friends on-chain. Tether settlements made simple and transparent on major EVM networks.',
    label: 'USDT',
    faqs: [
      { question: "Which chains support USDT splits?", answer: "USDT splits are available on Ethereum, BNB Chain, Polygon, Arbitrum, and other EVM chains." },
    ],
  },
  {
    path: '/split-base',
    title: 'Split Crypto Expenses on Base | CryptoSplitter',
    description: 'Split shared crypto expenses on Base. Create events, assign shares, and settle payments on-chain from your wallet. Fast, transparent, 0.5% fee.',
    label: 'Base',
    faqs: [
      { question: "Why split on Base instead of Ethereum mainnet?", answer: "Base typically has lower transaction fees, making it better for smaller or frequent splits among friends." },
    ],
  },
  {
    path: '/split-arbitrum',
    title: 'Split Crypto Expenses on Arbitrum | CryptoSplitter',
    description: 'Split shared crypto expenses on Arbitrum. Create events, assign shares, and settle payments on-chain from your wallet. Fast, transparent, 0.5% fee.',
    label: 'Arbitrum',
    faqs: [
      { question: "Is Arbitrum safe for splitting payments?", answer: "Arbitrum inherits Ethereum's security model. All settlements are standard on-chain transactions." },
    ],
  },
  {
    path: '/split-ethereum',
    title: 'Split Crypto Expenses on Ethereum | CryptoSplitter',
    description: 'Split shared crypto expenses on Ethereum Mainnet. Create events, assign shares, and settle payments on-chain with full transparency.',
    label: 'Ethereum',
    faqs: [
      { question: "Does CryptoSplitter work on Ethereum mainnet?", answer: "Yes. Connect your wallet, select Ethereum, create a split event, and participants pay on mainnet." },
    ],
  },
  {
    path: '/split-polygon',
    title: 'Split Crypto Expenses on Polygon | CryptoSplitter',
    description: 'Split shared crypto expenses on Polygon PoS with friends. Fast, transparent, ultra-low fee Web3 expense sharing directly from your wallet.',
    label: 'Polygon',
    faqs: [
      { question: "What tokens can I split on Polygon?", answer: "You can settle splits using POL/MATIC, USDC, USDT, and other supported tokens." },
    ],
  },
  {
    path: '/split-splitwise-crypto-alternative',
    title: 'Crypto Splitwise Alternative | CryptoSplitter',
    description: 'The Web3 alternative to Splitwise. Split bills on-chain with zero subscription fees and instant Web3 wallet settlement.',
    label: 'Crypto Splitwise Alternative',
    faqs: [
      { question: "How is CryptoSplitter better than traditional bill split apps?", answer: "CryptoSplitter executes peer-to-peer wallet payments directly on smart contracts with zero middleman holding your funds." },
    ],
  },
  {
    path: '/split-vacation',
    title: 'Split Vacation & Trip Expenses with Crypto | CryptoSplitter',
    description: 'Hotels, flights, group dinners, and excursions — split group travel expenses effortlessly on-chain with CryptoSplitter.',
    label: 'Split Vacation Expenses',
    faqs: [
      { question: "Can we track expenses in EUR or USD and pay in USDC?", answer: "Yes! CryptoSplitter calculates foreign exchange rates so you can log bills in fiat currencies and convert to exact crypto amounts upon settlement." },
    ],
  },
  {
    path: '/split-roommates',
    title: 'Split Roommate Rent & House Bills with Crypto | CryptoSplitter',
    description: 'Automate shared apartment expenses with roommates without awkward conversations using stablecoin payments.',
    label: 'Split Roommate Bills',
    faqs: [
      { question: "Is stablecoin (USDC/USDT) best for roommate rent splits?", answer: "Yes! Using stablecoins ensures your rent share value stays fixed to USD/EUR without market fluctuations during payment." },
    ],
  },
  {
    path: '/split-optimism',
    title: 'Split Crypto Expenses on Optimism | CryptoSplitter',
    description: 'Split shared crypto expenses on Optimism OP Mainnet. Low-cost L2 bill splitting for Web3 teams and friends.',
    label: 'Optimism',
    faqs: [
      { question: "Can I split ETH or stablecoins on Optimism?", answer: "Yes! Select Optimism network and choose ETH, USDC, or USDT to settle your split event." },
    ],
  },
  {
    path: '/split-avalanche',
    title: 'Split Crypto Expenses on Avalanche | CryptoSplitter',
    description: 'Split shared crypto expenses on Avalanche C-Chain. Fast finality and low-cost Web3 settlements for group expenses directly from your wallet.',
    label: 'Avalanche',
    faqs: [
      { question: "What tokens are supported on Avalanche?", answer: "Settle splits in AVAX, USDC, USDT, and popular Avalanche C-Chain tokens." },
    ],
  },
  {
    path: '/split-bnb',
    title: 'Split Crypto Expenses on BNB Chain | CryptoSplitter',
    description: 'Split shared crypto expenses on BNB Chain (BSC). Low gas fee crypto expense splitting for the BNB community directly from your wallet.',
    label: 'BNB Chain',
    faqs: [
      { question: "Is BNB supported for bill splitting?", answer: "Yes! Create events and settle debts directly in BNB or BEP-20 stablecoins on BNB Chain." },
    ],
  },
  {
    path: '/split-linea',
    title: 'Split Crypto Expenses on Linea | CryptoSplitter',
    description: 'Split shared crypto expenses on Linea zkEVM. Experience zero-knowledge rollup speed for group settlements.',
    label: 'Linea',
    faqs: [
      { question: "Why split payments on Linea?", answer: "Linea offers zkEVM security with low gas costs, ideal for splitting everyday group costs." },
    ],
  },
  {
    path: '/split-scroll',
    title: 'Split Crypto Expenses on Scroll | CryptoSplitter',
    description: 'Split shared crypto expenses on Scroll zkEVM. Native Ethereum-equivalent ZK-rollup bill splitting.',
    label: 'Scroll',
    faqs: [
      { question: "How does splitting work on Scroll?", answer: "Connect your Web3 wallet, select Scroll network, create a split event, and settle debts on Scroll zkEVM." },
    ],
  },
];

function generateFallbackBodyContent(page) {
  const h1Text = page.title.split('|')[0].trim();
  const labelText = page.label || 'Crypto Expenses';
  
  const navLinks = PAGES.map(p => `<li><a href="${p.path}">${p.label || 'Home'}</a></li>`).join('\n          ');

  return `<div id="root">
    <div id="seo-fallback-content" style="display:none;">
      <header>
        <nav>
          <a href="/"><strong>CryptoSplitter</strong></a>
        </nav>
      </header>
      <main>
        <article>
          <h1>${h1Text}</h1>
          <p>${page.description}</p>

          <section>
            <h2>Split ${labelText} Easily with Web3 Wallets</h2>
            <p>CryptoSplitter provides a seamless, non-custodial way to split group bills, shared travel expenses, roommate rent, and team costs directly on multiple blockchain networks. With built-in smart contract settlement, participants pay their exact portion using MetaMask, Coinbase Wallet, Rainbow, or any EVM wallet.</p>
            <p>Eliminate manual debt tracking and centralized bank transfers. CryptoSplitter calculates precise shares, converts currencies if needed, and executes transparent on-chain payments across Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, BNB Chain, Linea, and Scroll.</p>
          </section>

          ${page.faqs && page.faqs.length > 0 ? `
          <section>
            <h2>Frequently Asked Questions</h2>
            ${page.faqs.map(faq => `
            <div>
              <h3>${faq.question}</h3>
              <p>${faq.answer}</p>
            </div>`).join('')}
          </section>` : ''}

          <section>
            <h2>Supported Token and Network Split Guides</h2>
            <ul>
              ${navLinks}
            </ul>
          </section>
        </article>
      </main>
      <footer>
        <nav>
          <p>
            <a href="/privacy">Privacy Policy</a> | 
            <a href="/terms">Terms of Use</a> | 
            <a href="/donate">Donate</a> | 
            <a href="/CookiePolicy/cookiePolicy.html">Cookie Policy</a> | 
            <a href="/GDPRCompliance/gdpr.html">GDPR Compliance</a> | 
            <a href="/SiteMap/siteMap.html">Sitemap</a>
          </p>
        </nav>
      </footer>
    </div>
  </div>`;
}

function prerender() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('Error: dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  console.log('🚀 Starting static HTML route prerendering...');

  for (const page of PAGES) {
    const fullUrl = `${SITE_URL}${page.path}`;
    let html = templateHtml;

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/s, `<title>${page.title}</title>`);

    // Replace or insert Meta Description
    if (html.includes('name="description"')) {
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/s, `<meta name="description" content="${page.description}" />`);
    } else {
      html = html.replace('</head>', `  <meta name="description" content="${page.description}" />\n</head>`);
    }

    // Replace Canonical Link
    if (html.includes('rel="canonical"')) {
      html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/s, `<link rel="canonical" href="${fullUrl}" />`);
    } else {
      html = html.replace('</head>', `  <link rel="canonical" href="${fullUrl}" />\n</head>`);
    }

    // Replace OpenGraph meta
    html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/s, `<meta property="og:url" content="${fullUrl}" />`);
    html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/s, `<meta property="og:title" content="${page.title}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/s, `<meta property="og:description" content="${page.description}" />`);

    // Replace Twitter meta
    html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/s, `<meta name="twitter:title" content="${page.title}" />`);
    html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/s, `<meta name="twitter:description" content="${page.description}" />`);

    // Inject prerendered static body HTML into <div id="root"></div>
    const fallbackBody = generateFallbackBodyContent(page);
    html = html.replace('<div id="root"></div>', fallbackBody);

    // Ingest Graph JSON-LD Schema
    const jsonLdGraph = page.jsonLd || {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          name: page.title,
          url: fullUrl,
          description: page.description,
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        },
        ...(page.label ? [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: page.label, item: fullUrl },
            ],
          },
          {
            "@type": "HowTo",
            name: `How to split ${page.label} expenses with CryptoSplitter`,
            description: `Step-by-step guide to splitting ${page.label} expenses on-chain using your Web3 wallet.`,
            step: sharedSteps.map((stepText, idx) => ({
              "@type": "HowToStep",
              position: idx + 1,
              name: `Step ${idx + 1}`,
              text: stepText,
            })),
          },
        ] : []),
        ...(page.faqs ? [
          {
            "@type": "FAQPage",
            mainEntity: page.faqs.map(faq => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          },
        ] : []),
      ],
    };

    const scriptTag = `<script id="seo-json-ld" type="application/ld+json">${JSON.stringify(jsonLdGraph, null, 2)}</script>`;

    if (html.includes('type="application/ld+json"')) {
      html = html.replace(/<script\s+type="application\/ld\+json">.*?<\/script>/s, scriptTag);
    } else {
      html = html.replace('</head>', `  ${scriptTag}\n</head>`);
    }

    // Determine output file path
    if (page.path === '/') {
      fs.writeFileSync(TEMPLATE_PATH, html, 'utf-8');
      console.log(`  ✓ Rendered static root: index.html`);
    } else {
      const pageDir = path.join(DIST_DIR, page.path.slice(1));
      fs.mkdirSync(pageDir, { recursive: true });
      fs.writeFileSync(path.join(pageDir, 'index.html'), html, 'utf-8');
      console.log(`  ✓ Rendered static route: ${page.path}/index.html`);
    }
  }

  console.log('✅ All routes successfully pre-rendered!');
}

prerender();
