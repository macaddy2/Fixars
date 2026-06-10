import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import AIRecommendations from '@/components/AIRecommendations'
import SubmitIdeaModal from '@/components/SubmitIdeaModal'
import PageHead from '@/components/PageHead'
import { StatRow, Toolbar, ListGrid, EmptyState } from '@/components/SubAppKit'
import {
    ThumbsUp, ThumbsDown, Plus, Sparkles, ExternalLink,
} from 'lucide-react'

const STATUS_TAG = {
    validated: { cls: 'tag-success', label: 'Validated' },
    validating: { cls: 'tag-warning', label: 'In Validation' },
    submitted: { cls: 'tag-ink', label: 'Submitted' },
}

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'validating', label: 'In Validation' },
    { value: 'validated', label: 'Validated' },
]

function IdeaCard({ idea, onVote }) {
    const { isAuthenticated, user } = useAuth()
    const { launchProjectFromIdea } = useData()
    const totalVotes = idea.votes.up + idea.votes.down
    const tag = STATUS_TAG[idea.status] || STATUS_TAG.submitted

    return (
        <div className="list-card" style={{ cursor: 'default' }}>
            <div className="lc-head">
                <span className={`tag ${tag.cls}`}><span className="tag-dot" />{tag.label}</span>
                <span className="lc-mono">Score <b style={{ color: 'var(--color-foreground)' }}>{idea.validationScore}</b>/100</span>
            </div>
            <div className="title">{idea.title}</div>
            <p className="desc line-clamp-2">{idea.description}</p>
            <div className="progress">
                <div style={{ width: `${idea.validationScore}%`, background: 'var(--color-concept)' }} />
            </div>
            <div className="meta">
                <span>by <b style={{ color: 'var(--color-foreground)' }}>{idea.creatorName}</b></span>
                <span><span className="stat-num">{totalVotes}</span> reviewers</span>
            </div>

            {/* Inline actions */}
            <div className="flex items-center gap-2 pt-1">
                <button
                    className="flex items-center gap-1.5 text-sm font-medium text-success hover:bg-success/10 rounded-md px-2 py-1 disabled:opacity-50"
                    onClick={() => isAuthenticated && onVote?.(idea.id, 'up')}
                    disabled={!isAuthenticated}
                >
                    <ThumbsUp className="w-4 h-4" /> {idea.votes.up}
                </button>
                <button
                    className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md px-2 py-1 disabled:opacity-50"
                    onClick={() => isAuthenticated && onVote?.(idea.id, 'down')}
                    disabled={!isAuthenticated}
                >
                    <ThumbsDown className="w-4 h-4" /> {idea.votes.down}
                </button>
                <div className="ml-auto flex items-center gap-2">
                    {idea.status === 'validated' && !idea.linkedBoardId && (
                        <button
                            className="btn-app btn-app-concept text-xs px-3 py-1.5"
                            onClick={() => launchProjectFromIdea(idea, user.id, user.name)}
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Launch Project
                        </button>
                    )}
                    {idea.linkedBoardId && (
                        <Link to={`/apps/collaboard?boardId=${idea.linkedBoardId}`} className="btn-ghost text-xs">
                            <ExternalLink className="w-3.5 h-3.5" /> On CollaBoard
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ConceptNexus() {
    const { ideas, voteIdea } = useData()
    const { user, isAuthenticated } = useAuth()
    const { awardPoints } = usePoints()
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [submitOpen, setSubmitOpen] = useState(false)

    const handleVote = (ideaId, vote) => {
        voteIdea(ideaId, user.id, vote)
        awardPoints('VALIDATE_IDEA')
    }

    const filteredIdeas = ideas.filter(idea => {
        const matchesSearch = idea.title.toLowerCase().includes(search.toLowerCase()) ||
            idea.description.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = status === 'all' || idea.status === status
        return matchesSearch && matchesStatus
    })

    const validatedCount = ideas.filter(i => i.status === 'validated').length
    const validatingCount = ideas.filter(i => i.status === 'validating').length
    const totalVotes = ideas.reduce((sum, i) => sum + i.votes.up + i.votes.down, 0)

    const stats = [
        { k: 'Total ideas', v: ideas.length, t: 'in the nexus' },
        { k: 'Validated', v: validatedCount, t: 'ready to fund', tColor: 'var(--color-success)' },
        { k: 'In validation', v: validatingCount, t: 'gathering signal', tColor: 'var(--color-concept)' },
        { k: 'Community votes', v: totalVotes, t: 'peer reviews cast' },
    ]

    return (
        <main className="py-8">
            <div className="subapp-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHead
                    app="concept"
                    glyph="C"
                    tag="Idea validation"
                    title="ConceptNexus"
                    sub="Where African innovation gets stress-tested before it gets funded."
                    actions={isAuthenticated && (
                        <Button variant="conceptnexus" size="lg" onClick={() => setSubmitOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Submit Idea
                        </Button>
                    )}
                />

                <StatRow stats={stats} />

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    placeholder="Search ideas…"
                    filters={FILTERS}
                    active={status}
                    onFilter={setStatus}
                />

                <ListGrid>
                    {filteredIdeas.length > 0 ? (
                        filteredIdeas.map(idea => (
                            <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />
                        ))
                    ) : (
                        <EmptyState
                            title="No ideas match"
                            sub="Try a different search or filter — or submit the first one."
                            onClear={() => { setSearch(''); setStatus('all') }}
                        />
                    )}
                </ListGrid>

                {/* AI recommendations */}
                <section className="mt-8">
                    <AIRecommendations />
                </section>
            </div>

            <SubmitIdeaModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
        </main>
    )
}
