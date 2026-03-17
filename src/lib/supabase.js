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

// Helper to check if Supabase is configured with real credentials
export const isSupabaseConfigured = () => {
    // Check if values exist
    if (!supabaseUrl || !supabaseAnonKey) return false

    // List of common placeholder patterns to detect
    const placeholderPatterns = [
        'placeholder',
        'your-project',
        'your_project',
        'example',
        'xxx',
        'REPLACE_ME',
        'todo',
        'localhost'
    ]

    const urlLower = supabaseUrl.toLowerCase()
    const keyLower = supabaseAnonKey.toLowerCase()

    // Check for placeholder patterns in URL or key
    for (const pattern of placeholderPatterns) {
        if (urlLower.includes(pattern) || keyLower.includes(pattern)) {
            return false
        }
    }

    // Check for valid Supabase URL format (should end with .supabase.co)
    if (!supabaseUrl.includes('.supabase.co')) {
        return false
    }

    return true
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
