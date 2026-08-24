import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchIncomingBookings } from '@/lib/db/bookings'
import {
    fetchMyEngagements,
    acceptBookingDB,
    declineBookingDB,
    deliverEngagementDB,
    rateEngagementDB,
} from '@/lib/db/engagements'
import { isSupabaseConfigured } from '@/lib/supabase'
import { formatNumber, getRelativeTime } from '@/lib/utils'
import { Inbox, Loader2, Check, X, PackageCheck, Star } from 'lucide-react'

/**
 * Requests & engagements — shown on your OWN talent profile.
 * Accepting a booking atomically flips it and opens an engagement (server
 * RPC). Deliveries earn proof points + verified badge; hirers rate after
 * delivery, moving reputation.
 */
export default function EngagementsSection({ talent }) {
    const liveTier = isSupabaseConfigured()
    const [requests, setRequests] = useState([])
    const [engagements, setEngagements] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busyId, setBusyId] = useState(null)
    const [ratingFor, setRatingFor] = useState(null)
    const [ratingValue, setRatingValue] = useState(5)

    const loadAll = async () => {
        try {
            const [reqs, engs] = await Promise.all([
                fetchIncomingBookings(talent.id),
                fetchMyEngagements(),
            ])
            setRequests(reqs.filter(r => r.status === 'pending'))
            setEngagements(engs)
            setError('')
        } catch (err) {
            setError(err.message || 'Could not load requests')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!liveTier || !talent?.id) { setLoading(false); return }
        loadAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [talent?.id])

    if (!liveTier) return null

    const act = async (id, fn) => {
        setBusyId(id)
        setError('')
        try {
            await fn()
            await loadAll()
        } catch (err) {
            setError(typeof err === 'string' ? err : err.message || 'Action failed')
        } finally {
            setBusyId(null)
        }
    }

    const myEngagements = engagements

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-skillscanvas" /> Requests & engagements
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted" /></div>
                ) : (
                    <>
                        {error && <p className="text-sm mb-2" style={{ color: 'var(--color-danger)' }}>{error}</p>}

                        {requests.length > 0 && (
                            <div className="space-y-2 mb-4">
                                <p className="text-xs font-semibold text-muted uppercase tracking-wide">New requests</p>
                                {requests.map(r => (
                                    <div key={r.id} className="p-3 rounded-xl border bg-muted/5">
                                        <p className="text-sm font-medium">{r.requesterName}</p>
                                        {r.message && <p className="text-xs text-muted mt-0.5 line-clamp-2">{r.message}</p>}
                                        <div className="flex gap-2 mt-2">
                                            <MiniBtn busy={busyId === r.id} variant="ok" onClick={() => act(r.id, () => acceptBookingDB(r.id))}>
                                                <Check size={13} /> Accept
                                            </MiniBtn>
                                            <MiniBtn busy={busyId === r.id} onClick={() => act(r.id, () => declineBookingDB(r.id))}>
                                                <X size={13} /> Decline
                                            </MiniBtn>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {myEngagements.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Engagements</p>
                                {myEngagements.map(e => (
                                    <div key={e.id} className="p-3 rounded-xl border flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{e.roleTitle}</p>
                                            <p className="text-xs text-muted">
                                                {e.side === 'hirer' ? 'You hired' : 'Hired by'} {e.counterpartName}
                                                {' · '}{getRelativeTime(e.createdAt)}
                                                {e.rate != null ? ` · ₦${formatNumber(e.rate)}` : ''}
                                            </p>
                                            {e.onTime != null && (
                                                <span className={`tag ${e.onTime ? 'tag-success' : 'tag-warning'}`} style={{ marginTop: 4 }}>
                                                    <span className="tag-dot" />{e.onTime ? 'On time' : 'Late'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <StatusChip status={e.status} />
                                            {e.side === 'talent' && (e.status === 'accepted' || e.status === 'active') && (
                                                <MiniBtn busy={busyId === e.id} variant="ok" onClick={() => act(e.id, () => deliverEngagementDB(e.id))}>
                                                    <PackageCheck size={13} /> Deliver
                                                </MiniBtn>
                                            )}
                                            {e.side === 'hirer' && e.status === 'delivered' && ratingFor !== e.id && (
                                                <MiniBtn busy={busyId === e.id} onClick={() => { setRatingFor(e.id); setRatingValue(5) }}>
                                                    <Star size={13} /> Rate
                                                </MiniBtn>
                                            )}
                                            {e.side === 'hirer' && e.status === 'delivered' && ratingFor === e.id && (
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <button key={n} type="button" aria-label={`${n} stars`} onClick={() => setRatingValue(n)}>
                                                            <Star size={14} className={n <= ratingValue ? 'text-warning fill-warning' : 'text-muted/40'} />
                                                        </button>
                                                    ))}
                                                    <MiniBtn busy={busyId === e.id} variant="ok" onClick={() => act(e.id, () => rateEngagementDB(e.id, ratingValue)).then(() => setRatingFor(null))}>
                                                        Send
                                                    </MiniBtn>
                                                </div>
                                            )}
                                            {e.rating != null && (
                                                <span className="text-xs text-muted flex items-center gap-1">
                                                    <Star size={12} className="text-warning fill-warning" />{e.rating}/5
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : requests.length === 0 ? (
                            <p className="text-sm text-muted text-center py-4">No requests or engagements yet.</p>
                        ) : null}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

function StatusChip({ status }) {
    const cls = status === 'rated' || status === 'delivered' ? 'tag-success'
        : status === 'declined' ? 'tag-danger' : 'tag-ink'
    return <span className={`tag ${cls}`}><span className="tag-dot" />{status}</span>
}

function MiniBtn({ children, onClick, busy, variant }) {
    return (
        <button type="button" disabled={busy} onClick={onClick}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border inline-flex items-center gap-1 transition-colors ${
                    variant === 'ok' ? 'border-success/40 text-success hover:bg-success/10' : 'border-border hover:bg-muted/10'
                } disabled:opacity-50`}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : children}
        </button>
    )
}
