/**
 * Model provider seam — model-agnostic by design.
 *
 * FCL principle (docs/fcl-spec.md §0): actions, guards and policies never
 * assume a model vendor. Anything that needs generated output talks to a
 * provider through this interface; swapping the underlying model (Gemini
 * today, another provider tomorrow, or none) must never require changes
 * outside this file.
 *
 * A provider is `{ name, isConfigured(), generateJSON(prompt) }` where
 * `generateJSON` resolves to parsed JSON, or `null` on any failure so
 * callers can fall back to deterministic heuristics.
 */

export function createModelProvider({ name, isConfigured, generateJSON }) {
    return Object.freeze({ name, isConfigured, generateJSON })
}

// ── Gemini — the first provider ──────────────────────────────────────────
// SECURITY: the Gemini key lives ONLY on the server (GEMINI_API_KEY secret of
// the `gemini-proxy` Edge Function). The browser never holds or sends a key.

import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const geminiProvider = createModelProvider({
    name: 'gemini',
    isConfigured: () => isSupabaseConfigured(),
    async generateJSON(prompt) {
        if (!geminiProvider.isConfigured()) return null

        try {
            const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                body: { prompt }
            })
            if (error || !data?.text) return null
            return JSON.parse(data.text)
        } catch (err) {
            console.warn(`${geminiProvider.name} provider error:`, err)
            return null
        }
    }
})

export function getDefaultProvider() {
    return geminiProvider
}

export function isProviderConfigured() {
    return getDefaultProvider().isConfigured()
}
