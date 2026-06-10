import { useState } from 'react'
import BookingModal from '@/components/BookingModal'
import ListSkillsModal from '@/components/ListSkillsModal'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, formatNumber } from '@/lib/utils'
import PageHead from '@/components/PageHead'
import { StatRow, Toolbar, ListGrid, EmptyState } from '@/components/SubAppKit'
import { MessageSquare, Plus } from 'lucide-react'

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
]

function TalentCard({ talent, onContact }) {
    const verified = talent.skills?.some(s => s.verified)
    return (
        <div className="list-card" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div className="av" style={{ width: 48, height: 48, fontSize: 14, background: 'linear-gradient(135deg, var(--color-skills), var(--color-blue-500))' }}>
                    {getInitials(talent.displayName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lc-head">
                        <div>
                            <div className="title" style={{ fontSize: 16 }}>{talent.displayName}</div>
                            <div className="desc" style={{ marginTop: 2 }}>
                                {talent.skills?.[0]?.name || 'Specialist'}{talent.location ? ` · ${talent.location}` : ''}
                            </div>
                        </div>
                        <span className={`tag ${verified ? 'tag-success' : 'tag-ink'}`}>
                            {verified && <span className="tag-dot" />}{verified ? 'Verified' : 'Unverified'}
                        </span>
                    </div>
                </div>
            </div>

            <p className="desc line-clamp-2">{talent.bio}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {talent.skills?.slice(0, 4).map((s, i) => (
                    <span key={s.name + i} className="skill-chip">{s.name}</span>
                ))}
            </div>

            <div className="meta">
                <span className="mono">
                    <b style={{ color: 'var(--color-foreground)' }}>₦{formatNumber(talent.hourlyRate || 0)}/hr</b> · ★{talent.rating?.toFixed(1) || '0.0'}
                </span>
                <span>{talent.completedProjects || 0} projects done</span>
            </div>

            <button className="btn-app btn-app-skills" style={{ marginTop: 2, fontSize: 12, padding: '8px 14px' }} onClick={() => onContact?.(talent)}>
                <MessageSquare className="w-3.5 h-3.5" /> Contact
            </button>
        </div>
    )
}

export default function SkillsCanvas() {
    const { talents } = useData()
    const { isAuthenticated } = useAuth()
    const [search, setSearch] = useState('')
    const [availability, setAvailability] = useState('all')
    const [bookingTalent, setBookingTalent] = useState(null)
    const [listOpen, setListOpen] = useState(false)

    const filteredTalents = talents.filter(talent => {
        const matchesSearch = search === '' ||
            talent.displayName.toLowerCase().includes(search.toLowerCase()) ||
            talent.bio.toLowerCase().includes(search.toLowerCase()) ||
            talent.skills?.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
        const matchesAvailability = availability === 'all' || talent.availability === availability
        return matchesSearch && matchesAvailability
    })

    const avgRate = talents.length > 0
        ? Math.round(talents.reduce((sum, t) => sum + (t.hourlyRate || 0), 0) / talents.length)
        : 0
    const verifiedSkills = talents.reduce((sum, t) => sum + (t.skills?.filter(s => s.verified)?.length || 0), 0)
    const totalProjects = talents.reduce((sum, t) => sum + (t.completedProjects || 0), 0)

    const stats = [
        { k: 'Talents', v: talents.length, t: 'verified professionals' },
        { k: 'Avg hourly rate', v: `₦${formatNumber(avgRate)}`, mono: true, t: 'market rate' },
        { k: 'Verified skills', v: verifiedSkills, t: 'proven by work', tColor: 'var(--color-success)' },
        { k: 'Projects done', v: formatNumber(totalProjects), t: 'across the network' },
    ]

    return (
        <main className="py-8">
            <div className="subapp-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHead
                    app="skills"
                    glyph="S"
                    tag="Talent · Verified by work"
                    title="SkillsCanvas"
                    sub="Skills aren't self-claimed — they're verified by completed CollaBoard milestones with money attached."
                    actions={isAuthenticated && (
                        <Button variant="skillscanvas" size="lg" onClick={() => setListOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> List Your Skills
                        </Button>
                    )}
                />

                <StatRow stats={stats} />

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    placeholder="Search talents or skills…"
                    filters={FILTERS}
                    active={availability}
                    onFilter={setAvailability}
                />

                <ListGrid>
                    {filteredTalents.length > 0 ? (
                        filteredTalents.map(talent => (
                            <TalentCard key={talent.id} talent={talent} onContact={setBookingTalent} />
                        ))
                    ) : (
                        <EmptyState
                            title="No talent matches"
                            sub="Try a different search or filter — or list your own skills."
                            onClear={() => { setSearch(''); setAvailability('all') }}
                        />
                    )}
                </ListGrid>
            </div>

            {bookingTalent && (
                <BookingModal talent={bookingTalent} onClose={() => setBookingTalent(null)} />
            )}
            <ListSkillsModal open={listOpen} onClose={() => setListOpen(false)} />
        </main>
    )
}
