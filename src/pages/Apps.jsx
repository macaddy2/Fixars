import { Link } from 'react-router-dom'
import {
    TrendingUp, Lightbulb, Users, Palette,
    ArrowRight, Sparkles, ChevronRight,
    Zap, ArrowUpRight
} from 'lucide-react'

/* ====================================================================
   Apps Hub Page — Phase 2 Redesign
   Full-width sub-app cards with gradient headers, descriptions,
   live stats, and a "How they flow together" pipeline section.
   ==================================================================== */

const APPS = [
    {
        slug: 'vestden',
        name: 'VestDen',
        tagline: 'Stake on ideas, innovations, and risks',
        description: 'Be part of the next big thing — earn returns for your vision. VestDen connects visionaries with capital, letting you stake on the projects that matter.',
        icon: TrendingUp,
        color: 'var(--color-invest)',
        gradient: 'linear-gradient(140deg, #10B981, #047857)',
        stats: [
            { label: 'Active Stakes', value: '2.4K' },
            { label: 'Total Staked', value: '₦12.8M' },
            { label: 'Avg Returns', value: '3.2x' },
        ]
    },
    {
        slug: 'conceptnexus',
        name: 'ConceptNexus',
        tagline: 'Gather, validate, and supercharge ideas',
        description: 'Build the future collaboratively. ConceptNexus is where raw ideas become validated, community-backed concepts ready for funding and execution.',
        icon: Lightbulb,
        color: 'var(--color-concept)',
        gradient: 'linear-gradient(140deg, #7C3AED, #5B21B6)',
        stats: [
            { label: 'Ideas Validated', value: '8.7K' },
            { label: 'Success Rate', value: '62%' },
            { label: 'Active Creators', value: '3.1K' },
        ]
    },
    {
        slug: 'collaboard',
        name: 'CollaBoard',
        tagline: 'Collaboration-ready sandbox for teams',
        description: 'Team up, agree, and work together on projects effortlessly. CollaBoard brings structured collaboration with task boards, milestones, and team consensus tools.',
        icon: Users,
        color: 'var(--color-collab)',
        gradient: 'linear-gradient(140deg, #E87D4A, #C2410C)',
        stats: [
            { label: 'Active Boards', value: '5.2K' },
            { label: 'Tasks Completed', value: '47K' },
            { label: 'Team Members', value: '18K' },
        ]
    },
    {
        slug: 'skillscanvas',
        name: 'SkillsCanvas',
        tagline: 'The ultimate skills and talent hub',
        description: 'Find or summon the right people for any project. SkillsCanvas matches verified talent with opportunities across the entire Fixars ecosystem.',
        icon: Palette,
        color: 'var(--color-skills)',
        gradient: 'linear-gradient(140deg, #06B6D4, #0E7490)',
        stats: [
            { label: 'Verified Talents', value: '12K+' },
            { label: 'Skills Listed', value: '340+' },
            { label: 'Matches Made', value: '8.4K' },
        ]
    }
]

const FLOW_STEPS = [
    {
        step: '01',
        title: 'Ideate',
        desc: 'Submit and validate ideas on ConceptNexus. Community scores determine viability.',
        color: 'var(--color-concept)',
        icon: Lightbulb,
    },
    {
        step: '02',
        title: 'Fund',
        desc: 'Validated ideas flow to VestDen. Stake capital on the projects you believe in.',
        color: 'var(--color-invest)',
        icon: TrendingUp,
    },
    {
        step: '03',
        title: 'Build',
        desc: 'Funded projects spin up CollaBoard workspaces. Teams collaborate with structure.',
        color: 'var(--color-collab)',
        icon: Users,
    },
    {
        step: '04',
        title: 'Staff',
        desc: 'SkillsCanvas matches verified talent to open roles. The right people, fast.',
        color: 'var(--color-skills)',
        icon: Palette,
    },
]

export default function Apps() {
    return (
        <div className="fx-apps-page">
            {/* Page Header */}
            <div className="fx-page-header">
                <div className="page-header-icon" style={{ background: 'var(--color-blue-600)', color: 'white' }}>
                    <Sparkles size={20} />
                </div>
                <div>
                    <span className="page-header-eyebrow">Ecosystem</span>
                    <h1 className="page-header-title display">All Apps</h1>
                    <p className="page-header-sub">
                        Explore the interconnected Fixars ecosystem. Each app shares your profile, points, and data seamlessly.
                    </p>
                </div>
            </div>

            {/* Sub-App Cards */}
            <div className="apps-list">
                {APPS.map((app, i) => {
                    const Icon = app.icon
                    return (
                        <Link to={`/apps/${app.slug}`} key={app.slug} className="app-full-card" style={{ '--app-color': app.color, animationDelay: `${i * 80}ms` }}>
                            <div className="app-card-gradient" style={{ background: app.gradient }}>
                                <div className="app-card-icon-wrap">
                                    <Icon size={28} color="white" />
                                </div>
                                <span className="app-card-family">Fixars · Sub-app</span>
                                <span className="app-card-name display">{app.name}</span>
                            </div>
                            <div className="app-card-body">
                                <span className="app-card-tagline">{app.tagline}</span>
                                <p className="app-card-desc">{app.description}</p>
                                <div className="app-card-stats">
                                    {app.stats.map(s => (
                                        <div key={s.label} className="app-card-stat">
                                            <span className="stat-value mono">{s.value}</span>
                                            <span className="stat-label">{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <span className="app-card-cta">
                                    Open {app.name} <ArrowUpRight size={14} />
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* How They Flow Together */}
            <section className="apps-flow-section">
                <div className="apps-flow-header">
                    <span className="page-header-eyebrow">The Pipeline</span>
                    <h2 className="apps-flow-title display">How they flow together</h2>
                    <p className="apps-flow-sub">
                        Ideas don't exist in a vacuum. Every Fixars app is a stage in the lifecycle of innovation — from spark to scale.
                    </p>
                </div>
                <div className="apps-flow-grid">
                    {FLOW_STEPS.map((step) => {
                        const Icon = step.icon
                        return (
                            <div key={step.step} className="flow-step-card">
                                <div className="flow-step-num mono" style={{ color: step.color }}>{step.step}</div>
                                <div className="flow-step-icon" style={{ background: step.color }}>
                                    <Icon size={20} color="white" />
                                </div>
                                <h3 className="flow-step-title display">{step.title}</h3>
                                <p className="flow-step-desc">{step.desc}</p>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
