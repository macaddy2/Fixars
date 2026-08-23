import { useState } from 'react'
import BookingModal from '@/components/BookingModal'
import ListSkillsModal from '@/components/ListSkillsModal'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, formatNumber } from '@/lib/utils'
import PageHead from '@/components/PageHead'
import { StatRow, Toolbar, ListGrid, EmptyState } from '@/components/SubAppKit'
import { MessageSquare, Plus, Download } from 'lucide-react'

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

function TalentTable({ talents, onContact }) {
    const STATUS_META = {
        available: ['Available', 'var(--color-success)'],
        busy: ['On project', 'var(--color-warning)'],
        off: ['Unavailable', 'var(--color-ink-400)']
    }

    return (
        <div className="table-wrap">
            <div className="table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Talent profile</th>
                            <th>Verification tier</th>
                            <th>Status</th>
                            <th>Rate</th>
                            <th>Rating</th>
                            <th>Done</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {talents.map(t => {
                            const verified = t.skills?.some(s => s.verified)
                            const statusKey = t.availability === 'full-time' ? 'available' : t.availability === 'part-time' ? 'busy' : 'available'
                            const [statusLbl, statusColor] = STATUS_META[statusKey] || STATUS_META.available

                            return (
                                <tr key={t.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className="av" style={{ width: 36, height: 36, fontSize: 12, background: 'linear-gradient(135deg, var(--color-skills), var(--color-blue-500))' }}>
                                                {getInitials(t.displayName)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{t.displayName}</div>
                                                <div style={{ fontSize: 11, color: 'var(--color-ink-400)', marginTop: 1 }}>
                                                    {t.skills?.[0]?.name || 'Specialist'}{t.location ? ` · ${t.location}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`tag ${verified ? 'tag-success' : 'tag-ink'}`}>
                                            {verified && <span className="tag-dot" />}{verified ? 'Ecosystem-proven' : 'Self-reported'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="status-cell" style={{ color: statusColor }}>
                                            <span className="sd" />{statusLbl}
                                        </span>
                                    </td>
                                    <td className="mono" style={{ fontWeight: 600 }}>₦{formatNumber(t.hourlyRate || 0)}/hr</td>
                                    <td className="mono">★{t.rating?.toFixed(1) || '0.0'}</td>
                                    <td className="mono" style={{ color: 'var(--color-ink-500)' }}>{t.completedProjects || 0}</td>
                                    <td>
                                        <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => onContact?.(t)}>
                                            Contact
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <div className="table-foot">
                <span>Showing <b className="mono" style={{ color: 'var(--color-ink-900)' }}>1–{talents.length}</b> of <b className="mono" style={{ color: 'var(--color-ink-900)' }}>{talents.length}</b> talents</span>
                <span className="pg">
                    <button className="cur">1</button>
                </span>
            </div>
        </div>
    )
}

export default function SkillsCanvas() {
    const { talents } = useData()
    const { isAuthenticated } = useAuth()
    const [search, setSearch] = useState('')
    const [availability, setAvailability] = useState('all')
    const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'
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

    const handleExport = () => {
        alert('Talent directory exported as CSV')
    }

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
                    extra={(
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
                            <div className="segment" role="tablist">
                                <button
                                    role="tab"
                                    aria-selected={viewMode === 'cards'}
                                    className={viewMode === 'cards' ? 'active' : ''}
                                    onClick={() => setViewMode('cards')}
                                >
                                    Cards
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={viewMode === 'table'}
                                    className={viewMode === 'table' ? 'active' : ''}
                                    onClick={() => setViewMode('table')}
                                >
                                    Table
                                </button>
                            </div>
                            <button className="btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={handleExport}>
                                <Download size={13} /> Export
                            </button>
                        </div>
                    )}
                />

                {filteredTalents.length > 0 ? (
                    viewMode === 'cards' ? (
                        <ListGrid>
                            {filteredTalents.map(talent => (
                                <TalentCard key={talent.id} talent={talent} onContact={setBookingTalent} />
                            ))}
                        </ListGrid>
                    ) : (
                        <TalentTable talents={filteredTalents} onContact={setBookingTalent} />
                    )
                ) : (
                    <EmptyState
                        title="No talent matches"
                        sub="Try a different search or filter — or list your own skills."
                        onClear={() => { setSearch(''); setAvailability('all') }}
                    />
                )}
            </div>

            {bookingTalent && (
                <BookingModal talent={bookingTalent} onClose={() => setBookingTalent(null)} />
            )}
            <ListSkillsModal open={listOpen} onClose={() => setListOpen(false)} />
        </main>
    )
}

