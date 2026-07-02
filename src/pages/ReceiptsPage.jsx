import { useMemo, useState } from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { usePoints } from '@/contexts/PointsContext'
import { useData } from '@/contexts/DataContext'
import { buildLedger } from '@/lib/ledger'
import { ReceiptText, Wallet, Star, AlignLeft } from 'lucide-react'

/* ====================================================================
   Receipts — the user-facing Decision Log.
   Every wallet movement, points award and ecosystem activity on one
   append-only-styled record: what happened, why, and when.
   Backed today by the app's context ledgers via lib/ledger.js; shaped
   to be backed by the engine's event log (FCL Decision Log) later.
   ==================================================================== */

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'points', label: 'Points', icon: Star },
    { key: 'activity', label: 'Activity', icon: AlignLeft },
]

const SOURCE_META = {
    wallet: { label: 'Wallet', color: 'var(--color-invest)' },
    points: { label: 'Points', color: 'var(--color-warning)' },
    activity: { label: 'Activity', color: 'var(--color-collab)' },
}

function formatTs(ts) {
    const d = new Date(ts)
    if (Number.isNaN(d.getTime())) return ts
    return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
}

function ReceiptDelta({ entry }) {
    if (entry.amount != null) {
        const negative = entry.amount < 0
        return (
            <span className={`receipt-delta mono ${negative ? 'debit' : 'credit'}`}>
                {negative ? '−' : '+'}₦{Math.abs(entry.amount).toLocaleString()}
            </span>
        )
    }
    if (entry.points != null) {
        return <span className="receipt-delta mono credit">+{entry.points} pts</span>
    }
    return null
}

export default function ReceiptsPage() {
    const { transactions } = useWallet()
    const { history } = usePoints()
    const { activities } = useData()
    const [filter, setFilter] = useState('all')

    const ledger = useMemo(
        () => buildLedger({ transactions, history, activities }),
        [transactions, history, activities]
    )

    const entries = filter === 'all' ? ledger : ledger.filter(e => e.source === filter)

    return (
        <div className="fx-receipts-page">
            {/* Page Header */}
            <div className="fx-page-header">
                <div className="page-header-icon" style={{ background: 'var(--color-ink-100)', color: 'var(--color-ink-700)' }}>
                    <ReceiptText size={20} />
                </div>
                <div>
                    <span className="page-header-eyebrow">Decision Log</span>
                    <h1 className="page-header-title display">Receipts</h1>
                    <p className="page-header-sub">Every action on the record — what happened, why, and when. Your context belongs to you.</p>
                </div>
            </div>

            {/* Source filter */}
            <div className="receipts-filter-row">
                {FILTERS.map(f => {
                    const Icon = f.icon
                    return (
                        <button
                            key={f.key}
                            className={`receipts-filter ${filter === f.key ? 'active' : ''}`}
                            onClick={() => setFilter(f.key)}
                        >
                            {Icon && <Icon size={13} />} {f.label}
                        </button>
                    )
                })}
            </div>

            {/* Ledger */}
            <div className="receipts-list">
                {entries.length === 0 && (
                    <div className="receipts-empty">
                        No entries yet — receipts appear here as you use Fixars.
                    </div>
                )}
                {entries.map(entry => {
                    const meta = SOURCE_META[entry.source]
                    return (
                        <div key={entry.id} className="receipt-row">
                            <span className="receipt-chip" style={{ background: meta.color + '18', color: meta.color }}>
                                {meta.label}
                            </span>
                            <div className="receipt-body">
                                <span className="receipt-label">{entry.label}</span>
                                <span className="receipt-reason">{entry.reason}</span>
                            </div>
                            <div className="receipt-side">
                                <ReceiptDelta entry={entry} />
                                <span className="receipt-ts mono">{formatTs(entry.ts)}</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
