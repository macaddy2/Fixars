import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getIdeaRecommendations, isAIConfigured } from '@/lib/ai'
import {
    Sparkles,
    RefreshCw,
    ArrowRight,
    ThumbsUp,
    Zap,
    Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AIRecommendations({ compact = false }) {
    const { ideas } = useData()
    const { user } = useAuth()
    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const loadRecommendations = async () => {
        setLoading(true)
        try {
            const recs = await getIdeaRecommendations(ideas, {
                interests: user?.interests || [],
                skills: user?.skills || []
            })
            setRecommendations(recs)
        } catch (err) {
            console.error('Recommendation error:', err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        if (ideas.length > 0) {
            loadRecommendations()
        }
    }, [ideas])

    const handleRefresh = () => {
        setRefreshing(true)
        loadRecommendations()
    }

    if (ideas.length === 0) return null

    const displayRecs = compact ? recommendations.slice(0, 3) : recommendations

    return (
        <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-warning" />
            <div className="p-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary animate-ai-sparkle" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground text-sm">
                            Recommended for You
                        </h3>
                        <p className="text-xs text-muted">
                            {isAIConfigured() ? 'AI-powered' : 'Based on your interests'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-8 w-8"
                >
                    <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                </Button>
            </div>

            <CardContent className="p-4 pt-2 space-y-3">
                {loading ? (
                    // Skeleton loading
                    Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex gap-3 p-3 rounded-xl bg-muted/5">
                            <div className="w-10 h-10 rounded-lg bg-muted/20 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted/20 rounded w-3/4" />
                                <div className="h-3 bg-muted/10 rounded w-1/2" />
                            </div>
                        </div>
                    ))
                ) : displayRecs.length > 0 ? (
                    displayRecs.map(({ idea, matchReason, score }, i) => (
                        <Link
                            key={idea.id}
                            to="/apps/conceptnexus"
                            className="block"
                        >
                            <div
                                className="flex gap-3 p-3 rounded-xl bg-muted/5 hover:bg-muted/10 transition-all duration-200 hover:-translate-y-0.5 group animate-fade-in"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="w-10 h-10 rounded-lg gradient-conceptnexus flex items-center justify-center shrink-0">
                                    <Lightbulb className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                                        {idea.title}
                                    </p>
                                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                                        <Zap className="w-3 h-3 text-warning" />
                                        {matchReason}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Badge variant="outline" className="text-[10px] py-0">
                                            {idea.validationScore}% validated
                                        </Badge>
                                        <span className="text-[10px] text-muted flex items-center gap-0.5">
                                            <ThumbsUp className="w-2.5 h-2.5" />
                                            {idea.votes?.up || 0}
                                        </span>
                                        {score >= 0.7 && (
                                            <Badge className="text-[10px] py-0 bg-success/10 text-success border-success/20">
                                                Great match
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0" />
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-4 text-sm text-muted">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No recommendations yet</p>
                        <p className="text-xs">Submit ideas to get personalized suggestions</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
