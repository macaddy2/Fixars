import { supabase } from '@/lib/supabase'

/**
 * Map a joined talent row (talents + profile + skills) to the camelCase
 * shape used across the app (DataContext, SkillsCanvas, TalentProfile).
 */
function mapTalent(t, reviews = null) {
    const mapped = {
        id: t.id,
        userId: t.user_id,
        displayName: t.profile?.display_name || 'Unknown',
        avatar: t.profile?.avatar_url,
        bio: t.profile?.bio,
        hourlyRate: t.hourly_rate == null ? null : Number(t.hourly_rate),
        availability: t.availability,
        portfolio: t.portfolio || [],
        completedProjects: t.completed_projects || 0,
        rating: parseFloat(t.rating) || 0,
        reviewCount: t.review_count || 0,
        proofPoints: t.proof_points ?? 0,
        deliveryScore: t.delivery_score == null ? null : Number(t.delivery_score),
        reputation: t.reputation ?? 500,
        verifiedBadge: Boolean(t.verified),
        skills: (t.talent_skills || t.skills || []).map(s => ({
            id: s.id,
            name: s.name,
            level: s.level,
            verified: s.verified
        })),
        isActive: t.is_active,
        createdAt: t.created_at
    }
    if (reviews) {
        mapped.reviews = reviews
    }
    return mapped
}

/**
 * Fetch all active talent profiles with their skills
 */
export async function fetchTalents() {
    const { data: talents, error } = await supabase
        .from('talents')
        .select(`
            *,
            profile:profiles!talents_user_id_fkey(display_name, avatar_url, bio),
            talent_skills:skills(*)
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(200)

    if (error) {
        console.error('Error fetching talents:', error)
        return []
    }

    return talents.map(t => mapTalent(t))
}

/**
 * Fetch a single talent by ID
 */
export async function fetchTalentById(talentId) {
    const { data, error } = await supabase
        .from('talents')
        .select(`
            *,
            profile:profiles!talents_user_id_fkey(display_name, avatar_url, bio),
            talent_skills:skills(*),
            talent_reviews:reviews(*, reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url))
        `)
        .eq('id', talentId)
        .single()

    if (error) {
        console.error('Error fetching talent:', error)
        return null
    }

    const reviews = (data.talent_reviews || []).map(r => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        projectTitle: r.project_title,
        reviewerName: r.reviewer?.display_name || 'Anonymous',
        reviewerAvatar: r.reviewer?.avatar_url,
        createdAt: r.created_at
    }))

    return mapTalent(data, reviews)
}

/**
 * Create a new talent profile
 * @param {string} userId - the auth user id (must match auth.uid() for RLS)
 * @param {object} profileData - camelCase payload from ListSkillsModal
 */
export async function createTalentProfile(userId, profileData) {
    if (!userId) throw new Error('createTalentProfile requires a userId')

    const { data, error } = await supabase
        .from('talents')
        .insert({
            user_id: userId,
            hourly_rate: profileData.hourlyRate,
            availability: profileData.availability || 'unavailable',
            portfolio: profileData.portfolio || [],
            is_active: true
        })
        .select(`
            *,
            profile:profiles!talents_user_id_fkey(display_name, avatar_url, bio),
            talent_skills:skills(*)
        `)
        .single()

    if (error) {
        console.error('Error creating talent profile:', error)
        throw error
    }

    // Add skills if provided
    if (profileData.skills && profileData.skills.length > 0) {
        const skillRows = profileData.skills.map(s => ({
            talent_id: data.id,
            name: s.name,
            level: s.level || 'intermediate'
        }))

        const { error: skillError } = await supabase
            .from('skills')
            .insert(skillRows)

        if (skillError) {
            console.error('Error adding skills:', skillError)
        }
    }

    // Best-effort sync of display name / bio onto the public profile
    const profileUpdates = {}
    if (profileData.displayName) profileUpdates.display_name = profileData.displayName
    if (profileData.bio) profileUpdates.bio = profileData.bio
    if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId)
        if (profileError) console.error('Error updating profile:', profileError)
    }

    return mapTalent({
        ...data,
        talent_skills: [
            ...(data.talent_skills || []),
            ...(profileData.skills || []).map((s, i) => ({ id: `new-${i}`, ...s }))
        ]
    })
}

/**
 * Update a talent profile
 */
export async function updateTalentProfile(talentId, updates) {
    const payload = {}
    if (updates.hourlyRate !== undefined) payload.hourly_rate = updates.hourlyRate
    if (updates.availability !== undefined) payload.availability = updates.availability
    if (updates.portfolio !== undefined) payload.portfolio = updates.portfolio
    if (updates.isActive !== undefined) payload.is_active = updates.isActive

    const { data, error } = await supabase
        .from('talents')
        .update(payload)
        .eq('id', talentId)
        .select(`
            *,
            profile:profiles!talents_user_id_fkey(display_name, avatar_url, bio),
            talent_skills:skills(*)
        `)
        .single()

    if (error) {
        console.error('Error updating talent:', error)
        throw error
    }

    // Replace skills if a new list is provided
    if (updates.skills) {
        await supabase.from('skills').delete().eq('talent_id', talentId)
        if (updates.skills.length > 0) {
            await supabase.from('skills').insert(
                updates.skills.map(s => ({
                    talent_id: talentId,
                    name: s.name,
                    level: s.level || 'intermediate'
                }))
            )
        }
    }

    return mapTalent({
        ...data,
        talent_skills: updates.skills || data.talent_skills || []
    })
}
