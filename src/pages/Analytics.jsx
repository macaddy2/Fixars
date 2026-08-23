import { useState, useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { usePoints } from '@/contexts/PointsContext'
import { useSocial } from '@/contexts/SocialContext'
import { isVestDenStakingEnabled } from '@/lib/features'
import StatCard from '@/components/charts/StatCard'
import MiniChart from '@/components/charts/MiniChart'
import ActivityHeatmap from '@/components/charts/ActivityHeatmap'
import { formatNumber } from '@/lib/utils'
import {
    BarChart3,
    TrendingUp,
    Lightbulb,
    Users,
    Palette,
    Star,
    MessageCircle,
    Zap,
    Award,
    Eye,
    Loader2
} from 'lucide-react'

export default function Analytics() {
    const { isAuthenticated, isLoading } = useAuth()
    const { stakes, ideas, boards, talents, activities } = useData()
    const { points, history } = usePoints()
    const { posts } = useSocial()
    const [timeRange, setTimeRange] = useState('30d')
    const location = useLocation()

    const totalStaked = stakes.reduce((sum, s) => sum + s.currentAmount, 0)
    const totalTasks = boards.reduce((sum, b) =>
        sum + b.columns.reduce((cs, c) => cs + c.tasks.length, 0), 0
    )

    // ── Real series where we have data; stable pseudo-series where we don't ──
    const sparklines = useMemo(() => {
        const gen = (base, variance, len = 7) =>
            Array.from({ length: len }, () =>
                Math.max(1, Math.round(base + (((Math.imul(base || 7, 2654435761) >>> 8) % Math.max(1, variance)))))
            )

        // Points progression: cumulative from the real history ledger (12 buckets)
        let progression = []
        if (history.length > 0) {
            const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            const bucketSize = Math.max(1, Math.ceil(sorted.length / 12))
            progression = []
            let running = 0
            for (let i = 0; i < sorted.length; i++) {
                running += sorted[i].points || 0
                if ((i + 1) % bucketSize === 0 || i === sorted.length - 1) {
                    progression.push(Math.max(0, running))
                }
            }
            while (progression.length < 12) progression.unshift(progression[0] ?? 0)
            progression = progression.slice(-12)
        }

        // Engagement: posts per day over the last 12 days (real feed data)
        let engagement = []
        if (posts.length > 0) {
            const dayKey = (d) => d.toISOString().slice(0, 10)
            const today = new Date()
            engagement = Array.from({ length: 12 }, (_, i) => {
                const day = dayKey(new Date(today.getTime() - (11 - i) * 86400000))
                return posts.filter(p => p.createdAt?.slice(0, 10) === day).length
            })
        }

        return {
            staked: gen(totalStaked * 0.8, totalStaked * 0.2),
            ideas: gen(ideas.length + 2, 3),
            tasks: gen(totalTasks + 3, 5),
            pointsEarned: gen(Math.max(points, 40), 60),
            engagement: engagement.length ? engagement : gen(8, 20, 12),
            progression: progression.length ? progression : gen(Math.max(points * 0.4, 20), 40, 12),
        }
    }, [totalStaked, totalTasks, ideas.length, points, history, posts])

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

    // Per-app breakdown data
    const appBreakdown = [
        ...(isVestDenStakingEnabled() ? [{ name: 'vestDen', color: 'vestden', value: stakes.length, icon: TrendingUp }] : []),
        { name: 'ConceptNexus', color: 'conceptnexus', value: ideas.length, icon: Lightbulb },
        { name: 'CollaBoard', color: 'collaboard', value: boards.length, icon: Users },
        { name: 'SkillsCanvas', color: 'skillscanvas', value: talents.length, icon: Palette }
    ]
    const maxAppValue = Math.max(...appBreakdown.map(a => a.value), 1)

    // Top ideas by validation score
    const topIdeas = [...ideas].sort((a, b) => b.validationScore - a.validationScore).slice(0, 5)

    // Top talents by rating
    const topTalents = [...talents].sort((a, b) => b.rating - a.rating).slice(0, 5)

    return (
        <main className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                            <p className="text-muted">Platform performance at a glance</p>
                        </div>
                    </div>

                    <Tabs value={timeRange} onValueChange={setTimeRange}>
                        <TabsList>
                            <TabsTrigger value="7d">7d</TabsTrigger>
                            <TabsTrigger value="30d">30d</TabsTrigger>
                            <TabsTrigger value="90d">90d</TabsTrigger>
                            <TabsTrigger value="all">All</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {isVestDenStakingEnabled() && (
                    <StatCard
                        label="Prototype tally"
                        value={`₦${formatNumber(totalStaked)}`}
                        trend={12}
                        trendLabel="vs last period"
                        icon={TrendingUp}
                        color="vestden"
                        sparkData={sparklines.staked}
                    />
                    )}
                    <StatCard
                        label="Ideas Submitted"
                        value={ideas.length}
                        trend={8}
                        trendLabel="vs last period"
                        icon={Lightbulb}
                        color="conceptnexus"
                        sparkData={sparklines.ideas}
                    />
                    <StatCard
                        label="Active Tasks"
                        value={totalTasks}
                        trend={-3}
                        trendLabel="vs last period"
                        icon={Users}
                        color="collaboard"
                        sparkData={sparklines.tasks}
                    />
                    <StatCard
                        label="FixPoints Earned"
                        value={formatNumber(points)}
                        trend={25}
                        trendLabel="this month"
                        icon={Star}
                        color="warning"
                        sparkData={sparklines.pointsEarned}
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mb-8">
                    {/* Activity Heatmap */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Eye className="w-4 h-4 text-primary" />
                                Platform Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ActivityHeatmap activities={activities} weeks={12} />
                        </CardContent>
                    </Card>

                    {/* App Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Per-App Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {appBreakdown.map((app) => (
                                <div key={app.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <app.icon className={`w-4 h-4 text-${app.color}`} />
                                            <span className="text-foreground font-medium">{app.name}</span>
                                        </div>
                                        <span className="text-muted">{app.value}</span>
                                    </div>
                                    <div className="h-2 bg-muted/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-${app.color} transition-all duration-1000 animate-chart-bar`}
                                            style={{ width: `${(app.value / maxAppValue) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Engagement Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageCircle className="w-4 h-4 text-primary" />
                                Engagement Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MiniChart
                                data={sparklines.engagement}
                                type="area"
                                color="primary"
                                width={480}
                                height={120}
                                labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                            />
                            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    Posts & Reactions
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-accent" />
                                    Votes
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Points Progression */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Award className="w-4 h-4 text-warning" />
                                Points Progression
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MiniChart
                                data={sparklines.progression}
                                type="line"
                                color="warning"
                                width={480}
                                height={120}
                                labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                            />
                            <div className="flex items-center justify-between mt-4 text-sm">
                                <span className="text-muted">Total earned</span>
                                <span className="font-bold text-foreground">{formatNumber(points)} pts</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Leaderboards */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Top Ideas */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Lightbulb className="w-4 h-4 text-conceptnexus" />
                                Top Validated Ideas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topIdeas.map((idea, i) => (
                                    <div key={idea.id} className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'gradient-conceptnexus text-white' : 'bg-muted/10 text-muted'}`}>
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{idea.title}</p>
                                            <p className="text-xs text-muted">{idea.creatorName}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {idea.validationScore}%
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Talents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Palette className="w-4 h-4 text-skillscanvas" />
                                Top Rated Talents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topTalents.map((talent, i) => (
                                    <div key={talent.id} className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'gradient-skillscanvas text-white' : 'bg-muted/10 text-muted'}`}>
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{talent.displayName}</p>
                                            <p className="text-xs text-muted">{talent.skills?.[0]?.name}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-warning">
                                            <Star className="w-3 h-3 fill-current" />
                                            <span className="text-xs font-medium">{talent.rating}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}
