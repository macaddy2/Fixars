import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { useData } from '@/contexts/DataContext'
import { useWallet } from '@/contexts/WalletContext'
import { formatNumber } from '@/lib/utils'
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    Clock,
    Shield,
    ChevronRight,
    Filter,
    Star
} from 'lucide-react'

/* ====================================================================
   Wallet Page — Phase 2
   Full wallet with balance hero, stats row, segment tabs, transaction
   history following the design handoff spec.
   ==================================================================== */

const MOCK_TRANSACTIONS = [
    { id: 1, type: 'stake', label: 'Staked on AI Recipe Generator', amount: -2500, date: '2026-05-12', app: 'vestden' },
    { id: 2, type: 'earning', label: 'Returns from Solar Grid Network', amount: 4200, date: '2026-05-10', app: 'vestden' },
    { id: 3, type: 'reward', label: 'Points reward — Idea validated', amount: 150, date: '2026-05-09', app: 'conceptnexus' },
    { id: 4, type: 'stake', label: 'Staked on Sustainable Fashion Marketplace', amount: -1800, date: '2026-05-07', app: 'vestden' },
    { id: 5, type: 'earning', label: 'Freelance payment — Logo Design', amount: 3500, date: '2026-05-05', app: 'skillscanvas' },
    { id: 6, type: 'reward', label: 'Points reward — Board completed', amount: 200, date: '2026-05-03', app: 'collaboard' },
    { id: 7, type: 'stake', label: 'Staked on Remote Team Wellness Platform', amount: -1000, date: '2026-05-01', app: 'vestden' },
    { id: 8, type: 'earning', label: 'Returns from EdTech Pipeline', amount: 2800, date: '2026-04-28', app: 'vestden' },
]

const TABS = ['All', 'Stakes', 'Earnings', 'Rewards']

export default function WalletPage() {
    const { user } = useAuth()
    const { points } = usePoints()
    const { stakes } = useData()
    const { balance: totalBalance, transactions } = useWallet()
    const [activeTab, setActiveTab] = useState('All')

    const available = 142500
    const inEscrow = 98000
    const staked = 44000

    // Live wallet ledger (real stakes/top-ups) ahead of the seeded history.
    const allTransactions = [...transactions, ...MOCK_TRANSACTIONS]
    const filtered = activeTab === 'All'
        ? allTransactions
        : allTransactions.filter(t => t.type === activeTab.toLowerCase().slice(0, -1))

    const appColors = {
        vestden: 'var(--color-invest)',
        conceptnexus: 'var(--color-concept)',
        collaboard: 'var(--color-collab)',
        skillscanvas: 'var(--color-skills)',
    }

    return (
        <div className="fx-wallet-page">
            {/* Page Header */}
            <div className="fx-page-header">
                <div className="page-header-icon" style={{ background: 'var(--color-navy-900)', color: 'white' }}>
                    <Wallet size={20} />
                </div>
                <div>
                    <span className="page-header-eyebrow">Wallet</span>
                    <h1 className="page-header-title display">Your wallet</h1>
                    <p className="page-header-sub">Manage your funds, stakes, and earnings across the Fixars ecosystem.</p>
                </div>
            </div>

            {/* Balance Hero Card */}
            <div className="wallet-balance-hero">
                <div className="wallet-balance-bg" />
                <div className="wallet-balance-inner">
                    <span className="wallet-balance-label">Total balance</span>
                    <div className="wallet-balance-amount display">₦{formatNumber(totalBalance)}</div>
                    <div className="wallet-balance-splits">
                        <div className="wallet-split">
                            <span className="split-label">Available</span>
                            <span className="split-value">₦{formatNumber(available)}</span>
                        </div>
                        <div className="wallet-split">
                            <span className="split-label">In escrow</span>
                            <span className="split-value">₦{formatNumber(inEscrow)}</span>
                        </div>
                        <div className="wallet-split">
                            <span className="split-label">Staked</span>
                            <span className="split-value">₦{formatNumber(staked)}</span>
                        </div>
                    </div>
                    <div className="wallet-balance-actions">
                        <button className="wallet-action-btn">
                            <ArrowUpRight size={16} /> Send
                        </button>
                        <button className="wallet-action-btn">
                            <ArrowDownLeft size={16} /> Receive
                        </button>
                        <button className="wallet-action-btn">
                            <TrendingUp size={16} /> Stake
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="wallet-stats-row">
                <div className="wallet-stat">
                    <div className="wallet-stat-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <span className="wallet-stat-value display">₦{formatNumber(4200)}</span>
                        <span className="wallet-stat-label">Total Returns</span>
                    </div>
                </div>
                <div className="wallet-stat">
                    <div className="wallet-stat-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                        <Star size={18} />
                    </div>
                    <div>
                        <span className="wallet-stat-value display">{formatNumber(points)}</span>
                        <span className="wallet-stat-label">Fixars Points</span>
                    </div>
                </div>
                <div className="wallet-stat">
                    <div className="wallet-stat-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                        <Shield size={18} />
                    </div>
                    <div>
                        <span className="wallet-stat-value display">{stakes.filter(s => s.status === 'active').length}</span>
                        <span className="wallet-stat-label">Active Stakes</span>
                    </div>
                </div>
                <div className="wallet-stat">
                    <div className="wallet-stat-icon" style={{ background: 'var(--color-concept-bg)', color: 'var(--color-concept)' }}>
                        <Clock size={18} />
                    </div>
                    <div>
                        <span className="wallet-stat-value display">12</span>
                        <span className="wallet-stat-label">Transactions</span>
                    </div>
                </div>
            </div>

            {/* Transactions */}
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
