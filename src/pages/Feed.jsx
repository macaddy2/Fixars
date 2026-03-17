import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PostCard from '@/components/PostCard'
import { useSocial } from '@/contexts/SocialContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { getInitials } from '@/lib/utils'
import { Send, TrendingUp, Users, Sparkles } from 'lucide-react'

export default function Feed() {
    const { posts, createPost, reactToPost } = useSocial()
    const { user, isAuthenticated } = useAuth()
    const { awardPoints } = usePoints()
    const [newPost, setNewPost] = useState('')

    const handlePost = () => {
        if (!newPost.trim() || !isAuthenticated) return
        createPost(newPost.trim())
        awardPoints('POST_STATUS')
        setNewPost('')
    }

    return (
        <main className="py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Activity Feed</h1>
                    <p className="text-muted">Stay updated with activity across the Fixars ecosystem</p>
                </div>

                {/* Create Post */}
                {isAuthenticated && (
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex gap-3">
                                <Avatar>
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback>{getInitials(user?.name || 'U')}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <Input
                                        placeholder="Share an update..."
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePost()}
                                        className="mb-3"
                                    />
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <Badge variant="secondary" className="cursor-pointer hover:bg-muted/40">
                                                <TrendingUp className="w-3 h-3 mr-1" /> VestDen
                                            </Badge>
                                            <Badge variant="secondary" className="cursor-pointer hover:bg-muted/40">
                                                <Sparkles className="w-3 h-3 mr-1" /> ConceptNexus
                                            </Badge>
                                        </div>
                                        <Button size="sm" onClick={handlePost} disabled={!newPost.trim()}>
                                            <Send className="w-4 h-4 mr-1" /> Post
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs */}
                <Tabs defaultValue="all" className="mb-6">
                    <TabsList>
                        <TabsTrigger value="all">All Activity</TabsTrigger>
                        <TabsTrigger value="following">Following</TabsTrigger>
                        <TabsTrigger value="trending">Trending</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                        <div className="space-y-4">
                            {posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onReact={reactToPost}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="following">
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Users className="w-12 h-12 text-muted mx-auto mb-4" />
                                <p className="text-muted">Follow users to see their posts here</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="trending">
                        <div className="space-y-4">
                            {posts
                                .sort((a, b) => {
                                    const scoreA = Object.values(a.reactions).reduce((x, y) => x + y, 0)
                                    const scoreB = Object.values(b.reactions).reduce((x, y) => x + y, 0)
                                    return scoreB - scoreA
                                })
                                .map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onReact={reactToPost}
                                    />
                                ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
