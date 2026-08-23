import { useState, useEffect } from 'react'
import {
    fetchCampaignMilestones,
    getEscrowSummary,
    createMilestoneDB,
    submitMilestoneDB,
    verifyMilestoneDB,
    disputeMilestoneDB,
    reworkMilestoneDB,
    validateTrancheSchedule,
} from '@/lib/db/milestones'
import { isSupabaseConfigured } from '@/lib/supabase'
import { formatNumber } from '@/lib/utils'
import { X, ShieldCheck, Loader2, Plus, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

const naira = (n) => `₦${formatNumber(Math.round(Number(n) || 0))}`

const STATUS_STYLE = {
    pending: 'tag-ink',
    in_progress: 'tag-ink',
    submitted: 'tag-warning',
    verified: 'tag-success',
    disputed: 'tag-danger',
    missed: 'tag-danger',
}

/**
 * MilestonesPanel — escrow-backed milestone schedule for a funded campaign.
 *
 * Money rules (enforced server-side by the M1 RPCs):
 *  - Founder builds the schedule; tranches can never exceed the raised amount.
 *  - Founder / linked board members submit deliverables.
 *  - A BACKER verifies — the founder can never self-approve a release.
 *  - Verification credits the tranche to the founder's wallet ledger exactly
 *    once (ref-keyed), decrementing escrow.
 */
export default function MilestonesPanel({ campaign, onClose }) {
    const [summary, setSummary] = useState(null)
    const [milestones, setMilestones] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState(null)

    // Founder schedule form
    const [adding, setAdding] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', tranche: '', dueDate: '' })
    const [formError, setFormError] = useState('')

    const liveTier = isSupabaseConfigured()

    const loadAll = async () => {
        try {
            const [sum, list] = await Promise.all([
                getEscrowSummary(campaign.id),
                fetchCampaignMilestones(campaign.id),
            ])
            setSummary(sum)
            setMilestones(list)
            setError('')
        } catch (err) {
            setError(err.message || 'Could not load milestones')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!liveTier) { setLoading(false); return }
        loadAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaign.id])

    if (!liveTier) {
        return (
            <Shell campaign={campaign} onClose={onClose}>
                <p className="text-sm text-muted">
                    Milestone escrow runs on the server tier. This demo build shows the flow but holds no funds.
                </p>
            </Shell>
        )
    }

    const act = async (id, fn) => {
        setBusyId(id)
        setError('')
        try {
            await fn()
            await loadAll()
        } catch (err) {
            setError(err.message || 'Action failed')
        } finally {
            setBusyId(null)
        }
    }

    const committedTranches = [...milestones.map(m => ({ tranche: m.tranche }))]
    const schedule = validateTrancheSummary(summary?.raised ?? campaign.targetAmount, committedTranches)

    const handleCreate = async (e) => {
        e.preventDefault()
        setFormError('')
        const tranche = Number(form.tranche)
        if (!form.title.trim()) return setFormError('Give the milestone a title')
        if (!tranche || tranche <= 0) return setFormError('Tranche must be greater than zero')
        if (tranche > schedule.remaining) return setFormError(`Only ${naira(schedule.remaining)} left in escrow`)
        setBusyId('new')
        try {
            await createMilestoneDB({
                campaignId: campaign.id,
                title: form.title.trim(),
                description: form.description.trim(),
                tranche,
                dueDate: form.dueDate || null,
                position: milestones.length,
            })
            setForm({ title: '', description: '', tranche: '', dueDate: '' })
            setAdding(false)
            await loadAll()
        } catch (err) {
            setFormError(err.message || 'Could not create milestone')
        } finally {
            setBusyId(null)
        }
    }

    return (
        <Shell campaign={campaign} onClose={onClose}>
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-muted" />
                </div>
            ) : (
                <>
                    {/* Escrow summary */}
                    {summary && (
                        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--color-invest-bg)' }}>
                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--color-invest)' }}>
                                <ShieldCheck size={14} /> Escrow · {summary.status}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 mono text-sm">
                                <div><span className="text-xs text-muted block">Raised</span>{naira(summary.raised)}</div>
                                <div><span className="text-xs text-muted block">Held</span>{naira(summary.held)}</div>
                                <div><span className="text-xs text-muted block">Released</span>{naira(summary.released)}</div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-[13px] mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>
                    )}

                    {/* Milestone list */}
                    <div className="space-y-2">
                        {milestones.length === 0 && !summary?.isFounder && (
                            <p className="text-sm text-muted py-4 text-center">No milestones published yet.</p>
                        )}
                        {milestones.map(m => (
                            <div key={m.id} className="p-3 rounded-xl border bg-card">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`tag ${STATUS_STYLE[m.status] || 'tag-ink'}`}><span className="tag-dot" />{m.status.replace('_', ' ')}</span>
                                            <span className="mono text-sm font-semibold">{naira(m.tranche)}</span>
                                            {m.dueDate && <span className="text-xs text-muted flex items-center gap-1"><Clock size={12} />{m.dueDate}</span>}
                                        </div>
                                        <p className="text-sm font-medium mt-1">{m.title}</p>
                                        {m.description && <p className="text-xs text-muted mt-0.5">{m.description}</p>}
                                        {m.submissionNote && (
                                            <p className="text-xs mt-1 p-2 rounded bg-muted/10">📝 {m.submissionNote}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Role-aware actions */}
                                <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t">
                                    {(m.status === 'pending' || m.status === 'in_progress' || m.status === 'disputed') &&
                                        (summary?.isFounder || m.boardId) && (
                                            <MiniBtn busy={busyId === m.id} onClick={() => act(m.id, () => submitMilestoneDB(m.id, 'Delivered as scoped.'))}>
                                                Submit deliverable
                                            </MiniBtn>
                                        )}
                                    {m.status === 'submitted' && summary?.isBacker && !summary?.isFounder && (
                                        <>
                                            <MiniBtn busy={busyId === m.id} variant="ok" onClick={() => act(m.id, () => verifyMilestoneDB(m.id))}>
                                                <CheckCircle2 size={13} /> Verify & release {naira(m.tranche)}
                                            </MiniBtn>
                                            <MiniBtn busy={busyId === m.id} onClick={() => act(m.id, () => disputeMilestoneDB(m.id))}>
                                                <AlertTriangle size={13} /> Dispute
                                            </MiniBtn>
                                        </>
                                    )}
                                    {m.status === 'disputed' && summary?.isFounder && (
                                        <MiniBtn busy={busyId === m.id} onClick={() => act(m.id, () => reworkMilestoneDB(m.id))}>
                                            Rework
                                        </MiniBtn>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Founder schedule builder */}
                    {summary?.isFounder && !adding && (
                        <button className="btn-ghost text-xs w-full mt-3" onClick={() => setAdding(true)}>
                            <Plus size={13} className="inline mr-1" /> Add milestone ({naira(schedule.remaining)} unallocated)
                        </button>
                    )}
                    {summary?.isFounder && adding && (
                        <form onSubmit={handleCreate} className="mt-3 space-y-2 p-3 rounded-xl border">
                            {formError && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{formError}</p>}
                            <input className="fx-input w-full" placeholder="Milestone title" value={form.title}
                                   onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                            <textarea className="fx-input w-full" rows={2} placeholder="Scope of deliverable"
                                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            <div className="flex gap-2">
                                <input className="fx-input flex-1" type="number" min="1" placeholder={`Tranche ₦ (max ${formatNumber(schedule.remaining)})`}
                                       value={form.tranche} onChange={e => setForm(f => ({ ...f, tranche: e.target.value }))} required />
                                <input className="fx-input flex-1" type="date" value={form.dueDate}
                                       onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                                <Button type="submit" variant="collaboard" size="sm" disabled={busyId === 'new'}>
                                    {busyId === 'new' ? <Loader2 size={14} className="animate-spin" /> : 'Publish milestone'}
                                </Button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </Shell>
    )
}

// Local helper so the summary check uses the live summary when present
function validateTrancheSummary(raised, tranches) {
    const s = validateTrancheSchedule(raised, tranches)
    return { ...s, remaining: Math.max(0, s.remaining) }
}

function MiniBtn({ children, onClick, busy, variant }) {
    return (
        <button
            type="button"
            disabled={busy}
            onClick={onClick}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 ${
                variant === 'ok'
                    ? 'border-success/40 text-success hover:bg-success/10'
                    : 'border-border hover:bg-muted/10'
            } disabled:opacity-50`}
        >
            {busy ? <Loader2 size={13} className="animate-spin" /> : children}
        </button>
    )
}

function Shell({ campaign, onClose, children }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <div className="absolute inset-0" style={{ background: 'rgba(10,22,40,.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
            <div className="relative w-full sm:max-w-[560px] max-h-[85vh] overflow-y-auto bg-card sm:rounded-[20px] rounded-t-[18px] shadow-2xl animate-slide-in-up">
                <div style={{ height: 3, background: 'var(--color-invest)' }} />
                <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b sticky top-0 bg-card z-10">
                    <div>
                        <h3 className="font-display text-[17px] leading-tight">Milestones & escrow</h3>
                        <p className="text-xs text-muted mt-0.5">{campaign.title}</p>
                    </div>
                    <button onClick={onClose} aria-label="Close" className="p-1 rounded-md hover:bg-muted/10">
                        <X size={18} className="text-muted" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    )
}
