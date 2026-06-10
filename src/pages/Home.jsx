import { Link } from 'react-router-dom'
import { Users, Shield, TrendingUp, Lightbulb, ArrowUpRight, Check } from 'lucide-react'

const SUBAPPS = [
    { key: 'concept', glyph: 'C', name: 'ConceptNexus', tagline: 'Validate ideas', stat: '89', statLabel: 'Ready for vestDen' },
    { key: 'invest', glyph: 'V', name: 'vestDen', tagline: 'Fund campaigns', stat: '14.2%', statLabel: 'Avg Target IRR' },
    { key: 'collab', glyph: 'B', name: 'CollaBoard', tagline: 'Execute sprints', stat: '₦68M', statLabel: 'In Escrow' },
    { key: 'skills', glyph: 'S', name: 'SkillsCanvas', tagline: 'Provable talent', stat: '76%', statLabel: 'Verified Profiles' },
]

const FLOAT_CARDS = [
    { cls: 'fc1', icon: TrendingUp, title: '₦25k Stake Added', meta: 'SolarShare Lagos' },
    { cls: 'fc2', icon: Lightbulb, title: 'Idea Validated', meta: 'Score: 84/100' },
    { cls: 'fc3', icon: Check, title: 'Milestone Done', meta: '₦340k Released' },
]

const HOW_IT_WORKS = [
    { num: '01', key: 'concept', glyph: 'C', title: 'Validate', desc: "Submit ideas to ConceptNexus. Peer reviewers and AI agents stress-test it until it's ready for funding." },
    { num: '02', key: 'invest', glyph: 'V', title: 'Fund', desc: 'Graduated ideas move to vestDen. Backers stake capital from ₦5,000, locked in milestone-based escrow.' },
    { num: '03', key: 'collab', glyph: 'B', title: 'Build', desc: 'Project leads use CollaBoard to run sprints. Escrowed funds release automatically as milestones ship.' },
    { num: '04', key: 'skills', glyph: 'S', title: 'Earn', desc: 'Talents earn verified badges on SkillsCanvas for every completed milestone. Identity, wallet, and reputation grow.' },
]

const FOOTER_COLS = [
    { heading: 'Ecosystem', links: ['ConceptNexus', 'vestDen', 'CollaBoard', 'SkillsCanvas'] },
    { heading: 'Resources', links: ['Documentation', 'Whitepaper', 'FCS Scoring', 'Help Center'] },
    { heading: 'Company', links: ['About Us', 'Careers', 'Terms of Service', 'Privacy Policy'] },
]

export default function Home() {
    return (
        <div className="splash">
            <nav className="splash-nav">
                <Link to="/" className="brand">
                    <img src="/fixars-mark.png" alt="Fixars" />
                    <div className="brand-name">Fixars</div>
                </Link>
                <div className="splash-nav-links">
                    <a href="#ecosystem">Ecosystem</a>
                    <a href="#howitworks">How it works</a>
                    <a href="#about">About</a>
                </div>
                <div className="splash-nav-cta">
                    <Link to="/dashboard" className="btn" style={{ background: 'transparent', color: 'var(--color-ink-700)', border: '1px solid transparent' }}>Sign in</Link>
                    <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
                </div>
            </nav>

            <header className="splash-hero">
                <div>
                    <h1 className="splash-h1">Your operating system<br />for African <em>innovation</em>.</h1>
                    <p className="splash-sub">Validate ideas, fund what matters, ship with verified teams. Identity, wallet, and reputation—built for the builders of tomorrow.</p>
                    
                    <div className="splash-cta">
                        <Link to="/dashboard" className="btn btn-primary">Start building</Link>
                        <a href="#howitworks" className="btn" style={{ background: 'var(--color-paper)', border: '1px solid var(--color-ink-200)', color: 'var(--color-navy-900)' }}>
                            See how it works
                        </a>
                    </div>
                    
                    <div className="trust-strip">
                        <span>
                            <div className="ic"><Users className="w-4 h-4" /></div>
                            50K+ Active Users
                        </span>
                        <span>
                            <div className="ic"><Shield className="w-4 h-4" /></div>
                            Bank-grade Escrow
                        </span>
                    </div>
                    
                    <div className="splash-stats">
                        <div>
                            <div className="v">₦142M</div>
                            <div className="k">Capital Deployed</div>
                        </div>
                        <div>
                            <div className="v">1,240</div>
                            <div className="k">Ideas in Motion</div>
                        </div>
                        <div>
                            <div className="v">208</div>
                            <div className="k">Active Sprints</div>
                        </div>
                    </div>
                </div>

                <div className="splash-visual">
                    <div className="subapp-2x2">
                        {SUBAPPS.map((app) => (
                            <Link key={app.key} to="/dashboard" className={`sa-card ${app.key}`}>
                                <div className="glyph">{app.glyph}</div>
                                <div>
                                    <div className="nm">{app.name}</div>
                                    <div className="tg">{app.tagline}</div>
                                </div>
                                <div className="stat">
                                    <div className="v">{app.stat}</div>
                                    <div className="k">{app.statLabel}</div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {FLOAT_CARDS.map((card) => (
                        <div key={card.cls} className={`float-card ${card.cls}`}>
                            <div className="ic"><card.icon className="w-4 h-4" /></div>
                            <div>
                                <div className="t">{card.title}</div>
                                <div className="m">{card.meta}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </header>

            <section id="howitworks" className="splash-section dark">
                <div className="inner">
                    <h2>How Fixars works.</h2>
                    <p className="lede">One identity. Four districts. The entire lifecycle of innovation—from whiteboard to payout—happens securely across one interconnected ecosystem.</p>
                    
                    <div className="howit-grid">
                        {HOW_IT_WORKS.map((step) => (
                            <div key={step.num} className="howit-step">
                                <div className="num">{step.num}</div>
                                <div className={`glyph ${step.key}`}>{step.glyph}</div>
                                <h4>{step.title}</h4>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="splash-footer">
                <div className="footer-inner">
                    <div className="footer-grid">
                        <div>
                            <Link to="/" className="footer-brand">
                                <img src="/fixars-mark.png" alt="Fixars" />
                                <div className="nm">Fixars</div>
                            </Link>
                            <p className="footer-blurb">The operating system for African innovation. We connect ideas, capital, and talent to build the future.</p>
                            <div className="footer-socials">
                                <a aria-label="Twitter"><ArrowUpRight className="w-4 h-4" /></a>
                                <a aria-label="LinkedIn"><ArrowUpRight className="w-4 h-4" /></a>
                                <a aria-label="Discord"><ArrowUpRight className="w-4 h-4" /></a>
                            </div>
                        </div>
                        {FOOTER_COLS.map((col) => (
                            <div key={col.heading} className="footer-col">
                                <h5>{col.heading}</h5>
                                <ul>
                                    {col.links.map((link) => (
                                        <li key={link}><a>{link}</a></li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="footer-bot">
                        <div>© 2026 Fixars, Inc. All rights reserved.</div>
                        <div>Built for Africa.</div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
