import { useState } from "react";
import { Link } from "react-router-dom";
import SeoHead from "../components/seo/SeoHead";
import { DONATE_SEO } from "../seo/seoConfig.ts";
import "../components/styles/DonateSection.css";
import "../components/styles/Legal.css";

type DonateOption = {
    id: string;
    label: string;
    symbol: string;
    address: string;
    color: string;
};

const DONATE_OPTIONS: DonateOption[] = [
    {
        id: "btc",
        label: "Bitcoin",
        symbol: "BTC",
        address: "bc1q9n45lwyj0rz9kxk7n0zeqr2hf4hu056aznk8j2",
        color: "#f7931a",
    },
    {
        id: "eth",
        label: "Ethereum",
        symbol: "ETH",
        address: "0x19b2963c6a3a9e674390bab025a96b755137e774",
        color: "#627eea",
    },
    {
        id: "usdt",
        label: "Tether (USDT)",
        symbol: "USDT",
        address: "0x19b2963c6a3a9e674390bab025a96b755137e774",
        color: "#26a17b",
    },
    {
        id: "usdc",
        label: "USD Coin (USDC)",
        symbol: "USDC",
        address: "0x19b2963c6a3a9e674390bab025a96b755137e774",
        color: "#2775ca",
    },
    {
        id: "bnb",
        label: "BNB",
        symbol: "BNB",
        address: "0x19b2963c6a3a9e674390bab025a96b755137e774",
        color: "#f3ba2f",
    },
    {
        id: "sol",
        label: "Solana",
        symbol: "SOL",
        address: "GB2FU6f7rAfzbGiLBYrmfJRJkKxb9nnzVTQJej2PzSGf",
        color: "#14f195",
    },
];

const PAYPAL_LINK = "https://paypal.me/dimkaza";

function truncateAddress(address: string): string {
    if (address.length <= 14) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export default function DonateSection() {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = async (id: string, address: string) => {
        try {
            await navigator.clipboard.writeText(address);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    return (
        <>
            <SeoHead {...DONATE_SEO} />
            <div className="legal-wrap">
            <div className="legal-inner">
                <Link
                    className="legal-back-btn"
                    to="/"
                    aria-label="Go back"
                >
                    ← Back
                </Link>

                <div className="legal-header">
                    <div className="legal-tag">SUPPORT</div>
                    <h1 className="legal-title">Support us</h1>
                    <p className="legal-subtitle">
                        If you find this project useful, consider supporting its development.
                    </p>
                </div>

                <a
                    href={PAYPAL_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="donate-paypal-btn"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.66-.578c-.018.106-.037.213-.058.32-.69 3.535-3.046 6.45-7.864 6.45h-2.19a.642.642 0 0 0-.634.54l-1.078 6.84-.305 1.94a.36.36 0 0 0 .355.412h3.86a.873.873 0 0 0 .862-.736l.036-.187.71-4.493.045-.246a.873.873 0 0 1 .862-.737h.543c3.518 0 6.272-1.43 6.99-5.566.331-1.928.16-3.539-.474-4.86z" />
                    </svg>
                    Donate with PayPal
                </a>

                <p className="donate-crypto-label">Or donate crypto directly</p>

                <div className="donate-crypto-list">
                    {DONATE_OPTIONS.map((option) => (
                        <div className="donate-crypto-row" key={option.id}>
                            <span
                                className="donate-crypto-symbol"
                                style={{ color: option.color }}
                            >
                                {option.symbol}
                            </span>
                            <span className="donate-crypto-address" title={option.address}>
                                {truncateAddress(option.address)}
                            </span>
                            <button
                                type="button"
                                className="donate-copy-btn"
                                onClick={() => handleCopy(option.id, option.address)}
                                aria-label={`Copy ${option.label} address`}
                            >
                                {copiedId === option.id ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                )}
                                {copiedId === option.id ? "Copied" : "Copy"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </>
    );
}