import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { useData } from '@/contexts/DataContext'
import { getInitials, formatNumber } from '@/lib/utils'
import {
    Star, Shield, Award, TrendingUp,
    Lightbulb, Users, Palette, CheckCircle2,
    ArrowRight, Edit3, Loader2, MapPin
} from 'lucide-react'

/* ====================================================================
   Profile Page — Phase 2
   FCS ring gauge, stats grid, verified skills, activity history
   ==================================================================== */

// ─── FCS (Fixars Credit Score) — v2 300–850 scale ───────────────────
const FCS_MIN = 300
const FCS_MAX = 850

// Map a score to its band label + ring color.
function fcsBand(score) {
    if (score >= 800) return { label: 'Excellent', color: 'var(--color-success)' }
    if (score >= 740) return { label: 'Very good', color: 'var(--color-success)' }
    if (score >= 670) return { label: 'Good', color: 'var(--color-invest)' }
    if (score >= 580) return { label: 'Fair', color: 'var(--color-warning)' }
    return { label: 'Building', color: 'var(--color-danger)' }
}

function FCSGauge({ score }) {
    const circumference = 2 * Math.PI * 52
    const pct = Math.max(0, Math.min(1, (score - FCS_MIN) / (FCS_MAX - FCS_MIN)))
    const offset = circumference - pct * circumference
    const { color } = fcsBand(score)

    return (
        <div className="fcs-gauge">
            <svg viewBox="0 0 120 120" className="fcs-ring">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-ink-100)" strokeWidth="8" />
                <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={color}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
            </svg>
            <div className="fcs-center">
                <span className="fcs-score display">{score}</span>
                <span className="fcs-label">FCS</span>
            </div>
        </div>
    )
}

export default function ProfilePage() {
    const { user, isAuthenticated, isLoading } = useAuth()
    const { points, level, getNextLevel, LEVELS } = usePoints()
    const { stakes, ideas, boards, talents } = useData()
    const location = useLocation()

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

    // Fixars Credit Score (300–850). Falls back to a points-derived estimate
    // when the profile has no stored FCS yet.
    const fcsScore = user.fcs ?? Math.min(FCS_MAX, FCS_MIN + Math.round(points * 0.35))
    const fcsTier = fcsBand(fcsScore).label

    const profileStats = [
        { label: 'Active Stakes', value: stakes.filter(s => s.status === 'active').length, icon: TrendingUp, color: 'var(--color-invest)' },
        { label: 'Ideas Created', value: ideas.filter(i => i.creatorId === user.id).length, icon: Lightbulb, color: 'var(--color-concept)' },
        { label: 'Board Member', value: boards.filter(b => b.members.some(m => m.userId === user.id)).length, icon: Users, color: 'var(--color-collab)' },
        { label: 'Skills Listed', value: user.skills?.length || 0, icon: Palette, color: 'var(--color-skills)' },
    ]

    const skills = user.skills || [
        { name: 'React', verified: true },
        { name: 'UI/UX Design', verified: true },
        { name: 'Node.js', verified: false },
        { name: 'Product Strategy', verified: true },
        { name: 'Data Analysis', verified: false },
    ]

    const recentActivity = [
        { label: 'Staked on AI Recipe Generator', type: 'stake', time: '2 days ago' },
        { label: 'Idea "Solar Grid Network" validated', type: 'idea', time: '4 days ago' },
        { label: 'Joined board "Mobile Wellness"', type: 'board', time: '1 week ago' },
        { label: 'Skill "React" verified by peer', type: 'skill', time: '1 week ago' },
        { label: 'Earned 150 Fixars Points', type: 'reward', time: '2 weeks ago' },
    ]

    return (
        <div className="fx-profile-page">
            {/* Profile Hero */}
            <div className="profile-hero">
                <div className="profile-hero-bg" />
                <div className="profile-hero-content">
                    <div className="profile-avatar-large">
                        {getInitials(user.name)}
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-name display">{user.name}</h1>
                        <p className="profile-email">{user.email}</p>
                        <div className="profile-meta">
                            <span className="profile-meta-item"><MapPin size={13} /> Lagos, Nigeria</span>
                            <span className="profile-meta-item"><Star size={13} /> {formatNumber(points)} pts</span>
                            <span className="profile-meta-item"><Shield size={13} /> {level}</span>
                        </div>
                    </div>
                    <button className="fx-btn-outline profile-edit-btn">
                        <Edit3 size={14} /> Edit Profile
                    </button>
                </div>
            </div>

            {/* Stats + FCS Row */}
            <div className="profile-top-row">
                <div className="profile-fcs-card">
                    <FCSGauge score={fcsScore} />
                    <div className="fcs-details">
                        <span className="fcs-tier display">{fcsTier}</span>
                        <span className="fcs-range mono">300 — 850</span>
                        <p className="fcs-desc">Your Fixars Credit Score reflects your engagement, reliability, and contributions across the ecosystem.</p>
                    </div>
                </div>
                <div className="profile-stats-grid">
                    {profileStats.map(s => {
                        const Icon = s.icon
                        return (
                            <div key={s.label} className="profile-stat-card">
                                <div className="profile-stat-icon" style={{ background: s.color + '18', color: s.color }}>
                                    <Icon size={18} />
                                </div>
                                <span className="profile-stat-value display">{s.value}</span>
                                <span className="profile-stat-label">{s.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Skills + Activity */}
            <div className="profile-bottom-row">
                <div className="profile-skills-card">
                    <h3 className="profile-section-title display">Verified Skills</h3>
                    <div className="profile-skills-list">
                        {skills.map((skill, i) => (
                            <div key={i} className="profile-skill-tag" style={skill.verified ? { borderColor: 'var(--color-success)' } : {}}>
                                {skill.verified && <CheckCircle2 size={13} color="var(--color-success)" />}
                                <span>{skill.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="profile-activity-card">
                    <h3 className="profile-section-title display">Recent Activity</h3>
                    <div className="profile-activity-list">
                        {recentActivity.map((act, i) => (
                            <div key={i} className="profile-activity-row">
                                <div className="activity-dot" />
                                <div className="activity-body">
                                    <span className="activity-label">{act.label}</span>
                                    <span className="activity-time">{act.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
