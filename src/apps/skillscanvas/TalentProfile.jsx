import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { useTalent } from '@/hooks/useTalents'
import { useReviews } from '@/hooks/useReviews'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials, formatNumber, getRelativeTime } from '@/lib/utils'
import {
    Palette,
    Star,
    CheckCircle,
    DollarSign,
    Briefcase,
    MessageSquare,
    ArrowLeft,
    Calendar,
    Globe,
    Clock,
    MapPin,
    Loader2,
    Send
} from 'lucide-react'
import BookingModal from '@/components/BookingModal'

const SKILL_LEVELS = {
    expert: { label: 'Expert', color: 'success', percentage: 100 },
    advanced: { label: 'Advanced', color: 'warning', percentage: 75 },
    intermediate: { label: 'Intermediate', color: 'default', percentage: 50 },
    beginner: { label: 'Beginner', color: 'secondary', percentage: 25 }
}

function ReviewCard({ review }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={review.reviewer_avatar} />
                        <AvatarFallback>{getInitials(review.reviewer_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground">{review.reviewer_name}</p>
                            <div className="flex items-center gap-1 text-warning">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-muted/30'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-muted">{getRelativeTime(review.created_at)}</p>
                    </div>
                </div>

                {review.project_title && (
                    <Badge variant="secondary" className="mb-2">{review.project_title}</Badge>
                )}

                <p className="text-foreground">{review.content}</p>
            </CardContent>
        </Card>
    )
}

function RatingDistribution({ stats }) {
    return (
        <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.distribution[rating] || 0
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0

                return (
                    <div key={rating} className="flex items-center gap-3 text-sm">
                        <span className="w-3 text-muted">{rating}</span>
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <Progress value={percentage} className="h-2 flex-1" />
                        <span className="w-8 text-muted text-right">{count}</span>
                    </div>
                )
            })}
        </div>
    )
}

export default function TalentProfile() {
    const { id: talentId } = useParams()
    const { user, isAuthenticated } = useAuth()
    const { talent, loading: talentLoading, error: talentError } = useTalent(talentId)
    const { reviews, stats, loading: reviewsLoading, submitReview } = useReviews(talentId)

    const [showReviewForm, setShowReviewForm] = useState(false)
    const [showBooking, setShowBooking] = useState(false)
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewContent, setReviewContent] = useState('')
    const [reviewProject, setReviewProject] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmitReview = async () => {
        if (!reviewContent.trim()) return

        setSubmitting(true)
        await submitReview({
            rating: reviewRating,
            content: reviewContent,
            project_title: reviewProject || null
        })
        setSubmitting(false)
        setShowReviewForm(false)
        setReviewContent('')
        setReviewProject('')
        setReviewRating(5)
    }

    if (talentLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (talentError || !talent) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <Palette className="w-16 h-16 text-muted mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Talent Not Found</h1>
                <p className="text-muted mb-6">This talent profile doesn't exist or has been removed.</p>
                <Link to="/apps/skillscanvas">
                    <Button>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to SkillsCanvas
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <main className="py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link
                    to="/apps/skillscanvas"
                    className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to SkillsCanvas
                </Link>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Header */}
                        <Card>
                            <div className="h-2 gradient-skillscanvas" />
                            <CardContent className="p-6">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <Avatar className="w-24 h-24 mx-auto sm:mx-0">
                                        <AvatarImage src={talent.avatar_url} />
                                        <AvatarFallback className="text-2xl">{getInitials(talent.display_name)}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 text-center sm:text-left">
                                        <h1 className="text-2xl font-bold text-foreground mb-1">{talent.display_name}</h1>

                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted mb-4">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-warning fill-warning" />
                                                <span className="font-medium text-foreground">{stats.average}</span>
                                                <span>({stats.total} reviews)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" />
                                                {talent.completed_projects || 0} projects
                                            </div>
                                            <Badge
                                                variant={
                                                    talent.availability === 'full-time' ? 'success' :
                                                        talent.availability === 'part-time' ? 'warning' : 'secondary'
                                                }
                                            >
                                                {talent.availability || 'unavailable'}
                                            </Badge>
                                        </div>

                                        <p className="text-foreground">{talent.bio}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6 pt-6 border-t">
                                    <Button variant="skillscanvas" className="flex-1" onClick={() => setShowBooking(true)}>
                                        <Calendar className="w-4 h-4 mr-2" /> Book This Talent
                                    </Button>
                                    <Button variant="outline">
                                        <MessageSquare className="w-4 h-4 mr-2" /> Message
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Skills */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Skills</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {talent.skills?.map(skill => (
                                        <div key={skill.id || skill.name} className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-foreground">{skill.name}</span>
                                                        {skill.verified && (
                                                            <CheckCircle className="w-4 h-4 text-success" />
                                                        )}
                                                    </div>
                                                    <Badge variant={SKILL_LEVELS[skill.level]?.color || 'secondary'}>
                                                        {SKILL_LEVELS[skill.level]?.label || skill.level}
                                                    </Badge>
                                                </div>
                                                <Progress value={SKILL_LEVELS[skill.level]?.percentage || 50} className="h-2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Portfolio */}
                        {talent.portfolio?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Portfolio Highlights</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {talent.portfolio.map((item, i) => (
                                            <div
                                                key={i}
                                                className="p-4 rounded-xl bg-muted/10 border hover:bg-muted/20 transition-colors cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-lg gradient-skillscanvas flex items-center justify-center mb-3">
                                                    <Briefcase className="w-5 h-5 text-white" />
                                                </div>
                                                <p className="font-medium text-foreground">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reviews */}
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle>Reviews ({stats.total})</CardTitle>
                                {isAuthenticated && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowReviewForm(!showReviewForm)}
                                    >
                                        Write Review
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {showReviewForm && (
                                    <Card className="mb-6 bg-muted/5">
                                        <CardContent className="p-4 space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-foreground block mb-2">Rating</label>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(rating => (
                                                        <button
                                                            key={rating}
                                                            onClick={() => setReviewRating(rating)}
                                                            className="p-1 hover:scale-110 transition-transform"
                                                        >
                                                            <Star
                                                                className={`w-6 h-6 ${rating <= reviewRating ? 'text-warning fill-warning' : 'text-muted/30'}`}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-foreground block mb-2">Project (optional)</label>
                                                <Input
                                                    placeholder="What project did you work on?"
                                                    value={reviewProject}
                                                    onChange={(e) => setReviewProject(e.target.value)}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-sm font-medium text-foreground block mb-2">Review</label>
                                                <textarea
                                                    className="w-full p-3 rounded-lg border bg-card text-foreground resize-none focus:ring-2 focus:ring-primary focus:outline-none"
                                                    rows={3}
                                                    placeholder="Share your experience working with this talent..."
                                                    value={reviewContent}
                                                    onChange={(e) => setReviewContent(e.target.value)}
                                                />
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <Button variant="ghost" onClick={() => setShowReviewForm(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleSubmitReview} disabled={!reviewContent.trim() || submitting}>
                                                    {submitting ? (
                                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                                                    ) : (
                                                        <><Send className="w-4 h-4 mr-2" /> Submit Review</>
                                                    )}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className="space-y-4">
                                    {reviewsLoading ? (
                                        <div className="text-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                                        </div>
                                    ) : reviews.length > 0 ? (
                                        reviews.map(review => (
                                            <ReviewCard key={review.id} review={review} />
                                        ))
                                    ) : (
                                        <p className="text-center text-muted py-8">No reviews yet</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Pricing Card */}
                        <Card>
                            <CardContent className="p-6 text-center">
                                <DollarSign className="w-10 h-10 text-skillscanvas mx-auto mb-2" />
                                <p className="text-3xl font-bold text-foreground mb-1">
                                    ${talent.hourly_rate || 0}
                                </p>
                                <p className="text-muted">per hour</p>
                            </CardContent>
                        </Card>

                        {/* Rating Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Rating Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center mb-4">
                                    <p className="text-4xl font-bold text-foreground">{stats.average}</p>
                                    <div className="flex justify-center gap-0.5 my-2">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i <= Math.round(stats.average) ? 'text-warning fill-warning' : 'text-muted/30'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted">{stats.total} reviews</p>
                                </div>

                                <RatingDistribution stats={stats} />
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{talent.completed_projects || 0}</p>
                                        <p className="text-xs text-muted">Completed Projects</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-success" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {talent.skills?.filter(s => s.verified).length || 0}
                                        </p>
                                        <p className="text-xs text-muted">Verified Skills</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-warning" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground capitalize">{talent.availability || 'N/A'}</p>
                                        <p className="text-xs text-muted">Availability</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            {showBooking && (
                <BookingModal talent={talent} onClose={() => setShowBooking(false)} />
            )}
        </main>
    )
}
