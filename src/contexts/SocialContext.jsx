import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
    fetchPosts, createPostDB, reactToPostDB,
    fetchConversations, sendMessageDB,
    fetchNotifications, createNotificationDB, markNotificationsReadDB
} from '@/lib/db/social'

const SocialContext = createContext(null)

// Mock data for development
const MOCK_POSTS = [
    {
        id: 'post-001',
        authorId: 'user-002',
        authorName: 'Sarah Chen',
        authorAvatar: null,
        content: 'Just launched my first stake on VestDen! Excited to see how the community responds to my AI-powered tutoring platform idea. 🚀',
        sourceApp: 'vestden',
        linkedEntity: { type: 'stake', id: 'stake-001', name: 'AI Tutoring Platform' },
        reactions: { '👍': 24, '🔥': 12, '💡': 8 },
        commentCount: 7,
        createdAt: '2026-01-20T15:30:00Z',
        visibility: 'public'
    },
    {
        id: 'post-002',
        authorId: 'user-003',
        authorName: 'Marcus Williams',
        authorAvatar: null,
        content: 'Our team just finished a major milestone on Collaboard! Cross-app data sync is now working beautifully across all Fixars apps. 🎉',
        sourceApp: 'collaboard',
        linkedEntity: { type: 'board', id: 'board-001', name: 'Fixars Integration' },
        reactions: { '👍': 45, '🎉': 23, '💪': 15 },
        commentCount: 12,
        createdAt: '2026-01-19T10:00:00Z',
        visibility: 'public'
    },
    {
        id: 'post-003',
        authorId: 'user-004',
        authorName: 'Emily Rodriguez',
        authorAvatar: null,
        content: 'Looking for a React developer with experience in real-time collaboration features. Check out my project on SkillsCanvas! 💼',
        sourceApp: 'skillscanvas',
        linkedEntity: { type: 'talent-request', id: 'req-001', name: 'React Developer Needed' },
        reactions: { '👍': 18, '🙋': 9 },
        commentCount: 5,
        createdAt: '2026-01-18T08:15:00Z',
        visibility: 'public'
    }
]

const MOCK_MESSAGES = [
    {
        id: 'conv-001',
        participants: ['user-001', 'user-002'],
        participantNames: { 'user-001': 'Alex Morgan', 'user-002': 'Sarah Chen' },
        messages: [
            { id: 'm1', senderId: 'user-002', content: 'Hey! I saw your idea on ConceptNexus. Would love to collaborate!', timestamp: '2026-01-20T14:00:00Z', read: true },
            { id: 'm2', senderId: 'user-001', content: 'Thanks Sarah! I\'d love to chat more about it. What aspect interested you?', timestamp: '2026-01-20T14:05:00Z', read: true }
        ],
        lastActivity: '2026-01-20T14:05:00Z',
        unread: 0
    }
]

export function SocialProvider({ children }) {
    const { user } = useAuth()
    const isConfigured = isSupabaseConfigured()

    const [posts, setPosts] = useState(isConfigured ? [] : MOCK_POSTS)
    const [conversations, setConversations] = useState(isConfigured ? [] : MOCK_MESSAGES)
    const [notifications, setNotifications] = useState([])

    // Fetch data from Supabase on mount
    useEffect(() => {
        if (!isConfigured || !user?.id) return

        async function loadSocial() {
            try {
                const [postsData, convsData, notifsData] = await Promise.all([
                    fetchPosts(),
                    fetchConversations(user.id),
                    fetchNotifications(user.id)
                ])
                setPosts(postsData)
                setConversations(convsData)
                setNotifications(notifsData)
            } catch (err) {
                console.error('Error loading social data:', err)
            }
        }

        loadSocial()
    }, [isConfigured, user?.id])

    const createPost = useCallback(async (content, sourceApp = 'fixars', linkedEntity = null) => {
        if (!user) return null

        if (!isConfigured) {
            const newPost = {
                id: 'post-' + Date.now(),
                authorId: user.id,
                authorName: user.name,
                authorAvatar: user.avatar,
                content,
                sourceApp,
                linkedEntity,
                reactions: {},
                commentCount: 0,
                createdAt: new Date().toISOString(),
                visibility: 'public'
            }
            setPosts(prev => [newPost, ...prev])
            return newPost
        }

        const newPost = await createPostDB({
            authorId: user.id,
            authorName: user.name,
            authorAvatar: user.avatar,
            content,
            sourceApp,
            linkedEntity,
            visibility: 'public'
        })
        setPosts(prev => [newPost, ...prev])
        return newPost
    }, [user, isConfigured])

    const reactToPost = useCallback(async (postId, emoji) => {
        if (!isConfigured) {
            setPosts(prev => prev.map(post => {
                if (post.id !== postId) return post
                const reactions = { ...post.reactions }
                reactions[emoji] = (reactions[emoji] || 0) + 1
                return { ...post, reactions }
            }))
            return
        }

        if (user?.id) {
            await reactToPostDB(postId, user.id, emoji)
        }
        // Optimistic update
        setPosts(prev => prev.map(post => {
            if (post.id !== postId) return post
            const reactions = { ...post.reactions }
            reactions[emoji] = (reactions[emoji] || 0) + 1
            return { ...post, reactions }
        }))
    }, [isConfigured, user])

    const sendMessage = useCallback(async (recipientId, recipientName, content) => {
        if (!user) return null

        if (!isConfigured) {
            const existingConv = conversations.find(c =>
                c.participants.includes(user.id) && c.participants.includes(recipientId)
            )

            const newMessage = {
                id: 'm-' + Date.now(),
                senderId: user.id,
                content,
                timestamp: new Date().toISOString(),
                read: false
            }

            if (existingConv) {
                setConversations(prev => prev.map(c => {
                    if (c.id !== existingConv.id) return c
                    return {
                        ...c,
                        messages: [...c.messages, newMessage],
                        lastActivity: newMessage.timestamp
                    }
                }))
            } else {
                const newConv = {
                    id: 'conv-' + Date.now(),
                    participants: [user.id, recipientId],
                    participantNames: { [user.id]: user.name, [recipientId]: recipientName },
                    messages: [newMessage],
                    lastActivity: newMessage.timestamp,
                    unread: 0
                }
                setConversations(prev => [newConv, ...prev])
            }

            return newMessage
        }

        const msg = await sendMessageDB(user.id, user.name, recipientId, recipientName, content)
        // Re-fetch conversations to get updated state
        const updated = await fetchConversations(user.id)
        setConversations(updated)
        return msg
    }, [user, conversations, isConfigured])

    const addNotification = useCallback(async (notification) => {
        const notif = {
            id: 'notif-' + Date.now(),
            ...notification,
            read: false,
            createdAt: new Date().toISOString()
        }

        if (isConfigured && notification.userId) {
            await createNotificationDB(notification)
        }

        setNotifications(prev => [notif, ...prev].slice(0, 50))
    }, [isConfigured])

    const markNotificationsRead = useCallback(async () => {
        if (isConfigured && user?.id) {
            await markNotificationsReadDB(user.id)
        }
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [isConfigured, user])

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <SocialContext.Provider value={{
            posts,
            conversations,
            notifications,
            unreadCount,
            createPost,
            reactToPost,
            sendMessage,
            addNotification,
            markNotificationsRead
        }}>
            {children}
        </SocialContext.Provider>
    )
}

export function useSocial() {
    const context = useContext(SocialContext)
    if (!context) {
        throw new Error('useSocial must be used within a SocialProvider')
    }
    return context
}
