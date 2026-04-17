import { useState } from 'react'
import Modal, { Field } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { Palette, Plus, X, Loader2 } from 'lucide-react'

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']
const AVAILABILITY = ['full-time', 'part-time', 'unavailable']

export default function ListSkillsModal({ open, onClose }) {
    const { createTalentProfile, logActivity } = useData()
    const { user } = useAuth()
    const { awardPoints } = usePoints()

    const [displayName, setDisplayName] = useState(user?.name || '')
    const [bio, setBio] = useState('')
    const [availability, setAvailability] = useState('part-time')
    const [hourlyRate, setHourlyRate] = useState(75)
    const [skills, setSkills] = useState([])
    const [skillName, setSkillName] = useState('')
    const [skillLevel, setSkillLevel] = useState('intermediate')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const close = () => {
        setDisplayName(user?.name || ''); setBio(''); setAvailability('part-time')
        setHourlyRate(75); setSkills([]); setSkillName(''); setSkillLevel('intermediate')
        setError(''); setSubmitting(false)
        onClose?.()
    }

    const addSkill = () => {
        const clean = skillName.trim()
        if (!clean || skills.some(s => s.name.toLowerCase() === clean.toLowerCase()) || skills.length >= 8) return
        setSkills([...skills, { name: clean, level: skillLevel, verified: false }])
        setSkillName('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (displayName.trim().length < 2) return setError('Please enter a display name')
        if (bio.trim().length < 20) return setError('Write at least 20 characters about yourself')
        if (skills.length === 0) return setError('Add at least one skill')
        if (hourlyRate < 0) return setError('Hourly rate must be positive')

        setSubmitting(true)
        try {
            await createTalentProfile({
                userId: user.id,
                displayName: displayName.trim(),
                bio: bio.trim(),
                skills,
                availability,
                hourlyRate: Number(hourlyRate),
                portfolio: []
            })
            await awardPoints('PROFILE_COMPLETE')
            logActivity('skill', user.name, `joined the talent pool`, 'skillscanvas')
            close()
        } catch (err) {
            setError(err.message || 'Could not create profile')
            setSubmitting(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={close}
            title="List your skills"
            subtitle="Create a talent profile so teams can find and book you"
            gradient="gradient-skillscanvas"
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Display name" required>
                        <Input value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={60} required />
                    </Field>
                    <Field label="Hourly rate (USD)" required>
                        <Input type="number" min={0} step={5} value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} required />
                    </Field>
                </div>

                <Field label="Bio" required hint="Tell teams what you do best">
                    <textarea
                        rows={3}
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="e.g. Full-stack developer with 8 years of experience in React, Node, and cloud architecture."
                        className="w-full p-3 rounded-lg border bg-card text-foreground text-sm resize-none focus:ring-2 focus:ring-skillscanvas focus:outline-none"
                        maxLength={400}
                        required
                    />
                </Field>

                <Field label="Availability">
                    <select value={availability} onChange={e => setAvailability(e.target.value)} className="w-full p-2.5 rounded-lg border bg-card text-foreground text-sm focus:ring-2 focus:ring-skillscanvas focus:outline-none">
                        {AVAILABILITY.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </Field>

                <Field label="Skills" required hint={`Add up to 8 skills. ${skills.length}/8`}>
                    <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                        {skills.map(s => (
                            <Badge key={s.name} variant="secondary" className="gap-1">
                                {s.name} <span className="text-muted">· {s.level}</span>
                                <button type="button" onClick={() => setSkills(skills.filter(x => x.name !== s.name))} aria-label={`Remove ${s.name}`}>
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={skillName}
                            onChange={e => setSkillName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                            placeholder="Skill name (e.g. React)"
                            disabled={skills.length >= 8}
                        />
                        <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)} className="p-2.5 rounded-lg border bg-card text-foreground text-sm focus:ring-2 focus:ring-skillscanvas focus:outline-none">
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <Button type="button" variant="outline" onClick={addSkill} disabled={!skillName.trim() || skills.length >= 8}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </Field>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={close} className="flex-1" disabled={submitting}>Cancel</Button>
                    <Button type="submit" variant="skillscanvas" className="flex-1" disabled={submitting}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</> : <><Palette className="w-4 h-4 mr-2" /> Publish profile</>}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
