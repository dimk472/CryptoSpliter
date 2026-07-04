import { useState, useEffect } from 'react';
import './styles/MyEventsTab.css';
import { prepareContractCall, sendTransaction, waitForReceipt, readContract } from "thirdweb";
import { useActiveWalletChain, useActiveAccount } from "thirdweb/react";
import { ethereum, sepolia, polygon, arbitrum, optimism, base, avalanche, bsc, linea, scroll } from "thirdweb/chains";
import { client } from "../ThirdwebClient";
import { getEventContract } from "../blokchain/contract";
import { Building2, Plane, UtensilsCrossed, Car, Zap, Package, Inbox, Search } from 'lucide-react';


// ─── Types ────────────────────────────────────────────────────────────────────

type EventParticipant = {
    name: string;
    address: string;
    amount?: number;
    paid: boolean;
    is_owner?: boolean;
};

type SplitEvent = {
    id: string;
    off_chain_id: string;
    title: string;
    category: string;
    total_amount: string;
    creator_wallet: string;
    created_at: string;
    chain_id?: number;
    currency?: string;
    role?: 'creator' | 'debtor';
    participants: EventParticipant[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────



const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Accommodation: <Building2 size={18} />,
    Flights: <Plane size={18} />,
    'Food & drinks': <UtensilsCrossed size={18} />,
    Transport: <Car size={18} />,
    Activities: <Zap size={18} />,
    Other: <Package size={18} />,
    Uncategorized: <Package size={18} />,
};

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

function shortenAddr(addr: string) {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getStatus(event: SplitEvent) {
    const debtors = event.participants.filter(p => !p.is_owner);
    if (debtors.length === 0) return 'settled';
    const unpaidDebtors = debtors.filter(p => !p.paid);
    if (unpaidDebtors.length === 0) return 'settled';
    if (unpaidDebtors.length < debtors.length) return 'partial';
    return 'pending';
}

// ─── EventCard ────────────────────────────────────────────────────────────────

function EventCard({
    event,
    onExpand,
    expanded,
    walletAddress,
    onPay,
    paying,
    currencySymbol,
}: {
    event: SplitEvent;
    onExpand: () => void;
    expanded: boolean;
    walletAddress: string;
    onPay: (eventId: string) => void;
    paying: boolean;
    currencySymbol: string | undefined;
}) {
    const amt = parseFloat(event.total_amount) || 0;
    const debtors = event.participants.filter(p => !p.is_owner);
    const perPerson = event.participants.length > 0 ? (amt / event.participants.length).toFixed(2) : '0.00';
    const status = getStatus(event);
    const paidCount = debtors.filter(p => p.paid).length;
    const icon = CATEGORY_ICONS[event.category] || '📦';
    const normalizedWallet = walletAddress.toLowerCase();

    const eventId = event.off_chain_id;

    return (
        <div className={`me-card ${expanded ? 'me-card--expanded' : ''}`}>
            <div className="me-card-header" onClick={onExpand}>
                <div className="me-card-left">
                    <div className="me-cat-icon">{icon}</div>
                    <div>
                        <p className="me-title">{event.title}</p>
                        <p className="me-meta">
                            {event.category || 'Uncategorized'} · {formatDate(event.created_at)}
                        </p>
                        <p className="me-meta">
                            {event.role === 'debtor' ? 'You owe payment' : 'You created this event'}
                        </p>
                    </div>
                </div>

                <div className="me-card-right">
                    <div className="me-amount-col">
                        <span className="me-amount">{amt} {event.currency}</span>
                        <span className="me-per">{perPerson} {event.currency} / person</span>
                    </div>
                    <span className={`me-badge me-badge--${status}`}>
                        {status === 'settled' ? '✓ Settled' : status === 'partial' ? '◑ Partial' : '○ Pending'}
                    </span>
                    <span className={`me-chevron ${expanded ? 'me-chevron--open' : ''}`}>›</span>
                </div>
            </div>

            {expanded && (
                <div className="me-card-body">
                    <div className="me-divider" />

                    <div className="me-progress-wrap">
                        <div className="me-progress-labels">
                            <span>{paidCount} of {debtors.length} debtors settled</span>
                            <span>
                                {debtors.length > 0 ? Math.round((paidCount / debtors.length) * 100) : 100}%
                            </span>
                        </div>
                        <div className="me-progress-track">
                            <div
                                className="me-progress-fill"
                                style={{
                                    width: `${debtors.length > 0 ? (paidCount / debtors.length) * 100 : 100}%`
                                }}
                            />
                        </div>
                    </div>

                    <div className="me-participants">
                        {event.participants.map((p, i) => (
                            <div key={i} className="me-participant-row">
                                <div
                                    className="me-p-avatar"
                                    style={{ background: i % 4 === 0 ? '#0ea5e9' : '#0369a1' }}
                                >
                                    {p.name ? p.name[0].toUpperCase() : '?'}
                                </div>

                                <div className="me-p-info">
                                    <span className="me-p-name">
                                        {p.name}{p.is_owner ? ' (owner)' : ''}
                                    </span>
                                    <span className="me-p-addr">{shortenAddr(p.address)}</span>
                                </div>

                                <span className="me-p-amt">
                                    {perPerson} {currencySymbol}
                                </span>

                                <span className={`me-p-status ${p.paid ? 'me-p-status--paid' : 'me-p-status--pending'}`}>
                                    {p.paid ? '✓ Paid' : 'Pending'}
                                </span>

                                {!p.paid && p.address.toLowerCase() === normalizedWallet && (
                                    <button
                                        className="me-copy-btn"
                                        onClick={() => onPay(eventId)}
                                        disabled={paying}
                                    >
                                        {paying ? 'Paying...' : 'Pay now'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="me-footer-info">
                        <span className="me-on-chain">
                            On-chain · creator {shortenAddr(event.creator_wallet)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

function MyEvents({ walletAddress }: { walletAddress: string }) {
    const [events, setEvents] = useState<SplitEvent[]>([]);
    const [loadedWalletAddress, setLoadedWalletAddress] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [payingEventId, setPayingEventId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'settled' | 'partial' | 'pending'>('all');

    const liveAccount = useActiveAccount();
    const activeChain = useActiveWalletChain();
    const loading = Boolean(walletAddress) && loadedWalletAddress !== walletAddress;

    useEffect(() => {
        if (!walletAddress) return;

        let cancelled = false;

        void fetch(`${API_URL}/events?wallet=${walletAddress}`)
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;

                if (Array.isArray(data)) {
                    setEvents(data);
                } else {
                    console.error('Backend response is not an array:', data);
                    setEvents([]);
                }
            })
            .catch(err => {
                if (cancelled) return;

                console.error('Fetch error:', err);
                setEvents([]);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadedWalletAddress(walletAddress);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [walletAddress]);

    // ── Derived stats ──────────────────────────────────────────────────────────
    const settledCount = events.filter(ev => getStatus(ev) === 'settled').length;
    const pendingCount = events.filter(ev => getStatus(ev) === 'pending').length;
    const partialCount = events.filter(ev => getStatus(ev) === 'partial').length;

    const filteredEvents = events.filter(ev => {
        if (filter === 'all') return true;
        return getStatus(ev) === filter;
    });

    // ── Payment handler ────────────────────────────────────────────────────────
    const markPaid = async (eventId: string) => {
        try {
            setPayingEventId(eventId);

            if (!liveAccount) throw new Error('Wallet not connected.');
            if (!activeChain) throw new Error('No network selected.');

            const event = events.find(e => e.off_chain_id === eventId);
            if (!event) throw new Error('Event not found');

            const paymentChain = SUPPORTED_CHAINS.find(chain => chain.id === event.chain_id) ?? activeChain;
            if (!paymentChain) throw new Error('This event chain is not supported in the app.');

            if (paymentChain.id !== activeChain.id) {
                throw new Error(`Please switch your wallet to ${paymentChain.name} before paying this event.`);
            }

            const offChainIdBytes32 = event.off_chain_id as `0x${string}`;

            const shareAmount = await readContract({
                contract: getEventContract(paymentChain),
                method: "getSharedPriceInEth",
                params: [offChainIdBytes32],
            });

            const tx = prepareContractCall({
                contract: getEventContract(paymentChain),
                method: "payment",
                params: [offChainIdBytes32],
                value: shareAmount as bigint,
            });

            const res = await sendTransaction({
                transaction: tx,
                account: liveAccount,
            });

            await waitForReceipt({
                client,
                chain: paymentChain,
                transactionHash: res.transactionHash,
            });

            const payResponse = await fetch(`${API_URL}/events/${event.off_chain_id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    debtor_wallet: walletAddress,
                    chain_id: paymentChain.id,
                    tx_hash: res.transactionHash,
                    currency: event.currency,
                }),
            });

            if (!payResponse.ok) {
                const errorText = await payResponse.text();
                console.error("Backend payment update failed:", errorText);
                throw new Error("Payment succeeded on-chain but failed to update backend");
            }

            setEvents(prev =>
                prev.map(ev =>
                    ev.off_chain_id !== eventId
                        ? ev
                        : {
                            ...ev,
                            participants: ev.participants.map(p =>
                                p.address.toLowerCase() === walletAddress.toLowerCase()
                                    ? { ...p, paid: true }
                                    : p
                            ),
                        }
                )
            );

        } catch (err) {
            console.error("❌ Payment error:", err);
            alert(err instanceof Error ? err.message : 'Payment failed');
        } finally {
            setPayingEventId(null);
        }
    };

    return (
        <div className="me-wrap" id="my-events">
            <div className="me-inner">

                {/* ── Stats + Filters (only when data is loaded) ── */}
                {!loading && events.length > 0 && (
                    <>
                        <div className="me-stats-row">
                            <div className="me-stat">
                                <span className="me-stat-value">{events.length}</span>
                                <span className="me-stat-label">Total events</span>
                            </div>
                            <div className="me-stat">
                                <span className="me-stat-value">{settledCount}</span>
                                <span className="me-stat-label">Settled</span>
                            </div>
                            <div className="me-stat">
                                <span className="me-stat-value">{pendingCount}</span>
                                <span className="me-stat-label">Pending</span>
                            </div>
                        </div>

                        <div className="me-filter-tabs">
                            {(['all', 'pending', 'partial', 'settled'] as const).map(f => {
                                const count =
                                    f === 'all' ? events.length :
                                        f === 'settled' ? settledCount :
                                            f === 'pending' ? pendingCount :
                                                partialCount;
                                const labels: Record<typeof f, string> = {
                                    all: 'All', pending: 'Pending',
                                    partial: 'Partial', settled: 'Settled',
                                };
                                return (
                                    <button
                                        key={f}
                                        className={`me-filter-tab ${filter === f ? 'me-filter-tab--active' : ''}`}
                                        onClick={() => setFilter(f)}
                                    >
                                        {labels[f]}
                                        <span className="me-filter-count">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* ── Content ── */}
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#3d5a74', padding: '2rem' }}>
                        Loading your events…
                    </p>
                ) : events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#3d5a74' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><Inbox /></p>
                        <p style={{ fontWeight: 600 }}>No events yet</p>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>
                            Create your first splitting event above.
                        </p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#3d5a74' }}>
                        <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}><Search /></p>
                        <p style={{ fontWeight: 600 }}>No events found</p>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>
                            Try a different filter.
                        </p>
                    </div>
                ) : (
                    <div className="me-list">
                        {filteredEvents.map(ev => (
                            <EventCard
                                key={ev.off_chain_id}
                                event={ev}
                                expanded={expandedId === ev.off_chain_id}
                                onExpand={() =>
                                    setExpandedId(expandedId === ev.off_chain_id ? null : ev.off_chain_id)
                                }
                                walletAddress={walletAddress}
                                onPay={markPaid}
                                paying={payingEventId === ev.off_chain_id}
                                currencySymbol={ev.currency}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyEvents;
