import { useState, useEffect } from 'react'
import { useData } from '@/contexts/DataContext'
import { fetchTalentById } from '@/lib/db/talents'
import { isSupabaseConfigured } from '@/lib/supabase'

/**
 * Filtered view over the shared talent store (DataContext).
 *
 * There is exactly one source of truth for talents — DataContext.talents —
 * so profiles created via ListSkillsModal appear everywhere immediately,
 * including TalentProfile deep links. All consumers use the camelCase shape:
 * { id, userId, displayName, bio, skills[], availability, hourlyRate, ... }
 */
export function useTalents(options = {}) {
    const { search = '', availability = 'all', skillFilter = '' } = options
    const { talents, loading } = useData()

    const filtered = talents.filter(t => {
        const haystackName = (t.displayName || '').toLowerCase()
        const haystackBio = (t.bio || '').toLowerCase()

        if (search) {
            const q = search.toLowerCase()
            const matchesSearch =
                haystackName.includes(q) ||
                haystackBio.includes(q) ||
                t.skills?.some(s => s.name.toLowerCase().includes(q))
            if (!matchesSearch) return false
        }

        if (availability !== 'all' && t.availability !== availability) return false

        if (skillFilter && !t.skills?.some(s => s.name.toLowerCase().includes(skillFilter.toLowerCase()))) {
            return false
        }

        return true
    })

    return { talents: filtered, loading, error: null }
}

/**
 * Single talent lookup. Reads from the shared store first (covers newly
 * created profiles), then falls back to a direct DB fetch for deep links
 * landing before/without the full list (e.g. inactive profiles).
 */
export function useTalent(talentId) {
    const { talents } = useData()
    const [fetched, setFetched] = useState(null)
    const [loading, setLoading] = useState(Boolean(talentId))
    const [error, setError] = useState(null)

    const fromStore = talents.find(t => t.id === talentId)

    useEffect(() => {
        if (!talentId) {
            setLoading(false)
            return
        }
        if (fromStore) {
            setLoading(false)
            setError(null)
            return
        }

        let cancelled = false
        async function load() {
            setLoading(true)
            setError(null)
            try {
                if (!isSupabaseConfigured()) {
                    setLoading(false)
                    return
                }
                const talent = await fetchTalentById(talentId)
                if (!cancelled) setFetched(talent)
            } catch (err) {
                console.error('Error fetching talent:', err)
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [talentId, fromStore])

    return { talent: fromStore || fetched, loading, error }
}
