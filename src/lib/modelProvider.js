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

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export const geminiProvider = createModelProvider({
    name: 'gemini',
    isConfigured: () => !!GEMINI_API_KEY && GEMINI_API_KEY !== 'placeholder',
    async generateJSON(prompt) {
        if (!geminiProvider.isConfigured()) return null

        try {
            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_API_KEY,
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                        responseMimeType: 'application/json'
                    }
                })
            })

            if (!response.ok) return null

            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            return text ? JSON.parse(text) : null
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
