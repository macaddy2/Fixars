import { useState } from 'react'
import Modal, { Field } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Loader2 } from 'lucide-react'

export default function CreateBoardModal({ open, onClose, onCreated }) {
    const { createBoard, logActivity } = useData()
    const { user } = useAuth()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const close = () => {
        setTitle(''); setDescription(''); setError(''); setSubmitting(false)
        onClose?.()
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (title.trim().length < 3) return setError('Title must be at least 3 characters')

        setSubmitting(true)
        try {
            const board = await createBoard({
                title: title.trim(),
                description: description.trim() || 'A new collaboration board.',
                creatorId: user.id,
                members: [{ userId: user.id, role: 'owner', name: user.name }],
                linkedIdeaId: null
            })
            logActivity('launch', user.name, `created board "${title.trim()}"`, 'collaboard')
            onCreated?.(board)
            close()
        } catch (err) {
            setError(err.message || 'Could not create board')
            setSubmitting(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={close}
            title="Create a board"
            subtitle="Set up a kanban workspace for your team"
            gradient="gradient-collaboard"
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                )}

                <Field label="Board title" required>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q2 Product Launch" maxLength={60} required autoFocus />
                </Field>

                <Field label="Description" hint="Optional. What the team will work on.">
                    <textarea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Briefly describe this board's purpose..."
                        className="w-full p-3 rounded-lg border bg-card text-foreground text-sm resize-none focus:ring-2 focus:ring-collaboard focus:outline-none"
                        maxLength={400}
                    />
                </Field>

                <div className="p-3 rounded-lg bg-muted/5 border text-xs text-muted">
                    We'll set up <strong className="text-foreground">To Do</strong>, <strong className="text-foreground">In Progress</strong>, and <strong className="text-foreground">Done</strong> columns for you.
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={close} className="flex-1" disabled={submitting}>Cancel</Button>
                    <Button type="submit" variant="collaboard" className="flex-1" disabled={submitting}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : <><Users className="w-4 h-4 mr-2" /> Create board</>}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
