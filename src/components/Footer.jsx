import { Link } from 'react-router-dom'
import { Twitter, Github, Linkedin, Mail } from 'lucide-react'

const APPS = [
    { name: 'VestDen', path: '/apps/vestden' },
    { name: 'ConceptNexus', path: '/apps/conceptnexus' },
    { name: 'Collaboard', path: '/apps/collaboard' },
    { name: 'SkillsCanvas', path: '/apps/skillscanvas' }
]

const RESOURCES = [
    { name: 'Help Center', path: '/help' },
    { name: 'API Docs', path: '/developers' },
    { name: 'Blog', path: '/blog' },
    { name: 'Changelog', path: '/changelog' }
]

const COMPANY = [
    { name: 'About', path: '/about' },
    { name: 'Careers', path: '/careers' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Terms', path: '/terms' }
]

export default function Footer() {
    return (
        <footer className="bg-card border-t mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-xl">F</span>
                            </div>
                            <span className="font-bold text-2xl text-foreground">Fixars</span>
                        </Link>
                        <p className="text-muted text-sm max-w-xs mb-4">
                            The future of connected productivity. Invest, collaborate, validate ideas, and find talent—all in one ecosystem.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="#" className="p-2 rounded-full bg-muted/10 hover:bg-primary/10 hover:text-primary transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-muted/10 hover:bg-primary/10 hover:text-primary transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-muted/10 hover:bg-primary/10 hover:text-primary transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="#" className="p-2 rounded-full bg-muted/10 hover:bg-primary/10 hover:text-primary transition-colors">
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Apps */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Apps</h4>
                        <ul className="space-y-2">
                            {APPS.map(app => (
                                <li key={app.path}>
                                    <Link to={app.path} className="text-sm text-muted hover:text-primary transition-colors">
                                        {app.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Resources</h4>
                        <ul className="space-y-2">
                            {RESOURCES.map(item => (
                                <li key={item.path}>
                                    <Link to={item.path} className="text-sm text-muted hover:text-primary transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Company</h4>
                        <ul className="space-y-2">
                            {COMPANY.map(item => (
                                <li key={item.path}>
                                    <Link to={item.path} className="text-sm text-muted hover:text-primary transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted">
                        © {new Date().getFullYear()} Fixars. All rights reserved.
                    </p>
                    <p className="text-sm text-muted">
                        Built with 💜 for dreamers and doers.
                    </p>
                </div>
            </div>
        </footer>
    )
}
