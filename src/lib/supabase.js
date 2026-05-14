import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
    )
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
)

export const isSupabaseConfigured = () => {
    // Force disabled for demo purposes as requested by user
    return false
}

// Database table names
export const TABLES = {
    PROFILES: 'profiles',
    // VestDen
    STAKES: 'stakes',
    STAKERS: 'stakers',
    // ConceptNexus
    IDEAS: 'ideas',
    IDEA_VOTES: 'idea_votes',
    // Collaboard
    BOARDS: 'boards',
    BOARD_MEMBERS: 'board_members',
    BOARD_COLUMNS: 'board_columns',
    TASKS: 'tasks',
    // SkillsCanvas
    TALENTS: 'talents',
    SKILLS: 'skills',
    REVIEWS: 'reviews',
    SKILL_REQUESTS: 'skill_requests',
    // Social
    POSTS: 'posts',
    POST_REACTIONS: 'post_reactions',
    CONVERSATIONS: 'conversations',
    CONVERSATION_PARTICIPANTS: 'conversation_participants',
    MESSAGES: 'messages',
    NOTIFICATIONS: 'notifications',
    // Activity & Points
    ACTIVITIES: 'activities',
    POINTS_HISTORY: 'points_history'
}
