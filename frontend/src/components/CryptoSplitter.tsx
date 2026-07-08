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
import React, { useState, useEffect, useRef } from 'react';
import TermsOfUse from './TermsOfUse.tsx';
import PrivacyPolicy from './PrivacyPolicy.tsx';
import DonateSection from "./DonateSection.tsx";
import { shortenAddress } from "thirdweb/utils";
import { ethers } from "ethers";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/logo.png';
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

const COLORS = ['#baf24a', '#013330', '#d8ff7a', '#1d2127', '#95a09a', '#8fb92f'];
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

async function currencyToUsd(amount: number, currency: string): Promise<number> {
    if (currency === 'USD') {
        return amount;
    }

    const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(currency)}`);

    if (!response.ok) {
        return 0;
    }

    const data = await response.json();
    const usdRate = data?.rates?.USD;

    if (typeof usdRate !== 'number' || !Number.isFinite(usdRate) || usdRate <= 0) {
        return 0;
    }

    return amount * usdRate;
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
    const [isUsdLoading, setIsUsdLoading] = useState(false);
    const [category, setCategory] = useState('');
    const [currency, setCurrency] = useState('');
    const [myAddress, setMyAddress] = useState('');
    const [participantCount, setParticipantCount] = useState(3);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [blockNumber, setBlockNumber] = useState<number | null>(null);
    const [txHash, setTxHash] = useState<string>('');
    const [isConfirming, setIsConfirming] = useState(false);

    // Custom per-participant amounts, keyed by participant id (0..participantCount-1).
    // Defaults to an equal split of the total amount; can be adjusted manually in Step 3
    // via a number input and a percentage slider, kept in sync with each other.
    const [customAmounts, setCustomAmounts] = useState<Record<number, number>>({});

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
        let cancelled = false;

        async function loadUsdAmount() {
            if (!totalAmount || !currency) {
                setTotalAmountInUsd(0);
                setIsUsdLoading(false);
                return;
            }

            setIsUsdLoading(true);

            try {
                const usd = await currencyToUsd(parseFloat(totalAmount), currency);

                if (!cancelled) {
                    setTotalAmountInUsd(Number.isFinite(usd) ? usd : 0);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Failed to convert currency to USD:", error);
                    setTotalAmountInUsd(0);
                }
            } finally {
                if (!cancelled) {
                    setIsUsdLoading(false);
                }
            }
        }

        loadUsdAmount();

        return () => {
            cancelled = true;
        };

    }, [totalAmount, currency]);

    useEffect(() => {
        if (!totalAmount || !currency) {
            setTotalAmountInUsd(0);
            return;
        }
    }, [totalAmount, currency]);

    useEffect(() => {
        setParticipants(prev => {
            const updated: Participant[] = [];
            for (let i = 0; i < participantCount; i++) {
                const defaultAddress = i === 0 ? (prev[i]?.address || walletAddress) : (prev[i]?.address || '');

                updated.push({
                    id: i,
                    name: prev[i]?.name ?? '',
                    address: defaultAddress,
                    isYou: i === 0,
                });
            }
            return updated;
        });
    }, [participantCount, walletAddress]);

    useEffect(() => {
        const currentAmt = parseFloat(totalAmount) || 0;
        const equalShare = participantCount > 0 ? currentAmt / participantCount : 0;

        setCustomAmounts(() => {
            const next: Record<number, number> = {};
            for (let i = 0; i < participantCount; i++) {
                next[i] = equalShare;
            }
            return next;
        });
    }, [participantCount, totalAmount]);

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

    const updateParticipantAmount = (id: number, rawAmount: number) => {
        if (amt <= 0 || Number.isNaN(rawAmount)) return;

        const clamped = Math.max(0, Math.min(rawAmount, amt));

        setCustomAmounts(prev => {
            const otherIds = Object.keys(prev)
                .map(Number)
                .filter(pid => pid !== id);

            const prevTotalOthers = otherIds.reduce((sum, pid) => sum + (prev[pid] || 0), 0);
            const remaining = Math.max(0, amt - clamped);

            const next: Record<number, number> = { ...prev, [id]: clamped };

            if (otherIds.length === 0) {
                return next;
            }

            if (prevTotalOthers > 0) {
                let distributed = 0;
                otherIds.forEach((pid, idx) => {
                    let value: number;
                    if (idx === otherIds.length - 1) {
                        value = remaining - distributed;
                    } else {
                        const share = (prev[pid] || 0) / prevTotalOthers;
                        value = Math.round(remaining * share * 100) / 100;
                        distributed += value;
                    }
                    next[pid] = Math.max(0, value);
                });
            } else {
                const equalShare = remaining / otherIds.length;
                otherIds.forEach(pid => {
                    next[pid] = equalShare;
                });
            }

            return next;
        });
    };

    const updateParticipantPercent = (id: number, percent: number) => {
        if (Number.isNaN(percent)) return;
        const clampedPercent = Math.max(0, Math.min(100, percent));
        updateParticipantAmount(id, (amt * clampedPercent) / 100);
    };

    const getParticipantPercent = (id: number): number => {
        if (amt <= 0) return 0;
        return ((customAmounts[id] ?? 0) / amt) * 100;
    };

    const totalAllocated = Object.values(customAmounts).reduce((sum, v) => sum + v, 0);

    const resetSplitToEqual = () => {
        const equalShare = participantCount > 0 ? amt / participantCount : 0;
        setCustomAmounts(() => {
            const next: Record<number, number> = {};
            for (let i = 0; i < participantCount; i++) {
                next[i] = equalShare;
            }
            return next;
        });
    };

    const confirmEvent = async () => {
        try {
            setIsConfirming(true);

            if (!liveAccount) throw new Error('Wallet not connected.');
            if (!activeChain) throw new Error('No network selected.');

            const splitPayload = participants.map(p => ({
                id: p.id,
                name: p.name,
                address: p.address,
                amount: Number(customAmounts[p.id] ?? 0),
            }));

            const splitTotal = splitPayload.reduce((sum, p) => sum + p.amount, 0);
            if (Math.abs(splitTotal - amt) > 0.01) {
                throw new Error(
                    `Split amounts (${splitTotal.toFixed(2)}) must equal the total (${amt.toFixed(2)} ${currency}).`,
                );
            }

            const creatorAddress = walletAddress || myAddress;

            const eventData = `${eventName}-${creatorAddress}-${Date.now()}`;
            const rawHash = ethers.keccak256(ethers.toUtf8Bytes(eventData));
            const offChainId = ('0x' + rawHash.slice(2).padStart(64, '0')) as `0x${string}`;

            const usdAmount = await currencyToUsd(parseFloat(totalAmount) || 0, currency);

            if (currency !== 'USD' && usdAmount <= 0) {
                throw new Error('Exchange rate is unavailable. Please try again in a moment.');
            }

            setTotalAmountInUsd(usdAmount);

            const usdString = usdAmount.toFixed(18);
            const totalAmountToUsd = parseEther(usdString);

            // The contract stores shares in USD, so convert each custom split to USD
            // and make the final entry absorb any rounding remainder.
            const allAddresses = participants.map(p => p.address as `0x${string}`);
            const totalSplit = splitPayload.reduce((sum, p) => sum + p.amount, 0);
            if (totalSplit <= 0) {
                throw new Error('Split amounts must be greater than zero.');
            }

            const usdScale = 1_000_000_000_000n;
            let distributedUsd = 0n;
            const allAmounts = splitPayload.map((participant, index) => {
                if (index === splitPayload.length - 1) {
                    return totalAmountToUsd - distributedUsd;
                }

                const ratioScaled = BigInt(Math.round((participant.amount / totalSplit) * Number(usdScale)));
                const shareUsd = (totalAmountToUsd * ratioScaled) / usdScale;
                distributedUsd += shareUsd;
                return shareUsd;
            });

            const tx = prepareContractCall({
                contract: getEventContract(activeChain),
                method: "createEvent",
                // ✅ Περνάμε τα σωστά arrays (allAddresses, allAmounts) που περιέχουν και τον Owner
                params: [offChainId, totalAmountToUsd, allAddresses, allAmounts],
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
                    participants: splitPayload.map(({ name, address, amount }) => ({
                        name,
                        address,
                        amount,
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
                                            disabled={participant.isYou}
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
                                    ['Each owes (default)', `${eachOwes} ${currency}`, 'blue'],
                                    [
                                        'Total in USD',
                                        isUsdLoading
                                            ? 'Loading conversion...'
                                            : `$${totalAmountInUsd.toFixed(2)}`,
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
                                <div className="split-preview-header">
                                    <p className="split-preview-title">Split breakdown</p>
                                    <button
                                        type="button"
                                        className="split-reset-btn"
                                        onClick={resetSplitToEqual}
                                    >
                                        Reset to equal split
                                    </button>
                                </div>
                                <p className="split-hint">
                                    Defaults to an equal split. Drag a slider or type an amount to customize —
                                    the rest adjust automatically so the total always matches the amount above.
                                </p>

                                {participants.map((participant, idx) => {
                                    const share = customAmounts[participant.id] ?? 0;
                                    const percent = getParticipantPercent(participant.id);
                                    const label = participant.name || `Person ${idx + 1}`;

                                    return (
                                        <div key={participant.id} className="sp-row sp-row--adjustable">
                                            <span className="sp-name">{label}</span>
                                            <div className="sp-bar-wrap">
                                                <div className="sp-bar" style={{ width: `${percent}%` }} />
                                            </div>
                                            <span className="sp-amt">{share.toFixed(2)} {currency}</span>

                                            <div className="sp-controls">
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    step={0.1}
                                                    value={percent}
                                                    onChange={(e) => updateParticipantPercent(participant.id, parseFloat(e.target.value))}
                                                    aria-label={`${label} share percentage`}
                                                    className="sp-slider"
                                                />
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={amt}
                                                    step="0.01"
                                                    value={makeFinite(share)}
                                                    onChange={(e) => updateParticipantAmount(participant.id, parseFloat(e.target.value))}
                                                    aria-label={`${label} amount`}
                                                    className="sp-amt-input"
                                                />
                                                <span className="sp-percent">{percent.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="split-total-row">
                                    <span className="split-total-label">Total allocated</span>
                                    <span
                                        className={`split-total-value${Math.abs(totalAllocated - amt) > 0.01 ? ' split-total-warning' : ''}`}
                                    >
                                        {totalAllocated.toFixed(2)} / {amt.toFixed(2)} {currency}
                                    </span>
                                </div>
                            </div>

                            <div className="divider" />
                            <p style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: '1.6' }}>
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
                                            style={{ fontSize: '11px', color: 'var(--brand)', textDecoration: 'underline' }}
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

function makeFinite(val: number): number {
    return Number.isFinite(val) ? Number(val.toFixed(2)) : 0;
}

function CryptoSpliter() {
    const account = useActiveAccount();
    const [stableWalletAddress, setStableWalletAddress] = useState('');
    const [showLoading, setShowLoading] = useState(true);
    const [activeLegalPage, setActiveLegalPage] = useState<'privacy' | 'terms' | 'donate' | null>(null);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (account?.address) {
            setStableWalletAddress(account.address);
            return;
        }
        const timeoutId = window.setTimeout(() => setStableWalletAddress(''), 5000);
        return () => window.clearTimeout(timeoutId);
    }, [account?.address]);

    // Close the mobile menu when the viewport grows past the mobile
    // breakpoint, and on outside clicks / Escape while it's open.
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 768px)');
        const handleChange = () => setIsMobileNavOpen(false);
        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        if (!isMobileNavOpen) return;

        const handleOutsideClick = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setIsMobileNavOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsMobileNavOpen(false);
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMobileNavOpen]);

    const activeAddress = account?.address ?? stableWalletAddress;

    const handleLoadingComplete = () => {
        setShowLoading(false);
    };

    const toggleMobileNav = () => setIsMobileNavOpen(prev => !prev);
    const closeMobileNav = () => setIsMobileNavOpen(false);

    const openPrivacyPolicy = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setActiveLegalPage('privacy');
    };

    const openTermsOfUse = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setActiveLegalPage('terms');
    };

    const openDonateSection = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        setActiveLegalPage('donate');
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

    if (activeLegalPage === 'donate') {
        return (
            <DonateSection />
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
                            <img src={logo} alt="CryptoSpliter Logo" />
                        </a>

                        <nav className="nav" id="nav" ref={navRef}>
                            <button
                                type="button"
                                className={`nav-toggle${isMobileNavOpen ? ' is-open' : ''}`}
                                aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={isMobileNavOpen}
                                aria-controls="nav-list"
                                onClick={toggleMobileNav}
                            >
                                <span className="nav-toggle-bar" />
                            </button>

                            <ul
                                className={`nav-list${isMobileNavOpen ? ' nav-list--open' : ''}`}
                                id="nav-list"
                            >
                                <li><a href="#hero" className="nav-link" onClick={closeMobileNav}>Dashboard</a></li>
                                <li><a href="#my-events" className="nav-link" onClick={closeMobileNav}>My Events</a></li>
                                <li className="nav-connect-item">
                                    <ConnectButton
                                        client={client}
                                        chains={SUPPORTED_CHAINS}
                                        connectButton={{ label: "Connect Wallet", className: "custom-connect-btn" }}
                                        detailsButton={{ render: () => <WalletDetails /> }}
                                        connectModal={{ showThirdwebBranding: false, size: "compact" }}
                                        wallets={wallets}
                                    />
                                </li>
                            </ul>
                        </nav>

                        <div className="header-connect-desktop">
                            <ConnectButton
                                client={client}
                                chains={SUPPORTED_CHAINS}
                                connectButton={{ label: "Connect Wallet", className: "custom-connect-btn" }}
                                detailsButton={{ render: () => <WalletDetails /> }}
                                connectModal={{ showThirdwebBranding: false, size: "compact" }}
                                wallets={wallets}
                            />
                        </div>
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
                                    Sepolia testnet · Fully on-chain
                                </div>

                                <h1 className="hero-title">
                                    Split it exactly.<br />
                                    <em>Settle</em> it on-chain.
                                </h1>

                                <p className="hero-desc">
                                    Create an expense, invite wallets, and choose equal or custom splits. Every payment goes directly between wallets, secured by smart contracts.
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

                                <div className="wallet-trust">
                                    <div className="wallet-trust-avatars">
                                        <div className="avatar av1">M</div>
                                        <div className="avatar av2">C</div>
                                        <div className="avatar av3">R</div>
                                        <div className="avatar av4">R</div>
                                        <div className="avatar av5">Z</div>
                                    </div>
                                    <span className="wallet-trust-label">Works with the wallet you already use</span>
                                </div>

                                <div className="stats-row">
                                    <div className="stat">
                                        <span className="stat-value">2–10</span>
                                        <span className="stat-label">people per split</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">35+</span>
                                        <span className="stat-label">currencies supported</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">ETH · LINK</span>
                                        <span className="stat-label">accepted on Sepolia</span>
                                    </div>
                                </div>
                            </div>

                            <div className="hero-right">
                                <div className="ledger-stack">
                                    <div className="ledger-back" />
                                    <div className="ledger-card">
                                        <div className="ledger-head">
                                            <span className="ledger-tag">Custom split</span>
                                            <span className="ledger-chain">Sepolia</span>
                                        </div>

                                        <div className="ledger-title">Dinner in Lisbon</div>
                                        <div className="ledger-total">
                                            €7.00 <span className="ledger-total-usd">≈ $7.58</span>
                                        </div>

                                        <div className="ledger-split-toggle">
                                            <span className="split-toggle-pill split-toggle-pill--active">Custom</span>
                                            <span className="split-toggle-pill">Equal</span>
                                        </div>

                                        <div className="ledger-rows">
                                            <div className="ledger-row">
                                                <div className="avatar av1">A</div>
                                                <span className="ledger-name">Alex</span>
                                                <div className="ledger-bar-wrap">
                                                    <div className="ledger-bar" style={{ width: '29%' }} />
                                                </div>
                                                <span className="ledger-amt">€2.00</span>
                                            </div>
                                            <div className="ledger-row">
                                                <div className="avatar av2">M</div>
                                                <span className="ledger-name">Mira</span>
                                                <div className="ledger-bar-wrap">
                                                    <div className="ledger-bar" style={{ width: '71%' }} />
                                                </div>
                                                <span className="ledger-amt">€5.00</span>
                                            </div>
                                        </div>

                                        <div className="ledger-footer">
                                            <span className="on-chain-dot" />
                                            Settled via LINK · block #8,241,033
                                        </div>
                                    </div>

                                    <div className="float-badge float-badge-1">
                                        <div className="float-icon fi-green">✓</div>
                                        <div className="float-text">
                                            <div className="float-top">Non-custodial</div>
                                            <div className="float-sub">funds never touch us</div>
                                        </div>
                                    </div>
                                    <div className="float-badge float-badge-2">
                                        <div className="float-icon fi-blue">⬡</div>
                                        <div className="float-text">
                                            <div className="float-top">Trustless split</div>
                                            <div className="float-sub">enforced by contract</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* ==================== SECTION: HOW IT WORKS ==================== */}
                <section className="how-it-works" id="how-it-works">
                    <div className="hiw-container">
                        <p className="hiw-label">How it Works</p>
                        <h2 className="hiw-heading">Split expenses in 3 simple steps</h2>

                        <div className="hiw-grid">
                            <div className="hiw-card">
                                <div className="hiw-step-num">01</div>
                                <h3 className="hiw-card-title">Create an Event</h3>
                                <p className="hiw-card-desc">
                                    Connect your wallet, give your expense a name (e.g., Dinner in Lisbon), select the currency, and enter the total amount paid.
                                </p>
                            </div>

                            <div className="hiw-card">
                                <div className="hiw-step-num">02</div>
                                <h3 className="hiw-card-title">Add Friends & Split</h3>
                                <p className="hiw-card-desc">
                                    Set the number of participants and input their wallet addresses. Choose an Equal split or customize everyone's share using the sliders.
                                </p>
                            </div>

                            <div className="hiw-card">
                                <div className="hiw-step-num">03</div>
                                <h3 className="hiw-card-title">Confirm On-Chain</h3>
                                <p className="hiw-card-desc">
                                    Sign the transaction. Your expense is logged trustlessly on the smart contract, allowing friends to settle up directly to your wallet.
                                </p>
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
                                    <img src={logo} alt="CryptoSpliter Logo" />
                                </a>
                                <p className="footer-description">
                                    Split crypto expenses with your crew — zero fees, on-chain, instant.
                                    Create an event, add your friends, log what you paid, and let the protocol do the math.
                                </p>
                                <div className="footer-social">
                                    <a href="https://www.linkedin.com/in/dimitris-kazantzis-5b575936a/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                        <FontAwesomeIcon icon={faLinkedinIn} />
                                    </a>
                                </div>
                            </div>

                            <div className="footer-donate-wrapper">
                                <a
                                    onClick={openDonateSection}
                                    className="footer-donate-btn"
                                    aria-label="Support us"
                                >
                                    Donate
                                </a>
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
