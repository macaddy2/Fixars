import { supabase } from '@/lib/supabase'

/**
 * Fetch all active talent profiles with their skills
 */
export async function fetchTalents() {
    const { data: talents, error } = await supabase
        .from('talents')
        .select(`
            *,
            profile:profiles!talents_user_id_fkey(display_name, email, avatar_url, bio, skills),
            talent_skills:skills(*)
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false })

    if (error) {
        console.error('Error fetching talents:', error)
        return []
    }

    return talents.map(t => ({
        id: t.id,
        userId: t.user_id,
        displayName: t.profile?.display_name || 'Unknown',
        email: t.profile?.email,
        avatar: t.profile?.avatar_url,
        bio: t.profile?.bio,
        hourlyRate: t.hourly_rate,
        availability: t.availability,
        portfolio: t.portfolio || [],
        completedProjects: t.completed_projects,
        rating: parseFloat(t.rating) || 0,
        reviewCount: t.review_count,
        skills: (t.talent_skills || []).map(s => ({
            name: s.name,
            level: s.level,
            verified: s.verified
        })),
        isActive: t.is_active,
        createdAt: t.created_at
    }))
}

/**
 * Fetch a single talent by ID
 */
export async function fetchTalentById(talentId) {
    const { data, error } = await supabase
        .from('talents')
        .select(`
            *,
            profile:profiles!talents_user_id_fkey(display_name, email, avatar_url, bio, skills),
            talent_skills:skills(*),
            talent_reviews:reviews(*, reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url))
        `)
        .eq('id', talentId)
        .single()

    if (error) {
        console.error('Error fetching talent:', error)
        return null
    }

    return {
        id: data.id,
        userId: data.user_id,
        displayName: data.profile?.display_name || 'Unknown',
        email: data.profile?.email,
        avatar: data.profile?.avatar_url,
        bio: data.profile?.bio,
        hourlyRate: data.hourly_rate,
        availability: data.availability,
        portfolio: data.portfolio || [],
        completedProjects: data.completed_projects,
        rating: parseFloat(data.rating) || 0,
        reviewCount: data.review_count,
        skills: (data.talent_skills || []).map(s => ({
            name: s.name,
            level: s.level,
            verified: s.verified
        })),
        reviews: (data.talent_reviews || []).map(r => ({
            id: r.id,
            rating: r.rating,
            content: r.content,
            projectTitle: r.project_title,
            reviewerName: r.reviewer?.display_name || 'Anonymous',
            reviewerAvatar: r.reviewer?.avatar_url,
            createdAt: r.created_at
        })),
        isActive: data.is_active,
        createdAt: data.created_at
    }
}

/**
 * Create a new talent profile
 */
export async function createTalentProfile(userId, profileData) {
    const { data, error } = await supabase
        .from('talents')
        .insert({
            user_id: userId,
            hourly_rate: profileData.hourlyRate,
            availability: profileData.availability || 'unavailable',
            portfolio: profileData.portfolio || [],
            is_active: true
        })
        .select()
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

    return data
}

/**
 * Update a talent profile
 */
export async function updateTalentProfile(talentId, updates) {
    const { data, error } = await supabase
        .from('talents')
        .update({
            hourly_rate: updates.hourlyRate,
            availability: updates.availability,
            portfolio: updates.portfolio,
            is_active: updates.isActive
        })
        .eq('id', talentId)
        .select()
        .single()

    if (error) {
        console.error('Error updating talent:', error)
        throw error
    }

    return data
}
