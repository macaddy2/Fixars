import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useSocial } from '@/contexts/SocialContext'
import { useAuth } from '@/contexts/AuthContext'
import { MessageCircle, Send } from 'lucide-react'

function formatTimeAgo(dateStr) {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

export default function CommentSection({ postId }) {
    const { getComments, addComment } = useSocial()
    const { user, isAuthenticated } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [newComment, setNewComment] = useState('')
    const comments = getComments(postId)

    const handleSubmit = () => {
        if (!newComment.trim()) return
        addComment(postId, newComment.trim())
        setNewComment('')
    }

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
            >
                <MessageCircle className="w-4 h-4" />
                {comments.length > 0 ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}` : 'Comment'}
            </button>

            {isOpen && (
                <div className="mt-3 pt-3 border-t space-y-3 animate-fade-in">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex gap-2">
                            <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs">
                                    {comment.authorName?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="bg-muted/10 rounded-lg px-3 py-2">
                                    <p className="text-xs font-semibold text-foreground">{comment.authorName}</p>
                                    <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                                </div>
                                <span className="text-xs text-muted ml-1">{formatTimeAgo(comment.createdAt)}</span>
                            </div>
                        </div>
                    ))}

                    {isAuthenticated && (
                        <div className="flex gap-2 items-start">
                            <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs">
                                    {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder="Write a comment..."
                                    className="flex-1 px-3 py-1.5 bg-muted/10 rounded-lg text-sm outline-none border focus:border-primary/50 text-foreground placeholder:text-muted-foreground"
                                />
                                <Button size="sm" variant="ghost" onClick={handleSubmit} disabled={!newComment.trim()}>
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
