import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Lightbulb, Users, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const APPS = [
    {
        slug: 'vestden',
        name: 'VestDen',
        description: 'Stake on ideas, innovations, and risks. Be part of the next big thing—earn returns for your vision.',
        icon: TrendingUp,
        color: 'vestden',
        gradient: 'gradient-vestden',
        stats: { label: 'Active Stakes', value: '2.4K' }
    },
    {
        slug: 'conceptnexus',
        name: 'ConceptNexus',
        description: 'Gather, validate, and supercharge ideas and impact projects. Build the future collaboratively.',
        icon: Lightbulb,
        color: 'conceptnexus',
        gradient: 'gradient-conceptnexus',
        stats: { label: 'Ideas Validated', value: '8.7K' }
    },
    {
        slug: 'collaboard',
        name: 'Collaboard',
        description: 'Collaboration-ready sandbox. Team up, agree, and work together on projects effortlessly.',
        icon: Users,
        color: 'collaboard',
        gradient: 'gradient-collaboard',
        stats: { label: 'Active Boards', value: '5.2K' }
    },
    {
        slug: 'skillscanvas',
        name: 'SkillsCanvas',
        description: 'The ultimate skills and talent hub. Find or summon the right people for any project.',
        icon: Palette,
        color: 'skillscanvas',
        gradient: 'gradient-skillscanvas',
        stats: { label: 'Talents', value: '12K+' }
    }
]

export function AppCard({ app, index }) {
    const Icon = app.icon

    return (
        <Link to={`/apps/${app.slug}`}>
            <Card className={cn(
                "group relative overflow-hidden cursor-pointer h-full",
                "hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            )}
                style={{ animationDelay: `${index * 100}ms` }}
            >
                {/* Gradient accent top */}
                <div className={cn("h-1.5 w-full", app.gradient)} />

                <CardContent className="p-6">
                    {/* Icon */}
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                        app.gradient
                    )}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                        {app.name}
                    </h3>
                    <p className="text-sm text-muted mb-4 line-clamp-2">
                        {app.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between">
                        <Badge variant={app.color} className="font-medium">
                            {app.stats.value} {app.stats.label}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}

export function AppList({ showAll = false }) {
    const apps = showAll ? APPS : APPS.slice(0, 4)

    return (
        <section className="py-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Explore Apps</h2>
                    <p className="text-muted">Interconnected tools for modern productivity</p>
                </div>
                {!showAll && (
                    <Link to="/apps">
                        <Button variant="outline" className="gap-2">
                            View All <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {apps.map((app, i) => (
                    <AppCard key={app.slug} app={app} index={i} />
                ))}
            </div>
        </section>
    )
}

export { APPS }
