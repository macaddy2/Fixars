import Hero from '@/components/Hero'
import { AppList } from '@/components/AppCard'
import HowItWorks from '@/components/HowItWorks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import { Mail, CheckCircle, Star, Users, Zap } from 'lucide-react'

const TESTIMONIALS = [
    {
        name: 'Sarah Chen',
        role: 'Entrepreneur',
        content: 'Fixars transformed how I validate and fund my ideas. The interconnected ecosystem means I can go from concept to funded project in days.',
        rating: 5
    },
    {
        name: 'Marcus Williams',
        role: 'Product Designer',
        content: 'SkillsCanvas helped me find my dream clients. The points system keeps me engaged across all the apps!',
        rating: 5
    },
    {
        name: 'Emily Rodriguez',
        role: 'Startup Founder',
        content: 'Collaboard + ConceptNexus is a game-changer for remote teams. We validated 3 product ideas in one month.',
        rating: 5
    }
]

export default function Home() {
    const [email, setEmail] = useState('')
    const [subscribed, setSubscribed] = useState(false)

    const handleSubscribe = (e) => {
        e.preventDefault()
        if (email) {
            setSubscribed(true)
            setTimeout(() => setSubscribed(false), 3000)
            setEmail('')
        }
    }

    return (
        <main>
            <Hero />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <AppList />
            </div>

            <HowItWorks />

            {/* Stats Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl gradient-primary p-10 text-white">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                            <div>
                                <Users className="w-8 h-8 mx-auto mb-3 opacity-80" />
                                <p className="text-4xl font-bold mb-1">50K+</p>
                                <p className="text-white/70">Active Users</p>
                            </div>
                            <div>
                                <Zap className="w-8 h-8 mx-auto mb-3 opacity-80" />
                                <p className="text-4xl font-bold mb-1">$2.5M</p>
                                <p className="text-white/70">Total Staked</p>
                            </div>
                            <div>
                                <Star className="w-8 h-8 mx-auto mb-3 opacity-80" />
                                <p className="text-4xl font-bold mb-1">15K+</p>
                                <p className="text-white/70">Ideas Validated</p>
                            </div>
                            <div>
                                <CheckCircle className="w-8 h-8 mx-auto mb-3 opacity-80" />
                                <p className="text-4xl font-bold mb-1">8K+</p>
                                <p className="text-white/70">Projects Completed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 bg-muted/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Loved by Creators</h2>
                        <p className="text-muted">See what our community is saying</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, i) => (
                            <Card key={t.name} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                <CardContent className="p-6">
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(t.rating)].map((_, j) => (
                                            <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                                        ))}
                                    </div>
                                    <p className="text-foreground mb-4">"{t.content}"</p>
                                    <div>
                                        <p className="font-semibold text-foreground">{t.name}</p>
                                        <p className="text-sm text-muted">{t.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="grid lg:grid-cols-2">
                                <div className="p-8 lg:p-12">
                                    <h2 className="text-2xl font-bold text-foreground mb-4">Stay in the loop</h2>
                                    <p className="text-muted mb-6">
                                        Get updates on new features, app launches, and tips to maximize your Fixars experience.
                                    </p>

                                    <form onSubmit={handleSubscribe} className="flex gap-3">
                                        <div className="relative flex-1">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                            <Input
                                                type="email"
                                                placeholder="your@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" disabled={subscribed}>
                                            {subscribed ? (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Subscribed!
                                                </>
                                            ) : 'Subscribe'}
                                        </Button>
                                    </form>
                                </div>
                                <div className="hidden lg:block gradient-primary" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </main>
    )
}
