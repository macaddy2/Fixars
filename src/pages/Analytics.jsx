import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { usePoints } from '@/contexts/PointsContext'
import { useSocial } from '@/contexts/SocialContext'
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
    Eye
} from 'lucide-react'

export default function Analytics() {
    const { user, isAuthenticated } = useAuth()
    const { stakes, ideas, boards, talents, activities } = useData()
    const { points, history } = usePoints()
    const { posts, notifications } = useSocial()
    const [timeRange, setTimeRange] = useState('30d')

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // Mock sparkline data generators
    const genSparkline = (base, variance, len = 7) =>
        Array.from({ length: len }, () => base + Math.floor(Math.random() * variance))

    const totalStaked = stakes.reduce((sum, s) => sum + s.currentAmount, 0)
    const totalVotes = ideas.reduce((sum, i) => (i.votes?.up || 0) + (i.votes?.down || 0) + sum, 0)
    const totalTasks = boards.reduce((sum, b) =>
        sum + b.columns.reduce((cs, c) => cs + c.tasks.length, 0), 0
    )

    // Per-app breakdown data
    const appBreakdown = [
        { name: 'InvestDen', color: 'vestden', value: stakes.length, icon: TrendingUp },
        { name: 'ConceptNexus', color: 'conceptnexus', value: ideas.length, icon: Lightbulb },
        { name: 'Collaboard', color: 'collaboard', value: boards.length, icon: Users },
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
                    <StatCard
                        label="Total Staked"
                        value={`$${formatNumber(totalStaked)}`}
                        trend={12}
                        trendLabel="vs last period"
                        icon={TrendingUp}
                        color="vestden"
                        sparkData={genSparkline(totalStaked * 0.8, totalStaked * 0.2)}
                    />
                    <StatCard
                        label="Ideas Submitted"
                        value={ideas.length}
                        trend={8}
                        trendLabel="vs last period"
                        icon={Lightbulb}
                        color="conceptnexus"
                        sparkData={genSparkline(1, 3)}
                    />
                    <StatCard
                        label="Active Tasks"
                        value={totalTasks}
                        trend={-3}
                        trendLabel="vs last period"
                        icon={Users}
                        color="collaboard"
                        sparkData={genSparkline(3, 5)}
                    />
                    <StatCard
                        label="FixPoints Earned"
                        value={formatNumber(points)}
                        trend={25}
                        trendLabel="this month"
                        icon={Star}
                        color="warning"
                        sparkData={genSparkline(50, 100)}
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
                                data={genSparkline(10, 30, 12)}
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
                                data={genSparkline(points * 0.3, points * 0.7, 12)}
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
