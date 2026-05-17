import { Link } from 'react-router-dom'
import { Hexagon, Users, Shield, TrendingUp, CheckCircle, Lightbulb, Zap, ArrowRight, ArrowUpRight, Check, Play } from 'lucide-react'

export default function Home() {
    return (
        <div className="splash">
            <nav className="splash-nav">
                <Link to="/" className="brand">
                    <Hexagon className="w-8 h-8 text-blue-600 fill-blue-600" />
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
                        <Link to="/dashboard" className="sa-card concept">
                            <div className="glyph">C</div>
                            <div>
                                <div className="nm">ConceptNexus</div>
                                <div className="tg">Validate ideas</div>
                            </div>
                            <div className="stat">
                                <div className="v">89</div>
                                <div className="k">Ready for vestDen</div>
                            </div>
                        </Link>
                        
                        <Link to="/dashboard" className="sa-card invest">
                            <div className="glyph">V</div>
                            <div>
                                <div className="nm">vestDen</div>
                                <div className="tg">Fund campaigns</div>
                            </div>
                            <div className="stat">
                                <div className="v">14.2%</div>
                                <div className="k">Avg Target IRR</div>
                            </div>
                        </Link>
                        
                        <Link to="/dashboard" className="sa-card collab">
                            <div className="glyph">B</div>
                            <div>
                                <div className="nm">CollaBoard</div>
                                <div className="tg">Execute sprints</div>
                            </div>
                            <div className="stat">
                                <div className="v">₦68M</div>
                                <div className="k">In Escrow</div>
                            </div>
                        </Link>
                        
                        <Link to="/dashboard" className="sa-card skills">
                            <div className="glyph">S</div>
                            <div>
                                <div className="nm">SkillsCanvas</div>
                                <div className="tg">Provable talent</div>
                            </div>
                            <div className="stat">
                                <div className="v">76%</div>
                                <div className="k">Verified Profiles</div>
                            </div>
                        </Link>
                    </div>

                    <div className="float-card fc1">
                        <div className="ic"><TrendingUp className="w-4 h-4" /></div>
                        <div>
                            <div className="t">₦25k Stake Added</div>
                            <div className="m">SolarShare Lagos</div>
                        </div>
                    </div>
                    <div className="float-card fc2">
                        <div className="ic"><Lightbulb className="w-4 h-4" /></div>
                        <div>
                            <div className="t">Idea Validated</div>
                            <div className="m">Score: 84/100</div>
                        </div>
                    </div>
                    <div className="float-card fc3">
                        <div className="ic"><Check className="w-4 h-4" /></div>
                        <div>
                            <div className="t">Milestone Done</div>
                            <div className="m">₦340k Released</div>
                        </div>
                    </div>
                </div>
            </header>

            <section id="howitworks" className="splash-section dark">
                <div className="inner">
                    <h2>How Fixars works.</h2>
                    <p className="lede">One identity. Four districts. The entire lifecycle of innovation—from whiteboard to payout—happens securely across one interconnected ecosystem.</p>
                    
                    <div className="howit-grid">
                        <div className="howit-step">
                            <div className="num">01</div>
                            <div className="glyph concept">C</div>
                            <h4>Validate</h4>
                            <p>Submit ideas to ConceptNexus. Peer reviewers and AI agents stress-test it until it's ready for funding.</p>
                        </div>
                        <div className="howit-step">
                            <div className="num">02</div>
                            <div className="glyph invest">V</div>
                            <h4>Fund</h4>
                            <p>Graduated ideas move to vestDen. Backers stake capital from ₦5,000, locked in milestone-based escrow.</p>
                        </div>
                        <div className="howit-step">
                            <div className="num">03</div>
                            <div className="glyph collab">B</div>
                            <h4>Build</h4>
                            <p>Project leads use CollaBoard to run sprints. Escrowed funds release automatically as milestones ship.</p>
                        </div>
                        <div className="howit-step">
                            <div className="num">04</div>
                            <div className="glyph skills">S</div>
                            <h4>Earn</h4>
                            <p>Talents earn verified badges on SkillsCanvas for every completed milestone. Identity, wallet, and reputation grow.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="splash-footer">
                <div className="footer-inner">
                    <div className="footer-grid">
                        <div>
                            <Link to="/" className="footer-brand">
                                <Hexagon className="w-8 h-8 text-white fill-white" />
                                <div className="nm">Fixars</div>
                            </Link>
                            <p className="footer-blurb">The operating system for African innovation. We connect ideas, capital, and talent to build the future.</p>
                            <div className="footer-socials">
                                <a aria-label="Twitter"><ArrowUpRight className="w-4 h-4" /></a>
                                <a aria-label="LinkedIn"><ArrowUpRight className="w-4 h-4" /></a>
                                <a aria-label="Discord"><ArrowUpRight className="w-4 h-4" /></a>
                            </div>
                        </div>
                        <div className="footer-col">
                            <h5>Ecosystem</h5>
                            <ul>
                                <li><a>ConceptNexus</a></li>
                                <li><a>vestDen</a></li>
                                <li><a>CollaBoard</a></li>
                                <li><a>SkillsCanvas</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Resources</h5>
                            <ul>
                                <li><a>Documentation</a></li>
                                <li><a>Whitepaper</a></li>
                                <li><a>FCS Scoring</a></li>
                                <li><a>Help Center</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h5>Company</h5>
                            <ul>
                                <li><a>About Us</a></li>
                                <li><a>Careers</a></li>
                                <li><a>Terms of Service</a></li>
                                <li><a>Privacy Policy</a></li>
                            </ul>
                        </div>
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
