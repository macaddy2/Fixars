import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { formatNumber } from '@/lib/utils'
import PageHead from '@/components/PageHead'
import { StatRow, Toolbar, ListGrid, EmptyState } from '@/components/SubAppKit'
import { Plus } from 'lucide-react'
import StakeFlowModal from '@/components/StakeFlowModal'
import CreateStakeModal from '@/components/CreateStakeModal'

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

function CampaignCard({ stake, onStake }) {
    const pct = Math.min(100, Math.round((stake.currentAmount / stake.targetAmount) * 100))
    const funded = pct >= 100 || stake.status === 'funded'
    const days = daysLeft(stake.deadline)

    return (
        <button
            className="list-card"
            onClick={() => !funded && onStake?.(stake)}
            disabled={funded}
            style={{ opacity: funded ? 0.94 : 1 }}
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
        </button>
    )
}

export default function VestDen() {
    const { stakes, makeStake } = useData()
    const { isAuthenticated, user } = useAuth()
    const { awardPoints } = usePoints()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [stakeModal, setStakeModal] = useState({ open: false, stake: null })
    const [createOpen, setCreateOpen] = useState(false)

    const handleStakeClick = useCallback((stake) => {
        if (!isAuthenticated) return
        setStakeModal({ open: true, stake })
    }, [isAuthenticated])

    const handleStakeConfirm = useCallback(async (amount) => {
        if (stakeModal.stake && user?.id) {
            await makeStake(stakeModal.stake.id, user.id, amount)
            awardPoints('MAKE_STAKE')
        }
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
            { k: 'Active stakes', v: userStakes.filter(s => s.status === 'active').length, t: 'still running' },
            { k: 'Awaiting returns', v: `₦${formatNumber(userStakes.filter(s => s.status === 'funded').reduce((sum, s) => sum + (s.stakers.find(st => st.userId === user?.id)?.amount || 0), 0))}`, mono: true, t: 'in funded deals', tColor: 'var(--color-success)' },
        ]
        : [
            { k: 'Total staked', v: `₦${formatNumber(totalStaked)}`, mono: true, t: 'deployed to founders' },
            { k: 'Active opportunities', v: activeStakes, t: 'open for backing' },
            { k: 'Avg target return', v: '3.2x', t: 'across live campaigns', tColor: 'var(--color-invest)' },
            { k: 'Backers', v: totalBackers, t: 'community investors' },
        ]

    return (
        <main className="py-8">
            <div className="subapp-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHead
                    app="invest"
                    glyph="V"
                    tag="Capital · Den of investors"
                    title="vestDen"
                    sub="Fund the validated future. From ₦5,000 to ₦5M, every stake is tracked, escrowed, and milestone-paid."
                    actions={isAuthenticated && (
                        <Button variant="vestden" size="lg" onClick={() => setCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Create Stake
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
                            <CampaignCard key={stake.id} stake={stake} onStake={handleStakeClick} />
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

            {/* Create Stake Modal */}
            <CreateStakeModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </main>
    )
}
