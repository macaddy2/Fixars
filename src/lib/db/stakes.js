import { supabase, TABLES } from '@/lib/supabase'

// ── Fetch all stakes ──
export async function fetchStakes() {
    const { data: stakes, error } = await supabase
        .from(TABLES.STAKES)
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch stakers for each stake
    if (stakes?.length) {
        const stakeIds = stakes.map(s => s.id)
        const { data: stakers } = await supabase
            .from(TABLES.STAKERS)
            .select('*')
            .in('stake_id', stakeIds)
            .order('created_at', { ascending: true })

        return stakes.map(stake => ({
            id: stake.id,
            title: stake.title,
            description: stake.description,
            creatorId: stake.creator_id,
            creatorName: stake.creator_name,
            category: stake.category,
            riskLevel: stake.risk_level,
            targetAmount: Number(stake.target_amount),
            currentAmount: Number(stake.current_amount),
            expectedReturns: stake.expected_returns,
            deadline: stake.deadline,
            status: stake.status,
            linkedIdeaId: stake.linked_idea_id,
            createdAt: stake.created_at,
            stakers: (stakers || [])
                .filter(s => s.stake_id === stake.id)
                .map(s => ({
                    userId: s.user_id,
                    amount: Number(s.amount),
                    date: s.created_at
                }))
        }))
    }

    return []
}

// ── Create a new stake ──
export async function createStakeDB(stake) {
    const { data, error } = await supabase
        .from(TABLES.STAKES)
        .insert({
            title: stake.title,
            description: stake.description,
            creator_id: stake.creatorId,
            creator_name: stake.creatorName,
            category: stake.category || 'other',
            risk_level: stake.riskLevel || 'medium',
            target_amount: stake.targetAmount,
            expected_returns: stake.expectedReturns,
            deadline: stake.deadline,
            linked_idea_id: stake.linkedIdeaId || null
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
        riskLevel: data.risk_level,
        targetAmount: Number(data.target_amount),
        currentAmount: 0,
        expectedReturns: data.expected_returns,
        deadline: data.deadline,
        status: data.status,
        linkedIdeaId: data.linked_idea_id,
        createdAt: data.created_at,
        stakers: []
    }
}

// ── Make a stake (invest) ──
export async function makeStakeDB(stakeId, userId, amount) {
    const { error } = await supabase
        .from(TABLES.STAKERS)
        .insert({
            stake_id: stakeId,
            user_id: userId,
            amount
        })

    if (error) throw error
    // The DB trigger auto-updates the stake's current_amount and status
}

// ── Link stake to idea ──
export async function linkStakeToIdeaDB(stakeId, ideaId) {
    const { error } = await supabase
        .from(TABLES.STAKES)
        .update({ linked_idea_id: ideaId })
        .eq('id', stakeId)

    if (error) throw error
}
