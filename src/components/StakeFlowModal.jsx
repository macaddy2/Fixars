import { useState, useMemo } from 'react'
import { X, TrendingUp } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { formatNumber } from '@/lib/utils'

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000]
const INVEST = 'var(--color-invest)'

const naira = (n) => `₦${formatNumber(Math.round(n))}`

// Parse "2-4x" → { lo: 2, hi: 4 } for the projected-return range.
function parseMultiple(returns) {
    const m = String(returns || '').match(/([\d.]+)\s*-\s*([\d.]+)/)
    if (m) return { lo: parseFloat(m[1]), hi: parseFloat(m[2]) }
    const single = String(returns || '').match(/([\d.]+)/)
    const v = single ? parseFloat(single[1]) : 2
    return { lo: v, hi: v }
}

function daysLeft(deadline) {
    if (!deadline) return null
    const d = Math.ceil((new Date(deadline) - new Date()) / 86400000)
    return d > 0 ? d : 0
}

/**
 * StakeFlowModal — v2 wallet-based "key flow".
 * Backs an existing campaign: amount + quick chips → wallet source →
 * live projected return → confirm deducts the wallet and increments the
 * campaign (via onConfirm), with validation against the live balance.
 *
 * Mounted only while active (parent renders conditionally), so each open
 * starts from fresh state — no reset effect needed.
 */
export default function StakeFlowModal({ campaign, onClose, onConfirm }) {
    const { balance, spend, notify } = useWallet()
    const [amount, setAmount] = useState(25000)
    const [error, setError] = useState('')

    const mult = useMemo(() => parseMultiple(campaign?.expectedReturns), [campaign])
    const pct = campaign ? Math.min(100, Math.round((campaign.currentAmount / campaign.targetAmount) * 100)) : 0
    const days = daysLeft(campaign?.deadline)

    if (!campaign) return null

    const numeric = Number(amount) || 0
    const overBalance = numeric > balance

    const handleConfirm = () => {
        setError('')
        if (numeric <= 0) { setError('Enter an amount greater than zero'); return }
        const res = spend(numeric, { label: `Stake · ${campaign.title}`, app: 'vestden', type: 'stake' })
        if (!res.ok) { setError(res.error); return }
        onConfirm?.(numeric)
        notify(`Staked ${naira(numeric)} in ${campaign.title}`)
        onClose?.()
    }

    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <div
                className="absolute inset-0"
                style={{ background: 'rgba(10,22,40,.5)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />
            <div className="relative w-full sm:max-w-[520px] bg-card sm:rounded-[20px] rounded-t-[18px] overflow-hidden shadow-2xl animate-slide-in-up">
                {/* App-accent top bar */}
                <div style={{ height: 3, background: INVEST }} />

                {/* Header */}
                <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--color-invest-bg)' }}>
                        <TrendingUp className="w-4.5 h-4.5" style={{ color: INVEST }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-display text-[18px] font-medium leading-tight">Stake in {campaign.title}</h3>
                        <p className="text-xs text-muted mt-0.5">Back this campaign from your Fixars wallet.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted/10" aria-label="Close">
                        <X className="w-4.5 h-4.5 text-muted" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* IRR / progress banner */}
                    <div className="rounded-xl p-4" style={{ background: 'var(--color-invest-bg)' }}>
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: INVEST }}>
                                    Target return
                                </div>
                                <div className="font-display text-[26px] font-medium mono" style={{ color: INVEST }}>
                                    {campaign.expectedReturns}
                                </div>
                            </div>
                            <div className="text-right text-xs text-muted leading-relaxed">
                                <div><b className="text-foreground mono">{naira(campaign.currentAmount)}</b> / {naira(campaign.targetAmount)} · {pct}%</div>
                                <div>{campaign.stakers?.length || 0} backers{days != null ? ` · ${days} days left` : ''}</div>
                            </div>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(16,185,129,.2)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: INVEST }} />
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-[13px] font-semibold mb-2">Amount to stake</label>
                        <div className="flex items-center gap-2 rounded-[10px] border px-3 py-2.5"
                            style={{ borderColor: overBalance ? 'var(--color-danger)' : 'var(--color-input)' }}>
                            <span className="text-muted mono">₦</span>
                            <input
                                type="number"
                                min="0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="flex-1 bg-transparent outline-none mono text-[18px] text-foreground"
                            />
                        </div>
                        <div className="flex gap-2 mt-2.5 flex-wrap">
                            {QUICK_AMOUNTS.map(q => {
                                const active = numeric === q
                                return (
                                    <button
                                        key={q}
                                        onClick={() => setAmount(q)}
                                        className="px-3 py-1.5 rounded-full text-xs font-semibold mono transition-colors border"
                                        style={active
                                            ? { background: INVEST, color: '#fff', borderColor: INVEST }
                                            : { background: 'transparent', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }}
                                    >
                                        ₦{formatNumber(q)}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-[13px] font-semibold mb-2">Pay from</label>
                        <div className="flex items-center justify-between rounded-[10px] border px-3 py-3">
                            <span className="text-sm font-medium">Fixars Wallet</span>
                            <span className="mono text-sm" style={{ color: overBalance ? 'var(--color-danger)' : 'var(--color-foreground)' }}>
                                {naira(balance)}
                            </span>
                        </div>
                    </div>

                    {/* Projected return */}
                    <div className="rounded-xl border p-4">
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-muted mb-1">
                            Projected value
                        </div>
                        <div className="font-display text-[20px] font-medium mono">
                            {mult.lo === mult.hi ? naira(numeric * mult.lo) : `${naira(numeric * mult.lo)} – ${naira(numeric * mult.hi)}`}
                        </div>
                        <p className="text-[11px] text-muted mt-1">
                            Based on the {campaign.expectedReturns} target return. Returns are not guaranteed.
                        </p>
                    </div>

                    {error && <p className="text-[13px]" style={{ color: 'var(--color-danger)' }}>{error}</p>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-sm font-medium text-muted hover:bg-muted/10">
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={overBalance || numeric <= 0}
                        className="px-4 py-2 rounded-[10px] text-sm font-semibold text-white disabled:opacity-50"
                        style={{ background: INVEST }}
                    >
                        Stake {naira(numeric)}
                    </button>
                </div>
            </div>
        </div>
    )
}
