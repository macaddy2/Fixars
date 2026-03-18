import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Share2, ExternalLink, Bookmark } from 'lucide-react'
import CommentSection from '@/components/CommentSection'
import { getInitials, getRelativeTime, formatNumber } from '@/lib/utils'

const EMOJI_OPTIONS = ['👍', '🔥', '💡', '🎉', '💪', '❤️']

export default function PostCard({ post, onReact }) {
    const [showReactions, setShowReactions] = useState(false)
    const [bookmarked, setBookmarked] = useState(false)

    const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0)
    const topEmojis = Object.entries(post.reactions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([emoji]) => emoji)

    const appColors = {
        vestden: 'vestden',
        conceptnexus: 'conceptnexus',
        collaboard: 'collaboard',
        skillscanvas: 'skillscanvas',
        fixars: 'default'
    }

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <Avatar>
                        <AvatarImage src={post.authorAvatar} />
                        <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{post.authorName}</span>
                            {post.sourceApp !== 'fixars' && (
                                <Badge variant={appColors[post.sourceApp]} className="text-xs">
                                    {post.sourceApp}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted">{getRelativeTime(post.createdAt)}</p>
                    </div>
                </div>

                {/* Content */}
                <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>

                {/* Linked entity */}
                {post.linkedEntity && (
                    <div className="mb-4 p-3 rounded-xl bg-muted/10 border flex items-center gap-3 hover:bg-muted/20 transition-colors cursor-pointer">
                        <div className={`w-10 h-10 rounded-lg bg-${appColors[post.sourceApp]}/10 flex items-center justify-center`}>
                            <ExternalLink className={`w-5 h-5 text-${appColors[post.sourceApp]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{post.linkedEntity.name}</p>
                            <p className="text-xs text-muted capitalize">{post.linkedEntity.type}</p>
                        </div>
                    </div>
                )}

                {/* Reactions summary */}
                {totalReactions > 0 && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted">
                        <div className="flex -space-x-1">
                            {topEmojis.map(emoji => (
                                <span key={emoji} className="text-base">{emoji}</span>
                            ))}
                        </div>
                        <span>{formatNumber(totalReactions)}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t">
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setShowReactions(!showReactions)}
                        >
                            <Heart className="w-4 h-4" />
                            React
                        </Button>

                        {showReactions && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowReactions(false)} />
                                <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-card p-2 rounded-xl shadow-xl border z-20 animate-fade-in">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => { onReact?.(post.id, emoji); setShowReactions(false); }}
                                            className="text-xl hover:scale-125 transition-transform p-1"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <CommentSection postId={post.id} />

                    <div className="ml-auto flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setBookmarked(!bookmarked)}
                        >
                            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-primary text-primary' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5">
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
