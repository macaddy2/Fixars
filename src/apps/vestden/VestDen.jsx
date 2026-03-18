import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { formatNumber, formatDate } from '@/lib/utils'
import {
    TrendingUp,
    Search,
    Filter,
    ArrowUpRight,
    Clock,
    Users,
    Zap,
    Plus
} from 'lucide-react'
import PaymentModal from '@/components/PaymentModal'

const RISK_COLORS = {
    low: 'success',
    medium: 'warning',
    high: 'destructive'
}

function StakeCard({ stake, onStake }) {
    const progress = (stake.currentAmount / stake.targetAmount) * 100

    return (
        <Card className="overflow-hidden hover:-translate-y-1 transition-all duration-300" >
            <div className="h-1.5 gradient-vestden" />
            <CardContent className="p-5" >
                <div className="flex items-start justify-between mb-3" >
                    <Badge variant={RISK_COLORS[stake.riskLevel]}>
                        {stake.riskLevel} risk
                    </Badge>
                    < Badge variant="vestden" >
                        {stake.expectedReturns}
                    </Badge>
                </div>

                < h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1" >
                    {stake.title}
                </h3>
                < p className="text-sm text-muted mb-4 line-clamp-2" >
                    {stake.description}
                </p>

                < div className="space-y-2 mb-4" >
                    <div className="flex justify-between text-sm" >
                        <span className="text-muted" > Progress </span>
                        < span className="font-medium text-foreground" >
                            ${formatNumber(stake.currentAmount)} / ${formatNumber(stake.targetAmount)}
                        </span>
                    </div>
                    < Progress value={progress} indicatorClassName="from-vestden to-primary" />
                </div>

                < div className="flex items-center justify-between text-sm text-muted mb-4" >
                    <div className="flex items-center gap-1" >
                        <Users className="w-4 h-4" />
                        {stake.stakers.length} stakers
                    </div>
                    < div className="flex items-center gap-1" >
                        <Clock className="w-4 h-4" />
                        {formatDate(stake.deadline)}
                    </div>
                </div>

                < div className="flex gap-2" >
                    <Button variant="vestden" className="flex-1" onClick={() => onStake?.(stake)}>
                        <Zap className="w-4 h-4 mr-1" /> Stake Now
                    </Button>
                    < Button variant="outline" size="icon" >
                        <ArrowUpRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function VestDen() {
    const { stakes, makeStake } = useData()
    const { isAuthenticated, user } = useAuth()
    const { awardPoints } = usePoints()
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('all')
    const [paymentModal, setPaymentModal] = useState({ open: false, stake: null, amount: 500 })

    const handleStakeClick = useCallback((stake) => {
        setPaymentModal({ open: true, stake, amount: 500 })
    }, [])

    const handlePaymentSuccess = useCallback(async (result) => {
        if (paymentModal.stake && user?.id) {
            await makeStake(paymentModal.stake.id, user.id, paymentModal.amount)
            awardPoints('MAKE_STAKE')
        }
    }, [paymentModal, user, makeStake, awardPoints])

    const filteredStakes = stakes.filter(stake => {
        const matchesSearch = stake.title.toLowerCase().includes(search.toLowerCase()) ||
            stake.description.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = category === 'all' || stake.category === category
        return matchesSearch && matchesCategory
    })

    const userStakes = stakes.filter(stake =>
        stake.stakers.some(s => s.userId === user?.id)
    )

    const portfolioTotal = userStakes.reduce((sum, stake) => {
        const myContribution = stake.stakers.find(s => s.userId === user?.id)?.amount || 0
        return sum + myContribution
    }, 0)

    const totalStaked = stakes.reduce((sum, s) => sum + s.currentAmount, 0)
    const activeStakes = stakes.filter(s => s.status === 'active').length

    return (
        <main className="py-8" >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" >
                {/* Header */}
                < div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8" >
                    <div>
                        <div className="flex items-center gap-3 mb-2" >
                            <div className="w-12 h-12 rounded-2xl gradient-vestden flex items-center justify-center" >
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            < h1 className="text-3xl font-bold text-foreground" > VestDen </h1>
                        </div>
                        < p className="text-muted" > Stake on ideas, innovations, and risks.Earn returns for your vision.</p>
                    </div>

                    {isAuthenticated && (
                        <Button variant="vestden" size="lg" >
                            <Plus className="w-4 h-4 mr-2" /> Create Stake
                        </Button>
                    )
                    }
                </div>

                {/* Main Stats */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8" >
                    <Card>
                        <CardContent className="p-5 text-center" >
                            <p className="text-3xl font-bold text-foreground" > ${formatNumber(totalStaked)} </p>
                            < p className="text-sm text-muted" > Total Staked </p>
                        </CardContent>
                    </Card>
                    < Card >
                        <CardContent className="p-5 text-center" >
                            <p className="text-3xl font-bold text-foreground" > {activeStakes} </p>
                            < p className="text-sm text-muted" > Active Opportunities </p>
                        </CardContent>
                    </Card>
                    < Card >
                        <CardContent className="p-5 text-center" >
                            <p className="text-3xl font-bold text-foreground" > 3.2x </p>
                            < p className="text-sm text-muted" > Avg Returns </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6" >
                    <div className="relative flex-1" >
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <Input
                            placeholder="Search stakes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    < Tabs value={category} onValueChange={setCategory} >
                        <TabsList>
                            <TabsTrigger value="all" > Discover </TabsTrigger>
                            < TabsTrigger value="tech" > Tech </TabsTrigger>
                            < TabsTrigger value="marketplace" > Marketplace </TabsTrigger>
                            < TabsTrigger value="health" > Health </TabsTrigger>
                            {
                                isAuthenticated && (
                                    <TabsTrigger value="portfolio" className="border-l ml-2 pl-4" >
                                        My Portfolio
                                    </TabsTrigger>
                                )
                            }
                        </TabsList>
                    </Tabs>
                </div>

                {
                    category === 'portfolio' ? (
                        <div className="space-y-8" >
                            {/* Portfolio Stats */}
                            < div className="grid sm:grid-cols-4 gap-4" >
                                <Card className="bg-primary/5 border-primary/20" >
                                    <CardContent className="p-5" >
                                        <p className="text-sm text-muted mb-1" > My Managed Capital </p>
                                        < p className="text-3xl font-bold text-primary" > ${formatNumber(portfolioTotal)} </p>
                                    </CardContent>
                                </Card>
                                < Card >
                                    <CardContent className="p-5" >
                                        <p className="text-sm text-muted mb-1" > Staked Projects </p>
                                        < p className="text-3xl font-bold text-foreground" > {userStakes.length} </p>
                                    </CardContent>
                                </Card>
                                < Card >
                                    <CardContent className="p-5" >
                                        <p className="text-sm text-muted mb-1" > Active Stakes </p>
                                        < p className="text-3xl font-bold text-foreground" >
                                            {userStakes.filter(s => s.status === 'active').length}
                                        </p>
                                    </CardContent>
                                </Card>
                                < Card >
                                    <CardContent className="p-5" >
                                        <p className="text-sm text-muted mb-1" > Awaiting Returns </p>
                                        < p className="text-3xl font-bold text-success" >
                                            ${formatNumber(userStakes.filter(s => s.status === 'funded').reduce((sum, s) => sum + (s.stakers.find(st => st.userId === user?.id)?.amount || 0), 0))}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* User Stakes Grid */}
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" >
                                {
                                    userStakes.map((stake, i) => (
                                        <div key={stake.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }} >
                                            <StakeCard stake={stake} onStake={handleStakeClick} />
                                        </div>
                                    ))
                                }
                            </div>

                            {
                                userStakes.length === 0 && (
                                    <Card className="border-dashed" >
                                        <CardContent className="py-12 text-center" >
                                            <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
                                            <p className="text-lg font-medium text-foreground mb-2" > Portfolio Empty </p>
                                            < p className="text-muted mb-6" > You haven't staked on any projects yet.</p>
                                            < Button onClick={() => setCategory('all')
                                            }> Discover Opportunities </Button>
                                        </CardContent>
                                    </Card>
                                )}
                        </div>
                    ) : (
                        <>
                            {/* Stakes Grid */}
                            < div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" >
                                {
                                    filteredStakes.map((stake, i) => (
                                        <div key={stake.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }} >
                                            <StakeCard stake={stake} onStake={handleStakeClick} />
                                        </div>
                                    ))}
                            </div>

                            {
                                filteredStakes.length === 0 && (
                                    <Card>
                                        <CardContent className="py-12 text-center" >
                                            <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
                                            <p className="text-lg font-medium text-foreground mb-2" > No stakes found </p>
                                            < p className="text-muted" > Try adjusting your search or filters </p>
                                        </CardContent>
                                    </Card>
                                )
                            }
                        </>
                    )}
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={paymentModal.open}
                onClose={() => setPaymentModal({ open: false, stake: null, amount: 500 })}
                stake={paymentModal.stake}
                amount={paymentModal.amount}
                onSuccess={handlePaymentSuccess}
            />
        </main>
    )
}
