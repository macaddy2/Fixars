import { supabase, TABLES } from '@/lib/supabase'

// ── Fetch all ideas ──
export async function fetchIdeas() {
    const { data: ideas, error } = await supabase
        .from(TABLES.IDEAS)
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch validators (votes with comments)
    if (ideas?.length) {
        const ideaIds = ideas.map(i => i.id)
        const { data: votes } = await supabase
            .from(TABLES.IDEA_VOTES)
            .select('*')
            .in('idea_id', ideaIds)

        return ideas.map(idea => ({
            id: idea.id,
            title: idea.title,
            description: idea.description,
            creatorId: idea.creator_id,
            creatorName: idea.creator_name,
            category: idea.category,
            validationScore: idea.validation_score,
            votes: { up: idea.upvotes, down: idea.downvotes },
            validators: (votes || [])
                .filter(v => v.idea_id === idea.id && v.comment)
                .map(v => ({
                    userId: v.user_id,
                    badge: v.badge || '',
                    vote: v.vote,
                    comment: v.comment
                })),
            status: idea.status,
            impactTags: idea.impact_tags || [],
            linkedStakeId: idea.linked_stake_id,
            linkedBoardId: idea.linked_board_id,
            createdAt: idea.created_at
        }))
    }

    return []
}

// ── Submit a new idea ──
export async function submitIdeaDB(idea) {
    const { data, error } = await supabase
        .from(TABLES.IDEAS)
        .insert({
            title: idea.title,
            description: idea.description,
            creator_id: idea.creatorId,
            creator_name: idea.creatorName,
            category: idea.category || 'general',
            impact_tags: idea.impactTags || []
        })
        .select()
        .single()

    if (error) throw error

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        creatorId: data.creator_id,
        creatorName: data.creator_name,
        category: data.category,
        validationScore: 0,
        votes: { up: 0, down: 0 },
        validators: [],
        status: data.status,
        impactTags: data.impact_tags || [],
        linkedStakeId: null,
        linkedBoardId: null,
        createdAt: data.created_at
    }
}

// ── Vote on an idea ──
export async function voteIdeaDB(ideaId, userId, vote, comment = null, badge = null) {
    const { error } = await supabase
        .from(TABLES.IDEA_VOTES)
        .insert({
            idea_id: ideaId,
            user_id: userId,
            vote,
            comment,
            badge
        })

    if (error) throw error
    // DB trigger auto-recalculates upvotes, downvotes, validation_score, and status
}

// ── Link idea to board ──
export async function linkIdeaToBoardDB(ideaId, boardId) {
    const { error } = await supabase
        .from(TABLES.IDEAS)
        .update({ linked_board_id: boardId })
        .eq('id', ideaId)

    if (error) throw error
}

// ── Link idea to stake ──
export async function linkIdeaToStakeDB(ideaId, stakeId) {
    const { error } = await supabase
        .from(TABLES.IDEAS)
        .update({ linked_stake_id: stakeId })
        .eq('id', ideaId)

    if (error) throw error
}
