import { useState, useEffect } from 'react'
import { ShieldAlert, UserCheck, Loader2, CheckCircle2, Undo2 } from 'lucide-react'
import PageHead from '@/components/PageHead'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
    amIOperator,
    fetchDisputes,
    resolveDisputeDB,
    fetchKycQueue,
    grantTier3DB,
} from '@/lib/db/ops'
import { formatNumber, getRelativeTime } from '@/lib/utils'

/**
 * Ops console — operator-gated server-side (assert_operator in every RPC).
 * Route /ops. Disputes + KYC queue today; escrow audit lives on Receipts.
 */
export default function OpsPage() {
    const { user } = useAuth()
    const [operator, setOperator] = useState(null) // null = checking
    const [tab, setTab] = useState('disputes')
    const [disputes, setDisputes] = useState([])
    const [kycQueue, setKycQueue] = useState([])
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState(null)
    const [error, setError] = useState('')
    const [note, setNote] = useState('')

    useEffect(() => {
        if (!isSupabaseConfigured()) { setOperator(false); setLoading(false); return }
        let cancelled = false
        amIOperator().then(ok => !cancelled && setOperator(ok)).finally(() => !cancelled && setLoading(false))
        return () => { cancelled = true }
    }, [])

    const loadTab = async () => {
        setLoading(true); setError('')
        try {
            if (tab === 'disputes') setDisputes(await fetchDisputes())
            else setKycQueue(await fetchKycQueue())
        } catch (err) {
            setError(err.message || 'Failed to load queue')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (operator) loadTab()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [operator, tab])

    if (loading && operator === null) {
        return <Center><Loader2 className="w-6 h-6 animate-spin text-muted" /></Center>
    }

    if (!isSupabaseConfigured() || !operator) {
        return (
            <main className="py-8">
                <div className="max-w-3xl mx-auto px-4">
                    <PageHead app="collab" glyph="O" tag="Operators only" title="Ops console"
                              sub="Trust & safety tooling for the Fixars operations team." />
                    <p className="text-sm text-muted text-center py-10">
                        This account doesn't have operator access. Operators are granted via
                        <code className="mx-1 px-1 rounded bg-muted/20">profiles.is_operator</code> by an existing admin.
                    </p>
                </div>
            </main>
        )
    }

    const act = async (id, fn) => {
        setBusyId(id); setError(''); setNote('')
        try {
            const result = await fn()
            if (tab === 'disputes') await loadTab()
            setNote(typeof result === 'string' ? `Resolved → ${result}` : 'Done')
        } catch (err) {
            setError(err.message || 'Action failed')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <main className="py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHead app="collab" glyph="O" tag="Operators" title="Ops console"
                          sub={`Signed in as ${user?.email || 'operator'} — every action here is audit-visible.`} />

                <div className="flex gap-2 mb-5">
                    <TabBtn active={tab === 'disputes'} onClick={() => setTab('disputes')} icon={ShieldAlert} label={`Disputes`} />
                    <TabBtn active={tab === 'kyc'} onClick={() => setTab('kyc')} icon={UserCheck} label="KYC queue" />
                </div>

                {(error || note) && (
                    <p className="text-sm mb-3" style={{ color: error ? 'var(--color-danger)' : 'var(--color-success)' }}>
                        {error || note}
                    </p>
                )}

                {loading ? (
                    <Center><Loader2 className="w-6 h-6 animate-spin text-muted" /></Center>
                ) : tab === 'disputes' ? (
                    disputes.length === 0 ? (
                        <Empty text="No disputed milestones. 🎉" />
                    ) : (
                        <div className="space-y-3">
                            {disputes.map(d => (
                                <div key={d.milestoneId} className="p-4 rounded-xl border bg-card">
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">{d.milestoneTitle}</p>
                                            <p className="text-xs text-muted mt-0.5">
                                                {d.campaignTitle} · founder {d.founderName} · tranche ₦{formatNumber(d.tranche)}
                                            </p>
                                            {d.submissionNote && <p className="text-xs mt-2 p-2 rounded bg-muted/10">📝 {d.submissionNote}</p>}
                                            <p className="text-[11px] text-muted mt-1">
                                                Escrow holding ₦{formatNumber(d.held)} · disputed by {d.disputedBy || 'a backer'} · submitted {getRelativeTime(d.submittedAt)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <OpBtn busy={busyId === d.milestoneId} variant="ok"
                                                   onClick={() => act(d.milestoneId, () => resolveDisputeDB(d.milestoneId, 'release'))}>
                                                <CheckCircle2 size={13} /> Release to founder
                                            </OpBtn>
                                            <OpBtn busy={busyId === d.milestoneId}
                                                   onClick={() => act(d.milestoneId, () => resolveDisputeDB(d.milestoneId, 'rework'))}>
                                                <Undo2 size={13} /> Send back
                                            </OpBtn>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : kycQueue.length === 0 ? (
                    <Empty text="KYC queue is empty." />
                ) : (
                    <div className="space-y-2">
                        {kycQueue.map(u => (
                            <div key={u.userId} className="p-3 rounded-xl border bg-card flex items-center justify-between gap-3 flex-wrap">
                                <div>
                                    <p className="text-sm font-medium">{u.name}</p>
                                    <p className="text-xs text-muted">{u.email} · tier {u.tier} · joined {getRelativeTime(u.joinedAt)}</p>
                                </div>
                                {u.tier >= 2 ? (
                                    <OpBtn busy={busyId === u.userId} onClick={() => act(u.userId, () => grantTier3DB(u.userId))}>
                                        Grant tier 3
                                    </OpBtn>
                                ) : (
                                    <span className="tag tag-ink"><span className="tag-dot" />Awaiting tier {u.tier + 1} from user</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}

function TabBtn({ active, onClick, icon: Icon, label }) {
    return (
        <button onClick={onClick}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-1.5 ${
                    active ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted/10'
                }`}>
            <Icon size={14} /> {label}
        </button>
    )
}

function OpBtn({ children, onClick, busy, variant }) {
    return (
        <button type="button" disabled={busy} onClick={onClick}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border inline-flex items-center gap-1 transition-colors ${
                    variant === 'ok' ? 'border-success/40 text-success hover:bg-success/10' : 'border-border hover:bg-muted/10'
                } disabled:opacity-50`}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : children}
        </button>
    )
}

function Center({ children }) {
    return <div className="min-h-[50vh] flex items-center justify-center">{children}</div>
}

function Empty({ text }) {
    return <p className="text-sm text-muted text-center py-16">{text}</p>
}
