import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const FEATURES = [
    { icon: Zap, label: 'Lightning Fast' },
    { icon: Shield, label: 'Secure' },
    { icon: Globe, label: 'Connected' }
]

export default function Hero() {
    const { isAuthenticated } = useAuth()

    return (
        <section className="relative overflow-hidden py-20 lg:py-28">
            {/* Background decorations */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left content */}
                    <div className="text-center lg:text-left">
                        <Badge variant="secondary" className="mb-4 gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            The future of productivity
                        </Badge>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                            One Platform,{' '}
                            <span className="text-transparent bg-clip-text gradient-primary">
                                Endless Possibilities
                            </span>
                        </h1>

                        <p className="text-lg text-muted mb-8 max-w-xl mx-auto lg:mx-0">
                            Invest in ideas, validate concepts, collaborate seamlessly, and connect with top talent—all interconnected under the Fixars ecosystem.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                            {isAuthenticated ? (
                                <Link to="/dashboard">
                                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                                        Go to Dashboard <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link to="/signup">
                                        <Button size="lg" className="gap-2 w-full sm:w-auto">
                                            Get Started Free <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                    <Link to="/apps">
                                        <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                            Explore Apps
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-6 justify-center lg:justify-start">
                            {FEATURES.map(({ icon: Icon, label }) => (
                                <div key={label} className="flex items-center gap-2 text-sm text-muted">
                                    <Icon className="w-4 h-4 text-accent" />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right visual */}
                    <div className="relative hidden lg:block">
                        <div className="relative z-10">
                            {/* Main card */}
                            <div className="bg-card rounded-3xl shadow-2xl border p-8 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* App previews */}
                                    <div className="rounded-2xl gradient-vestden p-4 text-white">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                            <span className="font-bold">ID</span>
                                        </div>
                                        <h4 className="font-semibold mb-1">VestDen</h4>
                                        <p className="text-sm text-white/80">2.4K active stakes</p>
                                    </div>
                                    <div className="rounded-2xl gradient-conceptnexus p-4 text-white">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                            <span className="font-bold">CN</span>
                                        </div>
                                        <h4 className="font-semibold mb-1">ConceptNexus</h4>
                                        <p className="text-sm text-white/80">8.7K ideas validated</p>
                                    </div>
                                    <div className="rounded-2xl gradient-collaboard p-4 text-white">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                            <span className="font-bold">CB</span>
                                        </div>
                                        <h4 className="font-semibold mb-1">Collaboard</h4>
                                        <p className="text-sm text-white/80">5.2K active boards</p>
                                    </div>
                                    <div className="rounded-2xl gradient-skillscanvas p-4 text-white">
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                                            <span className="font-bold">SC</span>
                                        </div>
                                        <h4 className="font-semibold mb-1">SkillsCanvas</h4>
                                        <p className="text-sm text-white/80">12K+ talents</p>
                                    </div>
                                </div>

                                {/* Stats bar */}
                                <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">50K+</p>
                                        <p className="text-sm text-muted">Users</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">$2M+</p>
                                        <p className="text-sm text-muted">Staked</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">10K+</p>
                                        <p className="text-sm text-muted">Projects</p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-6 -right-6 bg-card rounded-2xl shadow-lg border p-4 animate-slide-in">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">New stake funded!</p>
                                        <p className="text-xs text-muted">AI Recipe App • $15K</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-4 -left-6 bg-card rounded-2xl shadow-lg border p-4 animate-slide-in" style={{ animationDelay: '200ms' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Idea validated!</p>
                                        <p className="text-xs text-muted">Solar Grid Network • 82%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
