import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { formatNumber } from '@/lib/utils'
import { isVestDenStakingEnabled } from '@/lib/features'
import PageHead from '@/components/PageHead'
import { StatRow, Toolbar, ListGrid, EmptyState } from '@/components/SubAppKit'
import { Plus, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react'
import StakeFlowModal from '@/components/StakeFlowModal'
import CreateStakeModal from '@/components/CreateStakeModal'
import MilestonesPanel from './MilestonesPanel'

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'funding', label: 'Funding now' },
    { value: 'closing', label: 'Closing soon' },
    { value: 'funded', label: 'Funded' },
    { value: 'portfolio', label: 'My Portfolio' },
]

function daysLeft(deadline) {
    if (!deadline) return null
    const d = Math.ceil((new Date(deadline) - new Date()) / 86400000)
    return d > 0 ? d : 0
}

function CampaignCard({ stake, onStake, onCreateBoard, onMilestones }) {
    const pct = Math.min(100, Math.round((stake.currentAmount / stake.targetAmount) * 100))
    const funded = pct >= 100 || stake.status === 'funded'
    const days = daysLeft(stake.deadline)

    return (
        <div
            className="list-card"
            style={{ opacity: funded ? 0.96 : 1, cursor: 'default' }}
        >
            <div className="lc-head">
                <span className={`tag ${funded ? 'tag-success' : 'tag-invest'}`}>
                    <span className="tag-dot" />{funded ? 'Fully funded' : 'Funding now'}
                </span>
                <span className="lc-mono">{funded ? 'Closed' : `${days} days left`}</span>
            </div>
            <div className="title">{stake.title}</div>
            <p className="desc line-clamp-2">{stake.description}</p>
            <div>
                <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>
                    <span>Funded</span>
                    <span><b className="stat-num">₦{formatNumber(stake.currentAmount)}</b> / ₦{formatNumber(stake.targetAmount)} · {pct}%</span>
                </div>
                <div className="progress"><div style={{ width: `${pct}%`, background: 'var(--color-invest)' }} /></div>
            </div>
            <div className="meta">
                <span><b style={{ color: 'var(--color-invest)' }}>{stake.expectedReturns}</b> target return</span>
                <span>{stake.stakers.length} backers</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t mt-1">
                {!funded ? (
                    <button
                        className="btn-app btn-app-invest text-xs px-3 py-1.5 w-full justify-center"
                        onClick={() => onStake?.(stake)}
                    >
                        View campaign
                    </button>
                ) : (
                    <div className="flex items-center justify-between w-full gap-2">
                        <button
                            className="btn-app btn-app-invest text-xs px-3 py-1.5 flex-1 justify-center"
                            onClick={() => onMilestones?.(stake)}
                        >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" /> Milestones
                        </button>
                        {stake.linkedBoardId ? (
                            <Link to={`/apps/collaboard?boardId=${stake.linkedBoardId}`} className="btn-ghost text-xs whitespace-nowrap">
                                <ExternalLink className="w-3.5 h-3.5 mr-1 inline" /> Room
                            </Link>
                        ) : (
                            <button
                                className="btn-app btn-app-collab text-xs px-3 py-1.5 whitespace-nowrap"
                                onClick={() => onCreateBoard?.(stake)}
                            >
                                <Sparkles className="w-3.5 h-3.5 mr-1 inline" /> Board
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function VestDenHibernated() {
    return (
        <main className="py-8">
            <div className="subapp-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHead
                    app="invest"
                    glyph="V"
                    tag="Not available"
                    title="vestDen"
                    sub="Hibernated prototype. Not a live-money path and not a stake or invest surface."
                />
                <EmptyState
                    title="Staking is not available"
                    sub="This build does not accept stakes or solicit investment. The naira wallet stays a dummy balance and is not a live-money path."
                />
            </div>
        </main>
    )
}

function VestDenLive() {
    const { stakes, makeStake, createBoard, logActivity } = useData()
    const { isAuthenticated, user } = useAuth()
    const { awardPoints } = usePoints()
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [stakeModal, setStakeModal] = useState({ open: false, stake: null })
    const [createOpen, setCreateOpen] = useState(false)
    const [milestonesPanel, setMilestonesPanel] = useState({ open: false, stake: null })

    const handleCreateBoard = useCallback(async (stake) => {
        if (!isAuthenticated || !user) return
        const newBoard = await createBoard({
            title: stake.title,
            description: `Execution board for funded campaign: ${stake.description}`,
            creatorId: user.id,
            members: [{ userId: user.id, role: 'owner', name: user.name }]
        })
        logActivity('launch', user.name, `created execution board for ${stake.title}`, 'collaboard')
        navigate(`/apps/collaboard?boardId=${newBoard.id}`)
    }, [createBoard, isAuthenticated, user, navigate, logActivity])

    const handleStakeClick = useCallback((stake) => {
        if (!isAuthenticated || !isVestDenStakingEnabled()) return
        setStakeModal({ open: true, stake })
    }, [isAuthenticated])

    // Returns true when the stake was persisted, false otherwise — the wallet
    // is only debited when this resolves truthy (see StakeFlowModal).
    const handleStakeConfirm = useCallback(async (amount) => {
        if (!stakeModal.stake || !user?.id) return false
        try {
            await makeStake(stakeModal.stake.id, user.id, amount)
        } catch (err) {
            console.error('Stake failed:', err)
            return false
        }
        awardPoints('MAKE_STAKE')
        return true
    }, [stakeModal, user, makeStake, awardPoints])

    const userStakes = stakes.filter(s => s.stakers.some(st => st.userId === user?.id))

    const matchesFilter = (stake) => {
        const pct = (stake.currentAmount / stake.targetAmount) * 100
        if (filter === 'funding') return pct < 100
        if (filter === 'closing') return pct < 100 && (daysLeft(stake.deadline) ?? 99) <= 14
        if (filter === 'funded') return pct >= 100 || stake.status === 'funded'
        return true
    }

    const source = filter === 'portfolio' ? userStakes : stakes
    const visible = source.filter(stake => {
        const matchesSearch = stake.title.toLowerCase().includes(search.toLowerCase()) ||
            stake.description.toLowerCase().includes(search.toLowerCase())
        return matchesSearch && (filter === 'portfolio' || matchesFilter(stake))
    })

    const totalStaked = stakes.reduce((sum, s) => sum + s.currentAmount, 0)
    const activeStakes = stakes.filter(s => s.status === 'active').length
    const totalBackers = stakes.reduce((sum, s) => sum + s.stakers.length, 0)
    const portfolioTotal = userStakes.reduce((sum, s) => sum + (s.stakers.find(st => st.userId === user?.id)?.amount || 0), 0)

    const stats = filter === 'portfolio'
        ? [
            { k: 'Managed capital', v: `₦${formatNumber(portfolioTotal)}`, mono: true, t: 'across your stakes', tColor: 'var(--color-invest)' },
            { k: 'Staked projects', v: userStakes.length, t: 'in your portfolio' },
            { k: 'Open items', v: userStakes.filter(s => s.status === 'active').length, t: 'still running' },
            { k: 'Awaiting returns', v: `₦${formatNumber(userStakes.filter(s => s.status === 'funded').reduce((sum, s) => sum + (s.stakers.find(st => st.userId === user?.id)?.amount || 0), 0))}`, mono: true, t: 'in funded deals', tColor: 'var(--color-success)' },
        ]
        : [
            { k: 'Prototype tally', v: `₦${formatNumber(totalStaked)}`, mono: true, t: 'dummy figures only' },
            { k: 'Open items', v: activeStakes, t: 'gated prototype surface' },
            { k: 'Prototype note', v: '—', t: 'not a live-money path', tColor: 'var(--color-invest)' },
            { k: 'Participants', v: totalBackers, t: 'dummy figures only' },
        ]

    return (
        <main className="py-8">
            <div className="subapp-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHead
                    app="invest"
                    glyph="V"
                    tag="Prototype · gated"
                    title="vestDen"
                    sub="Gated prototype surface. Not a live-money path. This build does not solicit stakes or investment."
                    actions={isAuthenticated && (
                        <Button variant="vestden" size="lg" onClick={() => setCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> New campaign
                        </Button>
                    )}
                />

                <StatRow stats={stats} />

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    placeholder="Search campaigns…"
                    filters={FILTERS}
                    active={filter}
                    onFilter={setFilter}
                />

                <ListGrid>
                    {visible.length > 0 ? (
                        visible.map(stake => (
                            <CampaignCard key={stake.id} stake={stake} onStake={handleStakeClick} onCreateBoard={handleCreateBoard} onMilestones={(s) => setMilestonesPanel({ open: true, stake: s })} />
                        ))
                    ) : (
                        <EmptyState
                            title={filter === 'portfolio' ? 'Portfolio empty' : 'No campaigns match'}
                            sub={filter === 'portfolio' ? "You haven't staked on any campaigns yet." : 'Try a different search or filter.'}
                            onClear={() => { setSearch(''); setFilter('all') }}
                        />
                    )}
                </ListGrid>
            </div>

            {/* Wallet-based Stake Flow */}
            {stakeModal.open && (
                <StakeFlowModal
                    campaign={stakeModal.stake}
                    onClose={() => setStakeModal({ open: false, stake: null })}
                    onConfirm={handleStakeConfirm}
                />
            )}

            {/* Gated campaign modal */}
            <CreateStakeModal open={createOpen} onClose={() => setCreateOpen(false)} />
            {milestonesPanel.open && milestonesPanel.stake && (
                <MilestonesPanel campaign={milestonesPanel.stake} onClose={() => setMilestonesPanel({ open: false, stake: null })} />
            )}
        </main>
    )
}

export default function VestDen() {
    return isVestDenStakingEnabled() ? <VestDenLive /> : <VestDenHibernated />
}
