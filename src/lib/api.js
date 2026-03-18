import { supabase, isSupabaseConfigured, TABLES } from '@/lib/supabase'

/**
 * Public API client wrapper for Fixars platform.
 * Used by the API Playground for "Try It" functionality.
 */
export class FixarsAPI {
    constructor(apiKey) {
        this.apiKey = apiKey
        this.baseUrl = isSupabaseConfigured()
            ? `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`
            : null
    }

    /** @returns {Headers} */
    _headers() {
        return {
            'Content-Type': 'application/json',
            'apikey': this.apiKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${this.apiKey || import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
        }
    }

    async _request(method, path, body) {
        if (!this.baseUrl) {
            return { data: getMockResponse(path, method), error: null }
        }

        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: this._headers(),
                ...(body ? { body: JSON.stringify(body) } : {})
            })
            const data = await res.json()
            return { data, error: null }
        } catch (error) {
            return { data: null, error: error.message }
        }
    }

    // Stakes
    async getStakes(limit = 20) {
        return this._request('GET', `/stakes?select=*&order=created_at.desc&limit=${limit}`)
    }

    async getStakeById(id) {
        return this._request('GET', `/stakes?id=eq.${id}&select=*`)
    }

    // Ideas
    async getIdeas(limit = 20) {
        return this._request('GET', `/ideas?select=*&order=created_at.desc&limit=${limit}`)
    }

    // Boards
    async getBoards(limit = 20) {
        return this._request('GET', `/boards?select=*&order=created_at.desc&limit=${limit}`)
    }

    // Talents
    async getTalents(limit = 20) {
        return this._request('GET', `/talents?select=*&is_active=eq.true&order=rating.desc&limit=${limit}`)
    }

    // Posts
    async getPosts(limit = 20) {
        return this._request('GET', `/posts?select=*&visibility=eq.public&order=created_at.desc&limit=${limit}`)
    }
}

/**
 * API endpoint definitions for documentation.
 */
export const API_ENDPOINTS = [
    {
        method: 'GET',
        path: '/stakes',
        description: 'List all active investment stakes',
        params: [
            { name: 'limit', type: 'integer', default: '20', description: 'Max results to return' },
            { name: 'category', type: 'string', description: 'Filter by category (tech, marketplace, health)' },
            { name: 'status', type: 'string', description: 'Filter by status (active, funded, expired)' }
        ],
        response: `[{
  "id": "uuid",
  "title": "AI-Powered Recipe Generator",
  "description": "...",
  "category": "tech",
  "risk_level": "medium",
  "target_amount": 15000,
  "current_amount": 9750,
  "status": "active",
  "created_at": "2026-01-10T00:00:00Z"
}]`
    },
    {
        method: 'GET',
        path: '/ideas',
        description: 'List community ideas with validation scores',
        params: [
            { name: 'limit', type: 'integer', default: '20' },
            { name: 'status', type: 'string', description: 'Filter: validating, validated, archived' }
        ],
        response: `[{
  "id": "uuid",
  "title": "Community Solar Grid Network",
  "validation_score": 82,
  "votes_up": 156,
  "votes_down": 18,
  "status": "validated",
  "impact_tags": ["environmental", "community"]
}]`
    },
    {
        method: 'GET',
        path: '/boards',
        description: 'List project collaboration boards',
        params: [
            { name: 'limit', type: 'integer', default: '20' }
        ],
        response: `[{
  "id": "uuid",
  "title": "Fixars Core Development",
  "description": "...",
  "member_count": 3,
  "created_at": "2026-01-01T00:00:00Z"
}]`
    },
    {
        method: 'GET',
        path: '/talents',
        description: 'List active talent profiles',
        params: [
            { name: 'limit', type: 'integer', default: '20' },
            { name: 'availability', type: 'string', description: 'Filter: full-time, part-time, contract' }
        ],
        response: `[{
  "id": "uuid",
  "display_name": "Jessica Lee",
  "hourly_rate": 95,
  "rating": 4.9,
  "availability": "part-time",
  "skills": [{"name": "React", "level": "expert"}]
}]`
    },
    {
        method: 'GET',
        path: '/posts',
        description: 'List public social feed posts',
        params: [
            { name: 'limit', type: 'integer', default: '50' },
            { name: 'source_app', type: 'string', description: 'Filter by source app' }
        ],
        response: `[{
  "id": "uuid",
  "author_name": "Sarah Chen",
  "content": "Just launched my first stake!",
  "source_app": "vestden",
  "reactions": {"👍": 24, "🔥": 12},
  "created_at": "2026-01-20T15:30:00Z"
}]`
    },
    {
        method: 'POST',
        path: '/stakes',
        description: 'Create a new investment stake',
        params: [
            { name: 'title', type: 'string', required: true },
            { name: 'description', type: 'string', required: true },
            { name: 'target_amount', type: 'number', required: true },
            { name: 'category', type: 'string', default: 'other' },
            { name: 'risk_level', type: 'string', default: 'medium' }
        ],
        response: `{
  "id": "uuid",
  "title": "New Stake",
  "status": "active",
  "created_at": "2026-01-20T00:00:00Z"
}`
    }
]

// Mock responses for demo mode
function getMockResponse(path, method) {
    if (path.includes('/stakes')) return [{ id: 'demo-1', title: 'Demo Stake', status: 'active', target_amount: 10000, current_amount: 5000 }]
    if (path.includes('/ideas')) return [{ id: 'demo-1', title: 'Demo Idea', validation_score: 75, status: 'validating' }]
    if (path.includes('/boards')) return [{ id: 'demo-1', title: 'Demo Board', member_count: 3 }]
    if (path.includes('/talents')) return [{ id: 'demo-1', display_name: 'Demo Talent', rating: 4.5, hourly_rate: 80 }]
    if (path.includes('/posts')) return [{ id: 'demo-1', author_name: 'Demo User', content: 'Hello Fixars!' }]
    return []
}
