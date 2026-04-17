import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import AIRecommendations from '@/components/AIRecommendations'
import SubmitIdeaModal from '@/components/SubmitIdeaModal'
import {
    Lightbulb,
    Search,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    Share2,
    Plus,
    Sparkles,
    ArrowRight,
    CheckCircle,
    ExternalLink
} from 'lucide-react'

function IdeaCard({ idea, onVote }) {
    const { isAuthenticated, user } = useAuth()
    const { launchProjectFromIdea } = useData()
    const totalVotes = idea.votes.up + idea.votes.down

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="h-1.5 gradient-conceptnexus" />
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap gap-1.5">
                        {idea.impactTags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <Badge variant={idea.status === 'validated' ? 'success' : 'conceptnexus'}>
                        {idea.status === 'validated' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {idea.status}
                    </Badge>
                </div>

                <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-1">
                    {idea.title}
                </h3>
                <p className="text-sm text-muted mb-4 line-clamp-2">
                    {idea.description}
                </p>

                {/* Validation Score */}
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted">Validation Score</span>
                        <span className="font-bold text-foreground">{idea.validationScore}%</span>
                    </div>
                    <Progress
                        value={idea.validationScore}
                        indicatorClassName={idea.validationScore >= 75 ? "from-success to-conceptnexus" : "from-conceptnexus to-accent"}
                    />
                </div>

                {/* Votes */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-success hover:text-success hover:bg-success/10"
                            onClick={() => isAuthenticated && onVote?.(idea.id, 'up')}
                        >
                            <ThumbsUp className="w-4 h-4" />
                            {idea.votes.up}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => isAuthenticated && onVote?.(idea.id, 'down')}
                        >
                            <ThumbsDown className="w-4 h-4" />
                            {idea.votes.down}
                        </Button>
                    </div>
                    <span className="text-xs text-muted">{totalVotes} votes</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {idea.status === 'validated' && !idea.linkedBoardId ? (
                        <Button
                            variant="conceptnexus"
                            className="flex-1"
                            onClick={() => launchProjectFromIdea(idea, user.id, user.name)}
                        >
                            <Sparkles className="w-4 h-4 mr-1" /> Launch Project
                        </Button>
                    ) : (
                        <Button variant="conceptnexus" className="flex-1" disabled={idea.status !== 'validated'}>
                            <Sparkles className="w-4 h-4 mr-1" /> {idea.linkedBoardId ? 'Project Launched' : 'Validate'}
                        </Button>
                    )}
                    {idea.linkedBoardId && (
                        <Button variant="outline" size="icon" title="View on Collaboard" asChild>
                            <Link to={`/apps/collaboard?boardId=${idea.linkedBoardId}`}>
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function ConceptNexus() {
    const { ideas, voteIdea } = useData()
    const { user, isAuthenticated } = useAuth()
    const { awardPoints } = usePoints()
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [submitOpen, setSubmitOpen] = useState(false)

    const handleVote = (ideaId, vote) => {
        voteIdea(ideaId, user.id, vote)
        awardPoints('VALIDATE_IDEA')
    }

    const filteredIdeas = ideas.filter(idea => {
        const matchesSearch = idea.title.toLowerCase().includes(search.toLowerCase()) ||
            idea.description.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = status === 'all' || idea.status === status
        return matchesSearch && matchesStatus
    })

    const validatedCount = ideas.filter(i => i.status === 'validated').length
    const validatingCount = ideas.filter(i => i.status === 'validating').length

    return (
        <main className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl gradient-conceptnexus flex items-center justify-center">
                                <Lightbulb className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground">ConceptNexus</h1>
                        </div>
                        <p className="text-muted">Gather, validate, and supercharge ideas and impact projects.</p>
                    </div>

                    {isAuthenticated && (
                        <Button variant="conceptnexus" size="lg" onClick={() => setSubmitOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Submit Idea
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-foreground">{ideas.length}</p>
                            <p className="text-sm text-muted">Total Ideas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-success">{validatedCount}</p>
                            <p className="text-sm text-muted">Validated</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-conceptnexus">{validatingCount}</p>
                            <p className="text-sm text-muted">In Validation</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                        <Input
                            placeholder="Search ideas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Tabs value={status} onValueChange={setStatus}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="validating">Validating</TabsTrigger>
                            <TabsTrigger value="validated">Validated</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {/* Main content with sidebar */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Ideas Grid */}
                    <div className="flex-1">
                        <div className="grid sm:grid-cols-2 gap-6">
                            {filteredIdeas.map((idea, i) => (
                                <div key={idea.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                                    <IdeaCard idea={idea} onVote={handleVote} />
                                </div>
                            ))}
                        </div>

                        {filteredIdeas.length === 0 && (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Lightbulb className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-lg font-medium text-foreground mb-2">No ideas found</p>
                                    <p className="text-muted mb-4">Try adjusting your search or be the first to submit!</p>
                                    {isAuthenticated && (
                                        <Button variant="conceptnexus" onClick={() => setSubmitOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" /> Submit your idea
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* AI Recommendations Sidebar */}
                    <div className="lg:w-80 shrink-0">
                        <div className="lg:sticky lg:top-24">
                            <AIRecommendations />
                        </div>
                    </div>
                </div>
            </div>

            <SubmitIdeaModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
        </main>
    )
}
