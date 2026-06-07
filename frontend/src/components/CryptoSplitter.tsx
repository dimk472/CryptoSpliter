import {
    ConnectButton,
    useActiveWalletChain,
    useActiveAccount,
    AccountProvider,
    ChainProvider,
    WalletProvider,
    ChainIcon,
    WalletIcon,
    AccountBalance,
    useActiveWallet,
} from "thirdweb/react";
import { client } from "../ThirdwebClient.tsx";
import { createWallet } from "thirdweb/wallets";
import React, { useState, useEffect } from 'react';
import TermsOfUse from './TermsOfUse.tsx';
import PrivacyPolicy from './PrivacyPolicy.tsx';
import { shortenAddress } from "thirdweb/utils";
import { ethers } from "ethers";
import {
    ethereum,
    sepolia,
    polygon,
    arbitrum,
    optimism,
    base,
    avalanche,
    bsc,
    linea,
    scroll,
} from "thirdweb/chains";
import MyEvents from "./MyEventsTab.tsx";
import { prepareContractCall, sendTransaction, waitForReceipt } from "thirdweb";
import { getEventContract } from "../blokchain/contract.ts";
import '../components/styles/CryptoSpliter.css'
import '../components/styles/splitingApp.css'
import { parseEther } from "ethers"
import LoadingEffect from './loadingEffect/LoadingEffect.tsx';

const COLORS = ['#0ea5e9', '#0369a1', '#38bdf8', '#0c1825', '#3d5a74', '#22c55e'];
const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const SUPPORTED_CHAINS = [
    ethereum,
    sepolia,
    polygon,
    arbitrum,
    optimism,
    base,
    avalanche,
    bsc,
    linea,
    scroll,
];

const wallets = [
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
];

function currencyToUsd(
    amount: number,
    currency: string,
    rates: Record<string, number>
): number {

    if (currency === "USD") {
        return amount;
    }

    const rate = rates[currency];

    if (!rate) {
        return 0;
    }

    return amount / rate;
}

function getTxUrl(chain: any, txHash: string) {
    if (!txHash) return 'about:blank';
    const explorerBase =
        chain?.blockExplorers?.default?.url ||
        chain?.blockExplorers?.etherscan?.url ||
        chain?.explorers?.[0]?.url ||
        chain?.explorer?.url ||
        null;
    const fallback = `https://etherscan.io/tx/${txHash}`;
    if (!explorerBase) return fallback;
    return `${explorerBase.replace(/\/$/, '')}/tx/${txHash}`;
}

type Participant = {
    id: number;
    name: string;
    address: string;
    isYou: boolean;
};

type ParticipantField = 'name' | 'address';

function SplittingApp({ walletAddress }: { walletAddress: string }) {
    const liveAccount = useActiveAccount();
    const activeChain = useActiveWalletChain();

    const [currentStep, setCurrentStep] = useState(1);
    const [eventName, setEventName] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [totalAmountInUsd, setTotalAmountInUsd] = useState<number>(0);
    const [rates, setRates] = useState<Record<string, number>>({});
    const [category, setCategory] = useState('');
    const [currency, setCurrency] = useState('');
    const [myAddress, setMyAddress] = useState('');
    const [participantCount, setParticipantCount] = useState(3);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [blockNumber, setBlockNumber] = useState<number | null>(null);
    const [txHash, setTxHash] = useState<string>('');
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (!walletAddress) return;
        setMyAddress(prev => (prev.trim() ? prev : walletAddress));
        setParticipants(prev =>
            prev.map((p, i) =>
                i === 0
                    ? { ...p, address: p.address.trim() ? p.address : walletAddress, isYou: true }
                    : p,
            ),
        );
    }, [walletAddress]);

    useEffect(() => {
        async function loadRates() {
            try {
                const response = await fetch(
                    "https://open.er-api.com/v6/latest/USD"

                );

                const data = await response.json();

                setRates(data.rates);
            } catch (error) {
                console.error("Failed to load exchange rates:", error);
            }
        }

        loadRates();
    }, []);

    useEffect(() => {
        if (!totalAmount || !currency) {
            setTotalAmountInUsd(0);
            return;
        }

        try {
            const usd = currencyToUsd(
                parseFloat(totalAmount),
                currency,
                rates
            );

            setTotalAmountInUsd(usd);
        } catch (error) {
            console.error(error);
            setTotalAmountInUsd(0);
        }
    }, [totalAmount, currency, rates]);

    useEffect(() => {
        setParticipants(prev => {
            const updated: Participant[] = [];
            for (let i = 0; i < participantCount; i++) {
                updated.push({
                    id: i,
                    name: prev[i]?.name ?? '',
                    address: prev[i]?.address ?? '',
                    isYou: i === 0,
                });
            }
            return updated;
        });
    }, [participantCount]);

    if (!walletAddress) return null;

    const amt = parseFloat(totalAmount) || 0;
    const eachOwes = amt > 0 ? (amt / participantCount).toFixed(2) : '0.00';

    const goStep = (step: number) => setCurrentStep(step);

    const goStep2 = () => {
        if (!eventName.trim()) { alert('Please fill in event name.'); return; }
        if (!currency) { alert('Please select a currency.'); return; }
        if (!totalAmount || parseFloat(totalAmount) <= 0) { alert('Please enter a valid amount.'); return; }
        if (!myAddress.trim() || !myAddress.startsWith('0x')) { alert('Please enter a valid wallet address starting with 0x.'); return; }
        goStep(2);
    };

    const goStep3 = () => {
        for (let i = 0; i < participants.length; i++) {
            const p = participants[i];
            if (!p.name.trim()) { alert(`Please enter a name for ${p.isYou ? 'yourself' : `participant ${i + 1}`}.`); return; }
            if (!p.address.trim() || !p.address.startsWith('0x')) { alert(`Please enter a valid wallet address for ${p.name || `participant ${i + 1}`}.`); return; }
        }
        goStep(3);
    };

    const updateParticipant = (id: number, field: ParticipantField, value: string) => {
        setParticipants(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const changeCount = (delta: number) => {
        setParticipantCount(prev => Math.max(2, Math.min(10, prev + delta)));
    };

    const confirmEvent = async () => {
        try {
            setIsConfirming(true);

            if (!liveAccount) throw new Error('Wallet not connected.');
            if (!activeChain) throw new Error('No network selected.');

            const creatorAddress = walletAddress || myAddress;

            const eventData = `${eventName}-${creatorAddress}-${Date.now()}`;
            const rawHash = ethers.keccak256(ethers.toUtf8Bytes(eventData));
            const offChainId = ('0x' + rawHash.slice(2).padStart(64, '0')) as `0x${string}`;

            // Μετέτρεψε το usd σε string με ακριβώς 18 decimals
            const usdString = totalAmountInUsd.toFixed(18);
            const totalAmountToUsd = parseEther(usdString); // ethers parseEther = * 1e18, ασφαλές   

            const otherAddresses = participants
                .filter(p => !p.isYou)
                .map(p => p.address as `0x${string}`);

            const tx = prepareContractCall({
                contract: getEventContract(activeChain),
                method: "createEvent",
                params: [offChainId, totalAmountToUsd, otherAddresses],
            });

            const txResult = await sendTransaction({
                transaction: tx,
                account: liveAccount,
            });

            setTxHash(txResult.transactionHash);

            const receipt = await waitForReceipt({
                client,
                chain: activeChain,
                transactionHash: txResult.transactionHash,
            });

            setBlockNumber(Number(receipt.blockNumber));

            const response = await fetch(`${API_URL}/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: eventName,
                    total_amount: totalAmount,
                    category,
                    creator_wallet: creatorAddress,
                    chain_id: activeChain.id,
                    currency: currency,
                    tx_hash: txResult.transactionHash,
                    participants: participants.map(p => ({
                        name: p.name,
                        address: p.address,
                    })),
                    off_chain_id: offChainId,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            goStep(4);

        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create event");
        } finally {
            setIsConfirming(false);
        }
    };

    const resetAll = () => {
        setCurrentStep(1);
        setEventName('');
        setTotalAmount('');
        setCategory('');
        setMyAddress('');
        setParticipantCount(3);
        setBlockNumber(null);
        setTxHash('');
    };

    return (
        <div className="sa-wrap">
            <div className="sa-grid-bg" />
            <div className="sa-inner">
                <p className="sa-section-label">Expense Splitting</p>
                <h2 className="sa-heading">Create a splitting event</h2>
                <p className="sa-sub">Settle shared costs on-chain, no trust required.</p>

                <div className="sa-card">

                    {currentStep !== 4 && (
                        <div className="step-bar">
                            {[
                                { n: 1, label: 'Event details' },
                                { n: 2, label: 'Participants' },
                                { n: 3, label: 'Review & confirm' },
                            ].map(({ n, label }, i, arr) => (
                                <React.Fragment key={n}>
                                    <div className="step-item" style={n === 3 ? { flex: 0 } : {}}>
                                        <div className={`step-circle ${currentStep === n ? 'active' : currentStep > n ? 'done' : ''}`}>
                                            {currentStep > n ? '✓' : n}
                                        </div>
                                        <span className={`step-label ${currentStep >= n ? 'active' : ''}`}>{label}</span>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className={`step-line ${currentStep > n ? 'done' : ''}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div>
                            <div className="field-group">
                                <label className="field-label">Event name</label>
                                <input
                                    className="field-input"
                                    type="text"
                                    placeholder="e.g. Lisbon trip · June 2025"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                />
                            </div>
                            <div className="field-group">
                                <label className="field-label">Select Currency</label>
                                <select
                                    className="field-input"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                >
                                    <option value="">Select currency</option>
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="JPY">JPY - Japanese Yen</option>
                                    <option value="CHF">CHF - Swiss Franc</option>
                                    <option value="CAD">CAD - Canadian Dollar</option>
                                    <option value="AUD">AUD - Australian Dollar</option>
                                    <option value="NZD">NZD - New Zealand Dollar</option>
                                    <option value="CNY">CNY - Chinese Yuan</option>
                                    <option value="HKD">HKD - Hong Kong Dollar</option>
                                    <option value="SGD">SGD - Singapore Dollar</option>
                                    <option value="SEK">SEK - Swedish Krona</option>
                                    <option value="NOK">NOK - Norwegian Krone</option>
                                    <option value="DKK">DKK - Danish Krone</option>
                                    <option value="PLN">PLN - Polish Zloty</option>
                                    <option value="CZK">CZK - Czech Koruna</option>
                                    <option value="HUF">HUF - Hungarian Forint</option>
                                    <option value="RON">RON - Romanian Leu</option>
                                    <option value="TRY">TRY - Turkish Lira</option>
                                    <option value="BGN">BGN - Bulgarian Lev</option>
                                    <option value="RSD">RSD - Serbian Dinar</option>
                                    <option value="UAH">UAH - Ukrainian Hryvnia</option>
                                    <option value="INR">INR - Indian Rupee</option>
                                    <option value="KRW">KRW - South Korean Won</option>
                                    <option value="THB">THB - Thai Baht</option>
                                    <option value="MYR">MYR - Malaysian Ringgit</option>
                                    <option value="IDR">IDR - Indonesian Rupiah</option>
                                    <option value="PHP">PHP - Philippine Peso</option>
                                    <option value="VND">VND - Vietnamese Dong</option>
                                    <option value="MXN">MXN - Mexican Peso</option>
                                    <option value="BRL">BRL - Brazilian Real</option>
                                    <option value="ARS">ARS - Argentine Peso</option>
                                    <option value="ZAR">ZAR - South African Rand</option>
                                    <option value="AED">AED - UAE Dirham</option>
                                    <option value="SAR">SAR - Saudi Riyal</option>
                                    <option value="EGP">EGP - Egyptian Pound</option>
                                </select>

                            </div>

                            <div className="field-row">
                                <div className="field-group">
                                    <label className="field-label">Total amount paid ({currency})</label>
                                    <input
                                        className="field-input"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder={`0.00 ${currency}`}
                                        value={totalAmount}
                                        onChange={(e) => setTotalAmount(e.target.value)}
                                    />
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Category</label>
                                    <select
                                        className="field-input"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="">Select category</option>
                                        <option>Accommodation</option>
                                        <option>Flights</option>
                                        <option>Food &amp; drinks</option>
                                        <option>Transport</option>
                                        <option>Activities</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="field-group">
                                <label className="field-label">Your wallet address (you paid)</label>
                                <input
                                    className="field-input"
                                    type="text"
                                    placeholder="0x..."
                                    value={myAddress}
                                    onChange={(e) => setMyAddress(e.target.value)}
                                />
                                <p className="field-hint">
                                    You'll be reimbursed by others on <strong>{activeChain?.name ?? 'the selected network'}</strong>.
                                </p>
                            </div>

                            <div className="btn-row">
                                <span />
                                <button className="btn-primary" onClick={goStep2}>Continue →</button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <div className="participant-count-row">
                                <button className="count-btn" onClick={() => changeCount(-1)}>−</button>
                                <span className="count-display">{participantCount}</span>
                                <button className="count-btn" onClick={() => changeCount(1)}>+</button>
                                <span className="count-label">participants total (including you)</span>
                            </div>

                            <div className="participant-list">
                                {participants.map((participant, idx) => (
                                    <div key={participant.id} className="participant-row">
                                        <div
                                            className="p-avatar"
                                            style={{ background: COLORS[idx % COLORS.length] }}
                                        >
                                            {participant.isYou ? 'ME' : String.fromCharCode(65 + idx)}
                                        </div>
                                        <input
                                            className="p-name-input"
                                            type="text"
                                            placeholder={participant.isYou ? 'Your name' : `Participant ${idx + 1} name`}
                                            value={participant.name}
                                            onChange={(e) => updateParticipant(participant.id, 'name', e.target.value)}
                                        />
                                        <div className="p-sep" />
                                        <input
                                            className="p-addr-input"
                                            type="text"
                                            placeholder={participant.isYou ? 'Your wallet address (0x...)' : 'Wallet address (0x...)'}
                                            value={participant.address}
                                            onChange={(e) => updateParticipant(participant.id, 'address', e.target.value)}
                                        />
                                        {participant.isYou && <span className="p-you-tag">You</span>}
                                    </div>
                                ))}
                            </div>

                            <p className="field-hint" style={{ marginTop: '12px' }}>
                                Each participant will owe an equal share. You can adjust after confirming.
                            </p>

                            <div className="btn-row">
                                <button className="btn-secondary" onClick={() => goStep(1)}>← Back</button>
                                <button className="btn-primary" onClick={goStep3}>Review split →</button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <div className="summary-card">
                                {[
                                    ['Event', eventName || '—'],
                                    ['Network', activeChain?.name ?? 'Unknown'],
                                    ['Category', category || 'Uncategorized'],
                                    ['Currency', currency || '—'],
                                    ['Total amount', `${amt} ${currency}`, 'blue'],
                                    ['Participants', `${participantCount} people`],
                                    ['Each owes', `${eachOwes} ${currency}`, 'blue'],
                                    [
                                        'Total in USD',
                                        Object.keys(rates).length
                                            ? `$${totalAmountInUsd.toFixed(2)}`
                                            : 'Loading rates...',
                                        'blue'
                                    ],
                                ].map(([label, value, accent]) => (
                                    <div className="summary-row" key={label as string}>
                                        <span className="summary-label">{label}</span>
                                        <span className={`summary-value${accent ? ' blue' : ''}`}>{value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="split-preview">
                                <p className="split-preview-title">Split breakdown</p>
                                {participants.map((participant, idx) => (
                                    <div key={participant.id} className="sp-row">
                                        <span className="sp-name">{participant.name || `Person ${idx + 1}`}</span>
                                        <div className="sp-bar-wrap">
                                            <div className="sp-bar" style={{ width: `${Math.round(100 / participantCount)}%` }} />
                                        </div>
                                        <span className="sp-amt">{eachOwes} {currency}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="divider" />
                            <p style={{ fontSize: '12px', color: '#3d5a74', lineHeight: '1.6' }}>
                                By confirming, the smart contract on <strong>{activeChain?.name}</strong> will register this event.
                                Each participant will receive a request to send their share directly to your wallet.
                            </p>

                            <div className="btn-row">
                                <button className="btn-secondary" onClick={() => goStep(2)} disabled={isConfirming}>← Back</button>
                                <button
                                    className="btn-primary"
                                    onClick={confirmEvent}
                                    disabled={isConfirming}
                                    style={{ opacity: isConfirming ? 0.7 : 1, cursor: isConfirming ? 'not-allowed' : 'pointer' }}
                                >
                                    {isConfirming ? '⏳ Confirming...' : 'Confirm on-chain ✓'}
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="success-wrap">
                            <div className="success-icon">✓</div>
                            <h3 className="success-title">Event created!</h3>
                            <p className="success-desc">
                                Your splitting event is live on <strong>{activeChain?.name}</strong>. Share your wallet address with participants
                                so they can settle their share.
                            </p>

                            <div className="success-detail">
                                {[
                                    ['Event', eventName],
                                    ['Network', activeChain?.name ?? 'Unknown'],
                                    ['Total', `${amt} ${currency}`, 'blue'],
                                    ['Per person', `${eachOwes} ${currency}`, 'blue'],
                                    ['Awaiting payments from', `${participantCount - 1} participants`],
                                ].map(([label, value, accent], i, arr) => (
                                    <div
                                        className="summary-row"
                                        key={label as string}
                                        style={i === arr.length - 1 ? { borderBottom: 'none' } : {}}
                                    >
                                        <span className="summary-label">{label}</span>
                                        <span className={`summary-value${accent ? ' blue' : ''}`}>{value}</span>
                                    </div>
                                ))}




                                <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                                    <span className="on-chain-tag">
                                        <span className="on-chain-dot2" />
                                        Confirmed on-chain · block #{blockNumber?.toLocaleString()}
                                    </span>
                                </div>

                                {txHash && (
                                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                                        <a
                                            href={getTxUrl(activeChain, txHash)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: '11px', color: '#0ea5e9', textDecoration: 'underline' }}
                                        >
                                            View on explorer ↗
                                        </a>
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn-secondary"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={resetAll}
                            >
                                + Create another event
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function CryptoSpliter() {
    const account = useActiveAccount();
    const [stableWalletAddress, setStableWalletAddress] = useState('');
    const [showLoading, setShowLoading] = useState(true);
    const [activeLegalPage, setActiveLegalPage] = useState<'privacy' | 'terms' | null>(null);

    useEffect(() => {
        if (account?.address) {
            setStableWalletAddress(account.address);
            return;
        }
        const timeoutId = window.setTimeout(() => setStableWalletAddress(''), 5000);
        return () => window.clearTimeout(timeoutId);
    }, [account?.address]);

    const activeAddress = account?.address ?? stableWalletAddress;

    const handleLoadingComplete = () => {
        setShowLoading(false);
    };

    const openPrivacyPolicy = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setActiveLegalPage('privacy');
    };

    const openTermsOfUse = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setActiveLegalPage('terms');
    };

    if (activeLegalPage === 'privacy') {
        return (
            <PrivacyPolicy />
        );
    }

    if (activeLegalPage === 'terms') {
        return (
            <TermsOfUse />
        );
    }
    function WalletDetails() {
        const account = useActiveAccount();
        const activeChain = useActiveWalletChain();
        const activeWallet = useActiveWallet();

        if (!account || !activeWallet) return null;

        return (
            <AccountProvider address={account.address} client={client}>
                <div className="custom-connect-btn custom-connected-btn">
                    <span className="wallet-dot" />

                    {activeChain && (
                        <ChainProvider chain={activeChain}>
                            <ChainIcon
                                client={client}
                                className="wallet-chain-icon"
                                loadingComponent={<span className="wallet-chain-icon-placeholder" />}
                            />
                        </ChainProvider>
                    )}
                    <WalletProvider id={activeWallet.id}>
                        <WalletIcon
                            className="wallet-chain-icon"
                            loadingComponent={<span className="wallet-chain-icon-placeholder" />}
                        />
                    </WalletProvider>
                    <span className="wallet-address">{shortenAddress(account.address)}</span>
                    <span className="wallet-divider" />
                    <AccountBalance
                        chain={activeChain}
                        className="balance"
                        loadingComponent={<span className="balance">Loading...</span>}
                    />
                </div>
            </AccountProvider>
        );
    }

    return (
        <>
            {showLoading && <LoadingEffect onAnimationComplete={handleLoadingComplete} />}

            <div style={{ opacity: showLoading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
                <header className="header" id="header">
                    <div className="header-container">
                        <a href="#home" className="logo">
                            <img src="../src/assets/logo.png" alt="CryptoSpliter Logo" />
                        </a>
                        <nav className="nav" id="nav">
                            <ul className="nav-list">
                                <li><a href="#hero" className="nav-link">Dashboard</a></li>
                                <li><a href="#my-events" className="nav-link">My Events</a></li>
                            </ul>
                        </nav>
                        <ConnectButton
                            client={client}
                            chains={SUPPORTED_CHAINS}
                            connectButton={{ label: "Connect Wallet", className: "custom-connect-btn" }}
                            detailsButton={{ render: () => <WalletDetails /> }}
                            connectModal={{ showThirdwebBranding: false, size: "compact" }}
                            wallets={wallets}
                        />
                    </div>
                </header>

                <section className="hero" id="home">
                    <div className="hero-wrap">
                        <div className="hero-bg" />
                        <div className="grid-lines" />

                        <div className="hero-inner">
                            <div className="hero-left">
                                <div className="badge">
                                    <span className="badge-dot" />
                                    On-chain · Trustless · Instant
                                </div>

                                <h1 className="hero-title">
                                    Split crypto<br />
                                    with <em>anyone</em>,<br />
                                    seamlessly.
                                </h1>

                                <p className="hero-desc">
                                    Transparent expense splitting built on-chain. No trust required —
                                    just connect your wallet and let the smart contract handle the rest.
                                </p>

                                <div className="hero-actions">
                                    <ConnectButton
                                        client={client}
                                        chains={SUPPORTED_CHAINS}
                                        connectButton={{ label: "Connect Wallet", className: "custom-connect-btn" }}
                                        detailsButton={{ render: () => <WalletDetails /> }}
                                        connectModal={{ showThirdwebBranding: false, size: "compact" }}
                                        wallets={wallets}
                                    />
                                </div>

                                <div className="stats-row">
                                    <div className="stat">
                                        <span className="stat-value">$2.4M+</span>
                                        <span className="stat-label">settled on-chain</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">12k</span>
                                        <span className="stat-label">active wallets</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">0 fees</span>
                                        <span className="stat-label">platform cost</span>
                                    </div>
                                </div>
                            </div>

                            <div className="hero-right">
                                <div className="card-stack">
                                    <div className="glass-card card-back2" />
                                    <div className="glass-card card-back1" />
                                    <div className="glass-card card-main">
                                        <div className="card-header">
                                            <div className="card-avatars">
                                                <div className="avatar av1">A</div>
                                                <div className="avatar av2">K</div>
                                                <div className="avatar av3">M</div>
                                            </div>
                                            <div className="card-label">Group expense</div>
                                        </div>
                                        <div className="card-amount">0.85 ETH</div>
                                        <div className="card-desc">Lisbon trip · Shared accommodation</div>
                                        <div className="card-splits">
                                            {[['Alex', '45%', '0.38 ETH'], ['Kim', '30%', '0.25 ETH'], ['Max', '25%', '0.22 ETH']].map(([name, w, a]) => (
                                                <div className="split-row" key={name}>
                                                    <span className="split-name">{name}</span>
                                                    <div className="split-bar-wrap">
                                                        <div className="split-bar" style={{ width: w }} />
                                                    </div>
                                                    <span className="split-amount">{a}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="card-footer">
                                            <span className="on-chain-dot" />
                                            Confirmed on-chain · block #19482301
                                        </div>
                                    </div>
                                    <div className="float-badge float-badge-1">
                                        <div className="float-icon fi-green">✓</div>
                                        <div className="float-text">
                                            <div className="float-top">Auto-settled</div>
                                            <div className="float-sub">2s ago · no gas</div>
                                        </div>
                                    </div>
                                    <div className="float-badge float-badge-2">
                                        <div className="float-icon fi-blue">⬡</div>
                                        <div className="float-text">
                                            <div className="float-top">Smart contract</div>
                                            <div className="float-sub">fully audited</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {!!activeAddress && <SplittingApp walletAddress={activeAddress} />}
                {!!activeAddress && <MyEvents walletAddress={activeAddress} />}

                <footer className="footer">
                    <div className="footer-container">
                        <div className="footer-main">
                            <div className="footer-col footer-col--brand">
                                <a href="#home" className="footer-logo">
                                    <img src="../src/assets/logo.png" alt="CryptoSpliter" loading="lazy" />
                                </a>
                                <p className="footer-description">
                                    Split crypto expenses with your crew — zero fees, on-chain, instant.
                                    Create an event, add your friends, log what you paid, and let the protocol do the math.
                                </p>
                                <div className="footer-social">
                                    <a href="https://www.facebook.com/BlueMedThessaloniki/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                        <i className="fab fa-facebook-f"></i>
                                    </a>
                                    <a href="https://www.instagram.com/bluemedthess" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                        <i className="fab fa-instagram"></i>
                                    </a>
                                    <a href="https://www.linkedin.com/company/bluemedgreece" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                        <i className="fab fa-linkedin-in"></i>
                                    </a>
                                </div>
                            </div>

                            <div className="footer-col">
                                <h4 className="footer-title">Explore</h4>
                                <ul className="footer-list">
                                    <li><a href="#home">Dashboard</a></li>
                                    <li><a href="#my-events">My Events</a></li>
                                </ul>
                            </div>

                            <div className="footer-col">
                                <h4 className="footer-title">Information</h4>
                                <ul className="footer-list">
                                    <li><a href="#" onClick={openPrivacyPolicy}>Privacy Policy</a></li>
                                    <li><a href="#" onClick={openTermsOfUse}>Terms of Use</a></li>
                                    <li><a href="CookiePolicy/cookiePolicy.html">Cookie Policy</a></li>
                                    <li><a href="GTPRComplience/gtpr.html">GDPR Compliance</a></li>
                                    <li><a href="SiteMap/siteMap.html">Sitemap</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="footer-bottom">
                            <div className="footer-bottom-left">
                                <span>© {new Date().getFullYear()} CryptoSplitter. All rights reserved.</span>
                            </div>
                            <div className="footer-bottom-right">
                                <a href="#" onClick={openPrivacyPolicy}>Privacy</a>
                                <span className="separator">•</span>
                                <a href="#" onClick={openTermsOfUse}>Terms</a>
                                <span className="separator">•</span>
                                <a href="CookiePolicy/cookiePolicy.html">Cookies</a>
                            </div>
                        </div>

                        <div className="footer-credits">
                            <p>
                                Designed & developed by{' '}
                                <a href="https://www.linkedin.com/in/dimitris-kazantzis-5b575936a/" target="_blank" rel="noopener noreferrer">
                                    Dimitrios Kazantzis
                                </a>{' '}
                                | email : dimitriskaza2007@gmail.com
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

export default CryptoSpliter;