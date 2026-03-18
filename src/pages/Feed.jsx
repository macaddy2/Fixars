import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PostCard from '@/components/PostCard'
import PostComposer from '@/components/PostComposer'
import { useSocial } from '@/contexts/SocialContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import { getInitials } from '@/lib/utils'
import { TrendingUp, Users, UserPlus, UserMinus, Flame } from 'lucide-react'

// Unique author list from posts for the "Following" tab
function getUniqueAuthors(posts) {
    const seen = new Set()
    return posts.reduce((acc, post) => {
        if (!seen.has(post.authorId)) {
            seen.add(post.authorId)
            acc.push({ id: post.authorId, name: post.authorName, avatar: post.authorAvatar })
        }
        return acc
    }, [])
}

// Time-decay trending score: reactions / hours^1.5
function getTrendingScore(post) {
    const totalReactions = Object.values(post.reactions).reduce((a, b) => a + b, 0)
    const hoursSincePost = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / 3600000)
    return totalReactions / Math.pow(hoursSincePost, 1.5)
}

export default function Feed() {
    const { posts, createPost, reactToPost, isFollowing, followUser, unfollowUser } = useSocial()
    const { user, isAuthenticated } = useAuth()
    const { awardPoints } = usePoints()

    const handlePost = (content, sourceApp, linkedEntity) => {
        if (!isAuthenticated) return
        createPost(content, sourceApp, linkedEntity)
        awardPoints('POST_STATUS')
    }

    const authors = useMemo(() => getUniqueAuthors(posts), [posts])
    const followingPosts = useMemo(
        () => posts.filter(p => isFollowing(p.authorId)),
        [posts, isFollowing]
    )
    const trendingPosts = useMemo(
        () => [...posts].sort((a, b) => getTrendingScore(b) - getTrendingScore(a)),
        [posts]
    )

    return (
        <main className="py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Activity Feed</h1>
                    <p className="text-muted">Stay updated with activity across the Fixars ecosystem</p>
                </div>

                {/* Create Post */}
                {isAuthenticated && <PostComposer onPost={handlePost} />}

                {/* Tabs */}
                <Tabs defaultValue="all" className="mb-6">
                    <TabsList>
                        <TabsTrigger value="all">All Activity</TabsTrigger>
                        <TabsTrigger value="following">Following</TabsTrigger>
                        <TabsTrigger value="trending">
                            <Flame className="w-4 h-4 mr-1" /> Trending
                        </TabsTrigger>
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
                        {/* People to follow */}
                        <Card className="mb-4">
                            <CardContent className="p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    People
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {authors
                                        .filter(a => a.id !== user?.id)
                                        .map(author => (
                                        <div key={author.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/5 border">
                                            <Avatar className="w-7 h-7">
                                                <AvatarImage src={author.avatar} />
                                                <AvatarFallback className="text-xs">{getInitials(author.name)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium text-foreground">{author.name}</span>
                                            <Button
                                                variant={isFollowing(author.id) ? "outline" : "default"}
                                                size="sm"
                                                className="ml-1 h-7 text-xs px-2"
                                                onClick={() => isFollowing(author.id) ? unfollowUser(author.id) : followUser(author.id)}
                                            >
                                                {isFollowing(author.id) ? (
                                                    <><UserMinus className="w-3 h-3 mr-1" /> Unfollow</>
                                                ) : (
                                                    <><UserPlus className="w-3 h-3 mr-1" /> Follow</>
                                                )}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {followingPosts.length > 0 ? (
                            <div className="space-y-4">
                                {followingPosts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onReact={reactToPost}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Users className="w-12 h-12 text-muted mx-auto mb-4" />
                                    <p className="text-muted font-medium">No posts from people you follow</p>
                                    <p className="text-sm text-muted mt-1">Follow users above to see their posts here</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="trending">
                        <div className="space-y-4">
                            {trendingPosts.map((post, idx) => (
                                <div key={post.id} className="relative">
                                    {idx < 3 && (
                                        <div className="absolute -left-2 -top-2 z-10 w-7 h-7 rounded-full gradient-primary flex items-center justify-center shadow-md">
                                            <span className="text-white text-xs font-bold">#{idx + 1}</span>
                                        </div>
                                    )}
                                    <PostCard
                                        post={post}
                                        onReact={reactToPost}
                                    />
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </main>
    )
}
