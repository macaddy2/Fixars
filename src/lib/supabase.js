import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
    )
}

// Lazily-created client: only constructed when credentials exist, so no code
// path can fire doomed network requests against a placeholder URL.
let client = null

export function getSupabase() {
    if (!isSupabaseConfigured()) return null
    if (!client) {
        client = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        })
    }
    return client
}

// Kept as a named export for existing imports; it is null when Supabase is not
// configured — all DB access is guarded by isSupabaseConfigured().
export const supabase = new Proxy({}, {
    get(_target, prop) {
        const real = getSupabase()
        if (!real) {
            throw new Error(
                'Supabase is not configured. Guard calls with isSupabaseConfigured() before using the client.'
            )
        }
        const value = real[prop]
        return typeof value === 'function' ? value.bind(real) : value
    }
})

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey)

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
    POST_COMMENTS: 'post_comments',
    FOLLOWS: 'follows',
    CONVERSATIONS: 'conversations',
    CONVERSATION_PARTICIPANTS: 'conversation_participants',
    MESSAGES: 'messages',
    NOTIFICATIONS: 'notifications',
    // Activity & Points
    ACTIVITIES: 'activities',
    POINTS_HISTORY: 'points_history'
}
