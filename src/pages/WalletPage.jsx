import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { useData } from '@/contexts/DataContext'
import { useWallet } from '@/contexts/WalletContext'
import { isRealSessionEnabled } from '@/lib/flags'
import { formatNumber } from '@/lib/utils'
import { isVestDenStakingEnabled, isVestDenStakingLedgerRow } from '@/lib/features'
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    Shield,
    Star,
    Loader2
} from 'lucide-react'

/* ====================================================================
   Wallet Page — Phase 2
   Flag-off: dummy public-demo chrome. Not a live-money path.
   Flag-on: figures from the server mock ledger. Still not live rails.
   Staking / VestDen returns stay gated regardless of session flag.
   ==================================================================== */

const MOCK_TRANSACTIONS = [
    { id: 1, type: 'stake', label: 'Staked on AI Recipe Generator', amount: -2500, date: '2026-05-12', app: 'vestden' },
    { id: 2, type: 'earning', label: 'Demo credit · Solar Grid Network', amount: 4200, date: '2026-05-10', app: 'vestden' },
    { id: 3, type: 'reward', label: 'Points reward — Idea validated', amount: 150, date: '2026-05-09', app: 'conceptnexus' },
    { id: 4, type: 'stake', label: 'Staked on Sustainable Fashion Marketplace', amount: -1800, date: '2026-05-07', app: 'vestden' },
    { id: 5, type: 'earning', label: 'Demo credit · Logo Design', amount: 3500, date: '2026-05-05', app: 'skillscanvas' },
    { id: 6, type: 'reward', label: 'Points reward — Board completed', amount: 200, date: '2026-05-03', app: 'collaboard' },
    { id: 7, type: 'stake', label: 'Staked on Remote Team Wellness Platform', amount: -1000, date: '2026-05-01', app: 'vestden' },
    { id: 8, type: 'earning', label: 'Demo credit · EdTech Pipeline', amount: 2800, date: '2026-04-28', app: 'vestden' },
]

const TABS = isVestDenStakingEnabled()
    ? ['All', 'Stakes', 'Earnings', 'Rewards']
    : ['All', 'Rewards']

export default function WalletPage() {
    const { user } = useAuth()
    const { points } = usePoints()
    const { stakes } = useData()
    const {
        balance: totalBalance,
        held,
        transactions,
        source,
        ledgerLoading,
        realSession,
        payout,
    } = useWallet()
    const [activeTab, setActiveTab] = useState('All')
    const [payoutAmount, setPayoutAmount] = useState('')
    const [payoutDest, setPayoutDest] = useState('')
    const [payoutError, setPayoutError] = useState('')
    const [payoutBusy, setPayoutBusy] = useState(false)

    const flagOn = isRealSessionEnabled() || realSession

    const sourceRows = flagOn
        ? transactions
        : [...transactions, ...MOCK_TRANSACTIONS]
    const allTransactions = sourceRows
        .filter(t => isVestDenStakingEnabled() || !isVestDenStakingLedgerRow(t))
    const filtered = activeTab === 'All'
        ? allTransactions
        : allTransactions.filter(t => t.type === activeTab.toLowerCase().slice(0, -1))

    const appColors = {
        vestden: 'var(--color-invest)',
        conceptnexus: 'var(--color-concept)',
        collaboard: 'var(--color-collab)',
        skillscanvas: 'var(--color-skills)',
        wallet: 'var(--color-navy-900)',
    }

    const handlePayout = async (e) => {
        e.preventDefault()
        setPayoutError('')
        setPayoutBusy(true)
        try {
            const result = await payout(Number(payoutAmount), payoutDest)
            if (!result.ok) setPayoutError(result.error)
            else {
                setPayoutAmount('')
                setPayoutDest('')
            }
        } catch (err) {
            setPayoutError(err.message || 'Mock debit failed')
        } finally {
            setPayoutBusy(false)
        }
    }

    if (ledgerLoading) {
        return (
            <main className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted animate-spin" />
            </main>
        )
    }

    const displayBalance = totalBalance == null ? 0 : totalBalance

    return (
        <div className="fx-wallet-page">
            <div className="fx-page-header">
                <div className="page-header-icon" style={{ background: 'var(--color-navy-900)', color: 'white' }}>
                    <Wallet size={20} />
                </div>
                <div>
                    <span className="page-header-eyebrow">Wallet</span>
                    <h1 className="page-header-title display">Your wallet</h1>
                    <p className="page-header-sub">
                        {flagOn
                            ? 'Figures from the server mock ledger. Not live rails. Not client funds.'
                            : 'Dummy naira wallet for the public demo. Not a live-money path.'}
                    </p>
                </div>
            </div>

            <div className="wallet-balance-hero">
                <div className="wallet-balance-bg" />
                <div className="wallet-balance-inner">
                    <span className="wallet-balance-label">
                        {flagOn ? 'Mock ledger available' : 'Dummy total'}
                    </span>
                    <div className="wallet-balance-amount display">₦{formatNumber(displayBalance)}</div>
                    {flagOn ? (
                        <div className="wallet-balance-splits">
                            <div className="wallet-split">
                                <span className="split-label">Available</span>
                                <span className="split-value">₦{formatNumber(displayBalance)}</span>
                            </div>
                            <div className="wallet-split">
                                <span className="split-label">Held (mock)</span>
                                <span className="split-value">₦{formatNumber(held || 0)}</span>
                            </div>
                            <div className="wallet-split">
                                <span className="split-label">Source</span>
                                <span className="split-value">{source || 'mock-ledger'}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="wallet-balance-note" style={{ marginTop: 8, opacity: 0.85, fontSize: 13 }}>
                            Prototype figure. Not a live-money path. Not client funds. Not bank-grade escrow.
                        </p>
                    )}
                    <p style={{ marginTop: 8, opacity: 0.75, fontSize: 12 }}>
                        No Paystack, Flutterwave, NIP, or NIMC call.
                        {user?.email ? ` Signed in as ${user.email}.` : ''}
                    </p>
                    {!flagOn && (
                        <div className="wallet-balance-actions">
                            <button type="button" className="wallet-action-btn" disabled>
                                <ArrowUpRight size={16} /> Send (demo)
                            </button>
                            <button type="button" className="wallet-action-btn" disabled>
                                <ArrowDownLeft size={16} /> Receive (demo)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {flagOn && (
                <form className="wallet-txn-section" onSubmit={handlePayout} style={{ padding: 20 }}>
                    <h2 className="wallet-txn-title display">Mock ledger debit</h2>
                    <p className="page-header-sub" style={{ marginBottom: 12 }}>
                        Hits the server WalletLedger mock. Not a live processor. Not client funds.
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Amount (₦)"
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            className="fx-input"
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-ink-200)' }}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Destination label"
                            value={payoutDest}
                            onChange={(e) => setPayoutDest(e.target.value)}
                            className="fx-input"
                            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-ink-200)' }}
                        />
                        <button type="submit" className="wallet-action-btn" disabled={payoutBusy}>
                            {payoutBusy ? 'Posting…' : 'Post mock debit'}
                        </button>
                    </div>
                    {payoutError && (
                        <p style={{ color: 'var(--color-destructive, #b91c1c)', marginTop: 8, fontSize: 13 }}>{payoutError}</p>
                    )}
                </form>
            )}

            <div className="wallet-stats-row">
                <div className="wallet-stat">
                    <div className="wallet-stat-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                        <Star size={18} />
                    </div>
                    <div>
                        <span className="wallet-stat-value display">{formatNumber(points)}</span>
                        <span className="wallet-stat-label">Fixars Points</span>
                    </div>
                </div>
                {!flagOn && isVestDenStakingEnabled() && (
                    <div className="wallet-stat">
                        <div className="wallet-stat-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                            <Shield size={18} />
                        </div>
                        <div>
                            <span className="wallet-stat-value display">{stakes.filter(s => s.status === 'active').length}</span>
                            <span className="wallet-stat-label">Active Stakes (demo)</span>
                        </div>
                    </div>
                )}
                <div className="wallet-stat">
                    <div className="wallet-stat-icon" style={{ background: 'var(--color-concept-bg)', color: 'var(--color-concept)' }}>
                        <Clock size={18} />
                    </div>
                    <div>
                        <span className="wallet-stat-value display">{allTransactions.length}</span>
                        <span className="wallet-stat-label">Transactions</span>
                    </div>
                </div>
            </div>

            <div className="wallet-txn-section">
                <div className="wallet-txn-header">
                    <h2 className="wallet-txn-title display">Transaction History</h2>
                    <div className="wallet-txn-tabs">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                className={`wallet-txn-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="wallet-txn-list">
                    {filtered.length === 0 && (
                        <p className="page-header-sub" style={{ padding: 16 }}>No ledger entries yet.</p>
                    )}
                    {filtered.map(txn => (
                        <div key={txn.id} className="wallet-txn-row">
                            <div className="txn-icon" style={{
                                background: txn.amount > 0 ? 'var(--color-success-bg)' : 'var(--color-ink-50)',
                                color: txn.amount > 0 ? 'var(--color-success)' : 'var(--color-ink-500)'
                            }}>
                                {txn.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                            </div>
                            <div className="txn-body">
                                <span className="txn-label">{txn.label}</span>
                                <div className="txn-meta">
                                    <span className="txn-date">{new Date(txn.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                    <span className="txn-app-dot" style={{ background: appColors[txn.app] }} />
                                    <span className="txn-app-name">{txn.app}</span>
                                </div>
                            </div>
                            <span className={`txn-amount mono ${txn.amount > 0 ? 'positive' : 'negative'}`}>
                                {txn.amount > 0 ? '+' : ''}₦{formatNumber(Math.abs(txn.amount))}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
