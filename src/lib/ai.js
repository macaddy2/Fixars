/**
 * AI-powered recommendation engine for Fixars.
 * Uses Gemini API when VITE_GEMINI_API_KEY is available,
 * falls back to heuristic-based recommendations.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

/**
 * Check if Gemini is available
 */
export function isAIConfigured() {
    return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'placeholder'
}

/**
 * Call the Gemini API  
 */
async function callGemini(prompt) {
    if (!isAIConfigured()) return null

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
        console.warn('Gemini API error:', err)
        return null
    }
}

/**
 * Get AI-powered idea recommendations.
 * Returns an array of { idea, matchReason, score }.
 */
export async function getIdeaRecommendations(ideas, userProfile = {}) {
    // Try Gemini first
    if (isAIConfigured() && ideas.length > 0) {
        const ideaSummaries = ideas.slice(0, 20).map(i => ({
            id: i.id,
            title: i.title,
            description: i.description?.slice(0, 100),
            category: i.category,
            validationScore: i.validationScore,
            tags: i.impactTags
        }))

        const prompt = `You are a recommendation engine for an idea validation platform.
Given these ideas: ${JSON.stringify(ideaSummaries)}

And this user profile: ${JSON.stringify({
            interests: userProfile.interests || ['technology', 'sustainability'],
            skills: userProfile.skills || [],
            pastVotes: userProfile.pastVotes || []
        })}

Return a JSON array of the top 5 recommended ideas with this format:
[{"ideaId": "...", "matchReason": "short reason why this matches", "score": 0.0-1.0}]
Only return the JSON array, nothing else.`

        const aiResult = await callGemini(prompt)
        if (aiResult && Array.isArray(aiResult)) {
            return aiResult
                .map(rec => ({
                    idea: ideas.find(i => i.id === rec.ideaId),
                    matchReason: rec.matchReason,
                    score: rec.score
                }))
                .filter(r => r.idea)
        }
    }

    // Heuristic fallback: score by validation + tag diversity
    return getHeuristicRecommendations(ideas, userProfile)
}

/**
 * Heuristic recommendation engine (no AI needed).
 * Uses tag overlap, validation score, and recency.
 */
export function getHeuristicRecommendations(ideas, userProfile = {}) {
    const userInterests = new Set(
        userProfile.interests || ['technology', 'sustainability', 'community']
    )

    return ideas
        .map(idea => {
            let score = 0
            const reasons = []

            // Tag overlap
            const tagMatch = (idea.impactTags || []).filter(t =>
                userInterests.has(t)
            )
            if (tagMatch.length > 0) {
                score += tagMatch.length * 0.25
                reasons.push(`Matches your interest in ${tagMatch[0]}`)
            }

            // Validation momentum
            if (idea.validationScore > 70) {
                score += 0.3
                reasons.push('Strong community validation')
            } else if (idea.validationScore > 40) {
                score += 0.1
                reasons.push('Growing community interest')
            }

            // Recency bonus
            const daysOld = (Date.now() - new Date(idea.createdAt).getTime()) / 86400000
            if (daysOld < 7) {
                score += 0.2
                reasons.push('Newly posted')
            }

            // Vote momentum
            const totalVotes = (idea.votes?.up || 0) + (idea.votes?.down || 0)
            if (totalVotes > 50) {
                score += 0.15
                reasons.push('High engagement')
            }

            return {
                idea,
                matchReason: reasons[0] || 'Recommended for you',
                score: Math.min(score, 1)
            }
        })
        .filter(r => r.score > 0.1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
}

/**
 * Get similar ideas based on tag overlap.
 */
export function getSimilarIdeas(idea, allIdeas) {
    const sourceTags = new Set(idea.impactTags || [])
    if (sourceTags.size === 0) return []

    return allIdeas
        .filter(i => i.id !== idea.id)
        .map(i => {
            const overlap = (i.impactTags || []).filter(t => sourceTags.has(t))
            return { idea: i, overlap: overlap.length }
        })
        .filter(r => r.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 3)
        .map(r => r.idea)
}
