import { useState } from 'react'
import Modal, { Field } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { Lightbulb, Plus, X, Loader2 } from 'lucide-react'

const CATEGORIES = [
    'sustainability', 'tech', 'social-impact', 'media', 'health',
    'education', 'fintech', 'marketplace', 'other'
]

const SUGGESTED_TAGS = [
    'environmental', 'community', 'energy', 'social', 'skills',
    'non-profit', 'local', 'ai', 'mobile', 'health'
]

export default function SubmitIdeaModal({ open, onClose }) {
    const { submitIdea, logActivity } = useData()
    const { user } = useAuth()
    const { awardPoints } = usePoints()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('sustainability')
    const [tags, setTags] = useState([])
    const [tagInput, setTagInput] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const reset = () => {
        setTitle(''); setDescription(''); setCategory('sustainability')
        setTags([]); setTagInput(''); setError(''); setSubmitting(false)
    }

    const close = () => { reset(); onClose?.() }

    const addTag = (t) => {
        const clean = t.trim().toLowerCase()
        if (!clean || tags.includes(clean) || tags.length >= 5) return
        setTags([...tags, clean])
        setTagInput('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (title.trim().length < 5) return setError('Title must be at least 5 characters')
        if (description.trim().length < 20) return setError('Describe your idea in at least 20 characters')

        setSubmitting(true)
        try {
            await submitIdea({
                title: title.trim(),
                description: description.trim(),
                creatorId: user.id,
                creatorName: user.name,
                category,
                impactTags: tags
            })
            await awardPoints('SUBMIT_IDEA')
            logActivity('launch', user.name, `submitted "${title.trim()}"`, 'conceptnexus')
            close()
        } catch (err) {
            setError(err.message || 'Could not submit idea')
            setSubmitting(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={close}
            title="Submit a new idea"
            subtitle="Share your concept with the community for validation"
            gradient="gradient-conceptnexus"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                )}

                <Field label="Idea title" required>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Community Solar Grid Network"
                        maxLength={80}
                        required
                    />
                </Field>

                <Field label="Description" required hint="What problem does it solve? Who is it for?">
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the idea, the problem, and the impact..."
                        className="w-full p-3 rounded-lg border bg-card text-foreground text-sm resize-none focus:ring-2 focus:ring-conceptnexus focus:outline-none"
                        maxLength={600}
                        required
                    />
                    <p className="text-xs text-muted text-right">{description.length}/600</p>
                </Field>

                <Field label="Category">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-card text-foreground text-sm focus:ring-2 focus:ring-conceptnexus focus:outline-none"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </Field>

                <Field label="Impact tags" hint={`Up to 5. ${tags.length}/5`}>
                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                        {tags.map(t => (
                            <Badge key={t} variant="secondary" className="gap-1">
                                {t}
                                <button type="button" onClick={() => setTags(tags.filter(x => x !== t))} aria-label={`Remove ${t}`}>
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
                            }}
                            placeholder="Add a tag and press Enter"
                            disabled={tags.length >= 5}
                        />
                        <Button type="button" variant="outline" onClick={() => addTag(tagInput)} disabled={!tagInput.trim() || tags.length >= 5}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {SUGGESTED_TAGS.filter(s => !tags.includes(s)).slice(0, 6).map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => addTag(s)}
                                disabled={tags.length >= 5}
                                className="text-xs px-2 py-0.5 rounded-full border text-muted hover:text-foreground hover:bg-muted/10 disabled:opacity-40"
                            >
                                + {s}
                            </button>
                        ))}
                    </div>
                </Field>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={close} className="flex-1" disabled={submitting}>Cancel</Button>
                    <Button type="submit" variant="conceptnexus" className="flex-1" disabled={submitting}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Lightbulb className="w-4 h-4 mr-2" /> Submit idea</>}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
