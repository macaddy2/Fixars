import { Link, Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { useData } from '@/contexts/DataContext'
import { getInitials, formatNumber } from '@/lib/utils'
import AIRecommendations from '@/components/AIRecommendations'
import { fetchPaymentHistory, formatCurrency } from '@/lib/payments'
import {
    TrendingUp,
    Lightbulb,
    Users,
    Palette,
    Star,
    ArrowRight,
    Bell,
    Zap
} from 'lucide-react'

// Activity Feed Component
function ActivityFeed({ activities }) {
    const getIcon = (type) => {
        switch (type) {
            case 'launch': return <Lightbulb className="w-4 h-4 text-conceptnexus" />
            case 'stake': return <TrendingUp className="w-4 h-4 text-vestden" />
            case 'skill': return <Palette className="w-4 h-4 text-skillscanvas" />
            default: return <Zap className="w-4 h-4 text-primary" />
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                    Community Feed
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.map((act) => (
                        <div key={act.id} className="flex gap-3 text-sm">
                            <div className="mt-1 shrink-0">
                                {getIcon(act.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground leading-snug">
                                    <span className="font-bold">{act.user}</span> {act.message}
                                </p>
                                <p className="text-xs text-muted mt-0.5">
                                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
    const { user, isAuthenticated } = useAuth()
    const { points, level, getNextLevel, LEVELS } = usePoints()
    const { stakes, ideas, boards, talents, activities } = useData()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    const nextLevel = getNextLevel(points)
    const currentLevelData = LEVELS.find(l => l.name === level)
    const progressToNext = nextLevel
        ? ((points - currentLevelData.minPoints) / (nextLevel.minPoints - currentLevelData.minPoints)) * 100
        : 100

    const quickStats = [
        {
            label: 'Active Stakes',
            value: stakes.filter(s => s.status === 'active').length,
            icon: TrendingUp,
            color: 'vestden',
            link: '/apps/vestden'
        },
        {
            label: 'My Ideas',
            value: ideas.filter(i => i.creatorId === user.id).length,
            icon: Lightbulb,
            color: 'conceptnexus',
            link: '/apps/conceptnexus'
        },
        {
            label: 'Active Boards',
            value: boards.filter(b => b.members.some(m => m.userId === user.id)).length,
            icon: Users,
            color: 'collaboard',
            link: '/apps/collaboard'
        },
        {
            label: 'Skills Listed',
            value: user.skills?.length || 0,
            icon: Palette,
            color: 'skillscanvas',
            link: '/apps/skillscanvas'
        }
    ]

    return (
        <main className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.name.split(' ')[0]}!</h1>
                            <p className="text-muted">Here's what's happening across your Fixars apps</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild>
                            <Link to="/notifications">
                                <Bell className="w-4 h-4 mr-2" /> Notifications
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link to="/apps">
                                <Zap className="w-4 h-4 mr-2" /> Explore Apps
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quick Stats */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            {quickStats.map((stat) => (
                                <Link key={stat.label} to={stat.link}>
                                    <Card className="hover:-translate-y-1 transition-all duration-300">
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted mb-1">{stat.label}</p>
                                                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                                                </div>
                                                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}/10 flex items-center justify-center`}>
                                                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Recent Stakes
                                    <Link to="/apps/vestden">
                                        <Button variant="ghost" size="sm">
                                            View all <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {stakes.slice(0, 3).map((stake) => (
                                        <div key={stake.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors">
                                            <div className="w-12 h-12 rounded-xl gradient-vestden flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">{stake.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Progress value={(stake.currentAmount / stake.targetAmount) * 100} className="h-2 flex-1" />
                                                    <span className="text-xs text-muted whitespace-nowrap">
                                                        {formatNumber(stake.currentAmount)} / {formatNumber(stake.targetAmount)}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge variant={stake.status === 'funded' ? 'success' : 'default'}>
                                                {stake.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Ideas */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Trending Ideas
                                    <Link to="/apps/conceptnexus">
                                        <Button variant="ghost" size="sm">
                                            View all <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {ideas.slice(0, 3).map((idea) => (
                                        <div key={idea.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/5 hover:bg-muted/10 transition-colors">
                                            <div className="w-12 h-12 rounded-xl gradient-conceptnexus flex items-center justify-center">
                                                <Lightbulb className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">{idea.title}</p>
                                                <p className="text-sm text-muted">{idea.creatorName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-foreground">{idea.validationScore}%</p>
                                                <p className="text-xs text-muted">validated</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Points Card */}
                        <Card className="overflow-hidden">
                            <div className="h-2 gradient-primary" />
                            <CardContent className="p-6">
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 mb-3">
                                        <Star className="w-8 h-8 text-warning fill-warning" />
                                    </div>
                                    <p className="text-3xl font-bold text-foreground">{formatNumber(points)}</p>
                                    <p className="text-muted">Fixars Points</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-foreground font-medium">{level}</span>
                                        <span className="text-muted">{nextLevel?.name || 'Max Level'}</span>
                                    </div>
                                    <Progress value={progressToNext} />
                                    {nextLevel && (
                                        <p className="text-xs text-muted text-center">
                                            {nextLevel.minPoints - points} points to next level
                                        </p>
                                    )}
                                </div>

                                <Button variant="outline" className="w-full mt-4" asChild>
                                    <Link to="/profile">View Profile</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <ActivityFeed activities={activities} />

                        {/* AI Recommendations */}
                        <AIRecommendations compact />

                        {/* Recent Transactions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Recent Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[{ id: 1, name: 'AI Recipe Generator', amount: 2500, time: '2d ago' }, { id: 2, name: 'Solar Grid Network', amount: 1000, time: '5d ago' }].map(txn => (
                                        <div key={txn.id} className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-medium text-foreground truncate">{txn.name}</p>
                                                <p className="text-xs text-muted">{txn.time}</p>
                                            </div>
                                            <Badge variant="outline" className="font-mono">{formatCurrency(txn.amount)}</Badge>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                                    <Link to="/apps/vestden">
                                        View all <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Top Talents */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Featured Talents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {talents.slice(0, 3).map((talent) => (
                                        <div key={talent.id} className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{getInitials(talent.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground text-sm truncate">{talent.displayName}</p>
                                                <p className="text-xs text-muted truncate">{talent.skills[0]?.name}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-warning">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="text-xs font-medium">{talent.rating}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                                    <Link to="/apps/skillscanvas">
                                        Browse all talents <ArrowRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    )
}
