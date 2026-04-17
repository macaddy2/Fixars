import { useState } from 'react'
import Modal, { Field } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { Plus, X, Loader2 } from 'lucide-react'

const COLUMNS = [
    { id: 'todo', title: 'To Do' },
    { id: 'progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
]

export default function AddTaskModal({ open, onClose, boardId, defaultColumnId = 'todo' }) {
    const { addTask } = useData()

    const [title, setTitle] = useState('')
    const [columnId, setColumnId] = useState(defaultColumnId)
    const [dueDate, setDueDate] = useState('')
    const [labels, setLabels] = useState([])
    const [labelInput, setLabelInput] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const close = () => {
        setTitle(''); setColumnId(defaultColumnId); setDueDate('')
        setLabels([]); setLabelInput(''); setError(''); setSubmitting(false)
        onClose?.()
    }

    const addLabel = () => {
        const clean = labelInput.trim().toLowerCase()
        if (!clean || labels.includes(clean) || labels.length >= 4) return
        setLabels([...labels, clean])
        setLabelInput('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (title.trim().length < 2) return setError('Task title is required')
        if (!boardId) return setError('No board selected')

        setSubmitting(true)
        try {
            await addTask(boardId, columnId, {
                title: title.trim(),
                labels,
                dueDate: dueDate || null
            })
            close()
        } catch (err) {
            setError(err.message || 'Could not add task')
            setSubmitting(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={close}
            title="Add a task"
            subtitle="Create a new card on the kanban board"
            gradient="gradient-collaboard"
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                )}

                <Field label="Task title" required>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs doing?" maxLength={120} required autoFocus />
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Column">
                        <select value={columnId} onChange={e => setColumnId(e.target.value)} className="w-full p-2.5 rounded-lg border bg-card text-foreground text-sm focus:ring-2 focus:ring-collaboard focus:outline-none">
                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </Field>
                    <Field label="Due date">
                        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                    </Field>
                </div>

                <Field label="Labels" hint={`Up to 4. ${labels.length}/4`}>
                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                        {labels.map(l => (
                            <Badge key={l} variant="secondary" className="gap-1">
                                {l}
                                <button type="button" onClick={() => setLabels(labels.filter(x => x !== l))} aria-label={`Remove ${l}`}>
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={labelInput}
                            onChange={e => setLabelInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel() } }}
                            placeholder="Add a label"
                            disabled={labels.length >= 4}
                        />
                        <Button type="button" variant="outline" onClick={addLabel} disabled={!labelInput.trim() || labels.length >= 4}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </Field>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={close} className="flex-1" disabled={submitting}>Cancel</Button>
                    <Button type="submit" variant="collaboard" className="flex-1" disabled={submitting}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4 mr-2" /> Add task</>}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
