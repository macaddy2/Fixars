import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { FileSignature, Plus, Loader2, PenLine } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Board agreements — explicit team commitments with signatures.
 * Drafting: owners/admins (server-enforced). Signing: any board member,
 * once per member (unique constraint).
 */
export default function AgreementsCard({ board }) {
    const { user } = useAuth()
    const [agreements, setAgreements] = useState(null)
    const [adding, setAdding] = useState(false)
    const [form, setForm] = useState({ title: '', body: '' })
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const liveTier = isSupabaseConfigured()

    useEffect(() => {
        if (!liveTier || !board?.id) return
        let cancelled = false
        ;(async () => {
            try {
                const { data } = await supabase
                    .from('board_agreements')
                    .select(`
                        id, title, body, created_at,
                        signatures:board_agreement_signatures(id, user_id, name)
                    `)
                    .eq('board_id', board.id)
                    .order('created_at', { ascending: false })
                if (!cancelled) setAgreements(data || [])
            } catch {
                if (!cancelled) setAgreements([])
            }
        })()
        return () => { cancelled = true }
    }, [board?.id, liveTier])

    if (!liveTier) return null

    const create = async (e) => {
        e.preventDefault()
        if (!form.title.trim() || !form.body.trim()) return
        setBusy(true); setError('')
        try {
            await supabase.rpc('create_board_agreement', {
                p_board_id: board.id, p_title: form.title.trim(), p_body: form.body.trim(),
            })
            setForm({ title: '', body: '' }); setAdding(false)
        } catch (err) {
            setError(err.message || 'Could not draft agreement')
        } finally { setBusy(false) }
    }

    const sign = async (agreementId) => {
        setBusy(true); setError('')
        try {
            await supabase.rpc('sign_board_agreement', { p_agreement_id: agreementId, p_name: user?.name || '' })
            const { data } = await supabase
                .from('board_agreements')
                .select('id, title, body, created_at, signatures:board_agreement_signatures(id, user_id, name)')
                .eq('board_id', board.id)
                .order('created_at', { ascending: false })
            setAgreements(data || [])
        } catch (err) {
            setError(err.message || 'Could not sign')
        } finally { setBusy(false) }
    }

    return (
        <Card className="border-collaboard/20 bg-collaboard/5">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <FileSignature size={15} /> Agreements
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}
                {agreements === null && <Loader2 size={16} className="animate-spin text-muted" />}
                {Array.isArray(agreements) && agreements.length === 0 && (
                    <p className="text-xs text-muted">No agreements drafted yet.</p>
                )}
                {(agreements || []).map(a => {
                    const signed = a.signatures?.some(s => s.user_id === user?.id)
                    return (
                        <div key={a.id} className="p-3 rounded-lg bg-card border">
                            <p className="text-sm font-medium">{a.title}</p>
                            <p className="text-xs text-muted mt-1 whitespace-pre-wrap line-clamp-4">{a.body}</p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                <span className="text-[11px] text-muted">{a.signatures?.length || 0} signed</span>
                                {signed ? (
                                    <span className="tag tag-success"><span className="tag-dot" />Signed</span>
                                ) : (
                                    <button type="button" className="btn-ghost text-xs inline-flex items-center gap-1"
                                            disabled={busy} onClick={() => sign(a.id)}>
                                        <PenLine size={12} /> Sign
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}

                {!adding && (
                    <button type="button" className="btn-ghost text-xs w-full" onClick={() => setAdding(true)}>
                        <Plus size={13} className="inline mr-1" /> Draft agreement
                    </button>
                )}
                {adding && (
                    <form onSubmit={create} className="space-y-2 p-3 rounded-lg bg-card border">
                        <input className="fx-input w-full" placeholder="Agreement title" value={form.title}
                               onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                        <textarea className="fx-input w-full" rows={3} placeholder="What is the team committing to?"
                                  value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} required />
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="btn-ghost text-xs" onClick={() => setAdding(false)}>Cancel</button>
                            <button type="submit" className="btn-app btn-app-collab text-xs" disabled={busy}>
                                {busy ? <Loader2 size={13} className="animate-spin" /> : 'Publish'}
                            </button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
