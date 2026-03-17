import { supabase, TABLES } from '@/lib/supabase'

// ── Fetch public posts ──
export async function fetchPosts() {
    const { data: posts, error } = await supabase
        .from(TABLES.POSTS)
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) throw error
    if (!posts?.length) return []

    // Fetch aggregated reactions
    const postIds = posts.map(p => p.id)
    const { data: reactions } = await supabase
        .from(TABLES.POST_REACTIONS)
        .select('post_id, emoji')
        .in('post_id', postIds)

    // Aggregate reactions per post
    const reactionMap = {}
    for (const r of (reactions || [])) {
        if (!reactionMap[r.post_id]) reactionMap[r.post_id] = {}
        reactionMap[r.post_id][r.emoji] = (reactionMap[r.post_id][r.emoji] || 0) + 1
    }

    return posts.map(post => ({
        id: post.id,
        authorId: post.author_id,
        authorName: post.author_name,
        authorAvatar: post.author_avatar,
        content: post.content,
        sourceApp: post.source_app,
        linkedEntity: post.linked_entity_type ? {
            type: post.linked_entity_type,
            id: post.linked_entity_id,
            name: post.linked_entity_name
        } : null,
        reactions: reactionMap[post.id] || {},
        commentCount: post.comment_count,
        createdAt: post.created_at,
        visibility: post.visibility
    }))
}

// ── Create a post ──
export async function createPostDB(post) {
    const { data, error } = await supabase
        .from(TABLES.POSTS)
        .insert({
            author_id: post.authorId,
            author_name: post.authorName,
            author_avatar: post.authorAvatar || null,
            content: post.content,
            source_app: post.sourceApp || 'fixars',
            linked_entity_type: post.linkedEntity?.type || null,
            linked_entity_id: post.linkedEntity?.id || null,
            linked_entity_name: post.linkedEntity?.name || null,
            visibility: post.visibility || 'public'
        })
        .select()
        .single()

    if (error) throw error

    return {
        id: data.id,
        authorId: data.author_id,
        authorName: data.author_name,
        authorAvatar: data.author_avatar,
        content: data.content,
        sourceApp: data.source_app,
        linkedEntity: data.linked_entity_type ? {
            type: data.linked_entity_type,
            id: data.linked_entity_id,
            name: data.linked_entity_name
        } : null,
        reactions: {},
        commentCount: 0,
        createdAt: data.created_at,
        visibility: data.visibility
    }
}

// ── React to a post ──
export async function reactToPostDB(postId, userId, emoji) {
    const { error } = await supabase
        .from(TABLES.POST_REACTIONS)
        .insert({
            post_id: postId,
            user_id: userId,
            emoji
        })

    if (error && error.code !== '23505') throw error // Ignore duplicate
}

// ── Fetch conversations for a user ──
export async function fetchConversations(userId) {
    const { data: participantRows } = await supabase
        .from(TABLES.CONVERSATION_PARTICIPANTS)
        .select('conversation_id')
        .eq('user_id', userId)

    if (!participantRows?.length) return []

    const convIds = participantRows.map(r => r.conversation_id)

    const [convsRes, allParticipants, messagesRes] = await Promise.all([
        supabase.from(TABLES.CONVERSATIONS).select('*').in('id', convIds).order('last_activity', { ascending: false }),
        supabase.from(TABLES.CONVERSATION_PARTICIPANTS).select('*').in('conversation_id', convIds),
        supabase.from(TABLES.MESSAGES).select('*').in('conversation_id', convIds).order('created_at')
    ])

    const convs = convsRes.data || []
    const participants = allParticipants.data || []
    const messages = messagesRes.data || []

    return convs.map(conv => {
        const convParticipants = participants.filter(p => p.conversation_id === conv.id)
        const participantNames = {}
        const participantIds = []
        for (const p of convParticipants) {
            participantNames[p.user_id] = p.user_name
            participantIds.push(p.user_id)
        }
        const myParticipant = convParticipants.find(p => p.user_id === userId)

        return {
            id: conv.id,
            participants: participantIds,
            participantNames,
            messages: messages
                .filter(m => m.conversation_id === conv.id)
                .map(m => ({
                    id: m.id,
                    senderId: m.sender_id,
                    content: m.content,
                    timestamp: m.created_at,
                    read: m.read
                })),
            lastActivity: conv.last_activity,
            unread: myParticipant?.unread_count || 0
        }
    })
}

// ── Send a message ──
export async function sendMessageDB(userId, userName, recipientId, recipientName, content) {
    // Check for existing conversation between these two users
    const { data: myConvs } = await supabase
        .from(TABLES.CONVERSATION_PARTICIPANTS)
        .select('conversation_id')
        .eq('user_id', userId)

    let conversationId = null

    if (myConvs?.length) {
        const myConvIds = myConvs.map(c => c.conversation_id)
        const { data: match } = await supabase
            .from(TABLES.CONVERSATION_PARTICIPANTS)
            .select('conversation_id')
            .eq('user_id', recipientId)
            .in('conversation_id', myConvIds)
            .limit(1)

        if (match?.length) {
            conversationId = match[0].conversation_id
        }
    }

    // Create new conversation via RPC (bypasses RLS to add both participants)
    if (!conversationId) {
        const { data: convId, error: rpcError } = await supabase
            .rpc('create_dm_conversation', {
                p_user_id: userId,
                p_user_name: userName,
                p_recipient_id: recipientId,
                p_recipient_name: recipientName
            })

        if (rpcError) throw rpcError
        conversationId = convId
    }

    // Insert the message
    const { data: msg, error } = await supabase
        .from(TABLES.MESSAGES)
        .insert({
            conversation_id: conversationId,
            sender_id: userId,
            content
        })
        .select()
        .single()

    if (error) throw error

    return {
        id: msg.id,
        senderId: msg.sender_id,
        content: msg.content,
        timestamp: msg.created_at,
        read: false
    }
}

// ── Fetch notifications ──
export async function fetchNotifications(userId) {
    const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) throw error

    return (data || []).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        sourceApp: n.source_app,
        linkedEntityType: n.linked_entity_type,
        linkedEntityId: n.linked_entity_id,
        read: n.read,
        createdAt: n.created_at
    }))
}

// ── Create a notification ──
export async function createNotificationDB(notification) {
    const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .insert({
            user_id: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            source_app: notification.sourceApp || null,
            linked_entity_type: notification.linkedEntityType || null,
            linked_entity_id: notification.linkedEntityId || null
        })

    if (error) throw error
}

// ── Mark all notifications read ──
export async function markNotificationsReadDB(userId) {
    const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

    if (error) throw error
}
