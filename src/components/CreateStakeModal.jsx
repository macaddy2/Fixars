import { useState } from 'react'
import Modal, { Field } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { TrendingUp, Loader2 } from 'lucide-react'

const CATEGORIES = ['tech', 'marketplace', 'health', 'fintech', 'sustainability', 'media', 'other']
const RISK = ['low', 'medium', 'high']
const RETURNS = ['1-2x', '1.5-3x', '2-4x', '3-6x', '5-10x']

function todayPlus(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}

export default function CreateStakeModal({ open, onClose }) {
    const { createStake, logActivity } = useData()
    const { user } = useAuth()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('tech')
    const [targetAmount, setTargetAmount] = useState(10000)
    const [riskLevel, setRiskLevel] = useState('medium')
    const [expectedReturns, setExpectedReturns] = useState('2-4x')
    const [deadline, setDeadline] = useState(todayPlus(60))
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const close = () => {
        setTitle(''); setDescription(''); setCategory('tech')
        setTargetAmount(10000); setRiskLevel('medium'); setExpectedReturns('2-4x')
        setDeadline(todayPlus(60)); setError(''); setSubmitting(false)
        onClose?.()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (title.trim().length < 5) return setError('Title must be at least 5 characters')
        if (description.trim().length < 20) return setError('Describe the stake in at least 20 characters')
        if (targetAmount < 100) return setError('Target amount must be at least $100')
        if (new Date(deadline) <= new Date()) return setError('Deadline must be in the future')

        setSubmitting(true)
        try {
            await createStake({
                title: title.trim(),
                description: description.trim(),
                creatorId: user.id,
                creatorName: user.name,
                category,
                riskLevel,
                targetAmount: Number(targetAmount),
                expectedReturns,
                deadline
            })
            logActivity('stake', user.name, `created a stake: ${title.trim()}`, 'vestden')
            close()
        } catch (err) {
            setError(err.message || 'Could not create stake')
            setSubmitting(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={close}
            title="Create a stake"
            subtitle="Raise capital from the community for your venture"
            gradient="gradient-vestden"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                )}

                <Field label="Title" required>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. AI Recipe Generator" maxLength={80} required />
                </Field>

                <Field label="Description" required>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="What you're building and why it will succeed..."
                        className="w-full p-3 rounded-lg border bg-card text-foreground text-sm resize-none focus:ring-2 focus:ring-vestden focus:outline-none"
                        maxLength={500}
                        required
                    />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Category">
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 rounded-lg border bg-card text-foreground text-sm focus:ring-2 focus:ring-vestden focus:outline-none">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Risk level">
                        <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className="w-full p-2.5 rounded-lg border bg-card text-foreground text-sm focus:ring-2 focus:ring-vestden focus:outline-none">
                            {RISK.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Target amount (USD)" required>
                        <Input type="number" min={100} step={100} value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required />
                    </Field>
                    <Field label="Expected returns">
                        <select value={expectedReturns} onChange={e => setExpectedReturns(e.target.value)} className="w-full p-2.5 rounded-lg border bg-card text-foreground text-sm focus:ring-2 focus:ring-vestden focus:outline-none">
                            {RETURNS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </Field>
                </div>

                <Field label="Deadline" required>
                    <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} min={todayPlus(1)} required />
                </Field>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={close} className="flex-1" disabled={submitting}>Cancel</Button>
                    <Button type="submit" variant="vestden" className="flex-1" disabled={submitting}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <><TrendingUp className="w-4 h-4 mr-2" /> Create stake</>}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
