import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { useData } from '@/contexts/DataContext'
import { getInitials, formatNumber } from '@/lib/utils'
import { fetchPaymentHistory, formatCurrency } from '@/lib/payments'
import {
    TrendingUp,
    Lightbulb,
    Users,
    Palette,
    Star,
    ArrowRight,
    ArrowUpRight,
    Bell,
    Zap,
    Loader2,
    Wallet,
    ChevronRight,
    Sparkles
} from 'lucide-react'

/* ====================================================================
   Dashboard — Phase 2 Redesign
   Matches the Fixars design handoff:  wallet balance hero, 2×2 sub-app
   tiles, recent stakes carousel, community feed, FCS score card.
   ==================================================================== */

// ─── Sub-app Quick Tiles ────────────────────────────────────────────
function SubAppTile({ icon: Icon, name, label, color, gradient, value, to }) {
    return (
        <Link to={to} className="fx-subapp-tile" style={{ '--tile-color': color }}>
            <div className="tile-icon" style={{ background: gradient }}>
                <Icon size={22} color="white" />
            </div>
            <div className="tile-body">
                <span className="tile-name">{name}</span>
                <span className="tile-label">{label}</span>
            </div>
            <span className="tile-value display">{value}</span>
            <ChevronRight size={16} className="tile-arrow" />
        </Link>
    )
}

// ─── Wallet Balance Hero ────────────────────────────────────────────
function WalletCard({ points, level, progressToNext, nextLevel }) {
    return (
        <div className="fx-wallet-hero">
            <div className="wallet-hero-bg" />
            <div className="wallet-hero-content">
                <div className="wallet-top">
                    <div className="wallet-label">
                        <Wallet size={16} />
                        <span>Fixars Points</span>
                    </div>
                    <Link to="/wallet" className="wallet-link">
                        View Wallet <ArrowRight size={14} />
                    </Link>
                </div>
                <div className="wallet-balance display">{formatNumber(points)}</div>
                <div className="wallet-level">
                    <div className="wallet-level-labels">
                        <span className="wallet-level-current">{level}</span>
                        <span className="wallet-level-next">{nextLevel?.name || 'Max'}</span>
                    </div>
                    <div className="wallet-progress-track">
                        <div className="wallet-progress-fill" style={{ width: `${progressToNext}%` }} />
                    </div>
                    {nextLevel && (
                        <span className="wallet-level-hint">
                            {formatNumber(nextLevel.minPoints - points)} pts to {nextLevel.name}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Community Feed Card ────────────────────────────────────────────
function FeedCard({ activities }) {
    const getIcon = (type) => {
        switch (type) {
            case 'launch': return <Lightbulb size={14} style={{ color: 'var(--color-concept)' }} />
            case 'stake': return <TrendingUp size={14} style={{ color: 'var(--color-invest)' }} />
            case 'skill': return <Palette size={14} style={{ color: 'var(--color-skills)' }} />
            default: return <Zap size={14} style={{ color: 'var(--color-blue-600)' }} />
        }
    }

    return (
        <div className="fx-dash-card">
            <div className="dash-card-header">
                <h3 className="dash-card-title">Community Feed</h3>
                <div className="live-dot" />
            </div>
            <div className="dash-feed-list">
                {activities.slice(0, 5).map((act) => (
                    <div key={act.id} className="dash-feed-item">
                        <div className="feed-item-icon">{getIcon(act.type)}</div>
                        <div className="feed-item-body">
                            <p><strong>{act.user}</strong> {act.message}</p>
                            <span className="feed-item-time">
                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <Link to="/feed" className="dash-card-footer-link">
                View all activity <ArrowRight size={14} />
            </Link>
        </div>
    )
}

// ─── Recent Stakes (horizontal scroll) ──────────────────────────────
function RecentStakes({ stakes }) {
    return (
        <div className="fx-dash-card">
            <div className="dash-card-header">
                <h3 className="dash-card-title">Recent Stakes</h3>
                <Link to="/apps/vestden" className="dash-card-link">
                    View all <ArrowRight size={14} />
                </Link>
            </div>
            <div className="dash-stakes-scroll">
                {stakes.slice(0, 4).map((stake) => {
                    const pct = Math.round((stake.currentAmount / stake.targetAmount) * 100)
                    return (
                        <div key={stake.id} className="dash-stake-card">
                            <div className="stake-card-icon" style={{ background: 'linear-gradient(140deg, #10B981, #047857)' }}>
                                <TrendingUp size={18} color="white" />
                            </div>
                            <span className="stake-card-title">{stake.title}</span>
                            <div className="stake-card-bar-wrap">
                                <div className="stake-card-bar">
                                    <div className="stake-card-bar-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="stake-card-pct mono">{pct}%</span>
                            </div>
                            <span className="stake-card-amount mono">{formatNumber(stake.currentAmount)} / {formatNumber(stake.targetAmount)}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Trending Ideas ─────────────────────────────────────────────────
function TrendingIdeas({ ideas }) {
    return (
        <div className="fx-dash-card">
            <div className="dash-card-header">
                <h3 className="dash-card-title">Trending Ideas</h3>
                <Link to="/apps/conceptnexus" className="dash-card-link">
                    View all <ArrowRight size={14} />
                </Link>
            </div>
            <div className="dash-ideas-list">
                {ideas.slice(0, 3).map((idea) => (
                    <div key={idea.id} className="dash-idea-row">
                        <div className="idea-row-icon" style={{ background: 'linear-gradient(140deg, #7C3AED, #5B21B6)' }}>
                            <Lightbulb size={16} color="white" />
                        </div>
                        <div className="idea-row-body">
                            <span className="idea-row-title">{idea.title}</span>
                            <span className="idea-row-creator">{idea.creatorName}</span>
                        </div>
                        <div className="idea-row-score">
                            <span className="idea-score-value display">{idea.validationScore}%</span>
                            <span className="idea-score-label">validated</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Featured Talents ───────────────────────────────────────────────
function FeaturedTalents({ talents }) {
    return (
        <div className="fx-dash-card">
            <div className="dash-card-header">
                <h3 className="dash-card-title">Featured Talents</h3>
                <Link to="/apps/skillscanvas" className="dash-card-link">
                    Browse all <ArrowRight size={14} />
                </Link>
            </div>
            <div className="dash-talents-list">
                {talents.slice(0, 4).map((talent) => (
                    <div key={talent.id} className="dash-talent-row">
                        <div className="talent-avatar">
                            {getInitials(talent.displayName)}
                        </div>
                        <div className="talent-body">
                            <span className="talent-name">{talent.displayName}</span>
                            <span className="talent-skill">{talent.skills[0]?.name}</span>
                        </div>
                        <div className="talent-rating">
                            <Star size={12} fill="var(--color-warning)" color="var(--color-warning)" />
                            <span>{talent.rating}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═════════════════════════════════════════════════════════════════════
//  Dashboard — Main Export
// ═════════════════════════════════════════════════════════════════════
export default function Dashboard() {
    const { user, isAuthenticated, isLoading } = useAuth()
    const { points, level, getNextLevel, LEVELS } = usePoints()
    const { stakes, ideas, boards, talents, activities } = useData()
    const location = useLocation()

    // While auth is resolving, show a loader instead of redirecting — avoids
    // bouncing newly-signed-in users back to /login before the profile loads.
    if (isLoading) {
        return (
            <main className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-muted animate-spin" />
            </main>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    const nextLevel = getNextLevel(points)
    const currentLevelData = LEVELS.find(l => l.name === level) || LEVELS[0]
    const levelSpan = nextLevel ? nextLevel.minPoints - currentLevelData.minPoints : 0
    const progressToNext = nextLevel && levelSpan > 0
        ? Math.min(100, Math.max(0, ((points - currentLevelData.minPoints) / levelSpan) * 100))
        : 100

    const subApps = [
        {
            icon: TrendingUp, name: 'VestDen', label: 'Active stakes',
            color: 'var(--color-invest)', gradient: 'linear-gradient(140deg, #10B981, #047857)',
            value: stakes.filter(s => s.status === 'active').length, to: '/apps/vestden'
        },
        {
            icon: Lightbulb, name: 'ConceptNexus', label: 'My ideas',
            color: 'var(--color-concept)', gradient: 'linear-gradient(140deg, #7C3AED, #5B21B6)',
            value: ideas.filter(i => i.creatorId === user.id).length, to: '/apps/conceptnexus'
        },
        {
            icon: Users, name: 'CollaBoard', label: 'Active boards',
            color: 'var(--color-collab)', gradient: 'linear-gradient(140deg, #E87D4A, #C2410C)',
            value: boards.filter(b => b.members.some(m => m.userId === user.id)).length, to: '/apps/collaboard'
        },
        {
            icon: Palette, name: 'SkillsCanvas', label: 'Skills listed',
            color: 'var(--color-skills)', gradient: 'linear-gradient(140deg, #06B6D4, #0E7490)',
            value: user.skills?.length || 0, to: '/apps/skillscanvas'
        }
    ]

    return (
        <div className="fx-dashboard">
            {/* ── Welcome Banner ── */}
            <section className="dash-welcome">
                <div className="dash-welcome-avatar">
                    {getInitials(user.name)}
                </div>
                <div className="dash-welcome-text">
                    <h1 className="display">Welcome back, {user.name.split(' ')[0]}!</h1>
                    <p>Here's what's happening across your Fixars apps</p>
                </div>
                <div className="dash-welcome-actions">
                    <Link to="/notifications" className="fx-btn-outline">
                        <Bell size={16} /> Notifications
                    </Link>
                    <Link to="/apps" className="fx-btn-primary">
                        <Sparkles size={16} /> Explore Apps
                    </Link>
                </div>
            </section>

            {/* ── Top Row: Wallet + Sub-App Tiles ── */}
            <div className="dash-top-row">
                <WalletCard points={points} level={level} progressToNext={progressToNext} nextLevel={nextLevel} />
                <div className="dash-subapp-grid">
                    {subApps.map((app) => (
                        <SubAppTile key={app.name} {...app} />
                    ))}
                </div>
            </div>

            {/* ── Middle Row: Stakes + Trending Ideas ── */}
            <div className="dash-mid-row">
                <RecentStakes stakes={stakes} />
                <TrendingIdeas ideas={ideas} />
            </div>

            {/* ── Bottom Row: Feed + Talents ── */}
            <div className="dash-bottom-row">
                <FeedCard activities={activities} />
                <FeaturedTalents talents={talents} />
            </div>
        </div>
    )
}
