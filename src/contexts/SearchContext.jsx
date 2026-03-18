import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useData } from './DataContext'

const SearchContext = createContext(null)

function fuzzyMatch(text, query) {
    if (!text || !query) return { match: false, score: 0 }
    const lower = text.toLowerCase()
    const q = query.toLowerCase()
    
    // Exact substring match (highest score)
    if (lower.includes(q)) {
        const score = q.length / lower.length
        return { match: true, score: score + 1 }
    }
    
    // Word-start matching
    const words = lower.split(/\s+/)
    const matchedWords = words.filter(w => w.startsWith(q))
    if (matchedWords.length > 0) {
        return { match: true, score: 0.5 }
    }

    return { match: false, score: 0 }
}

function highlightMatch(text, query) {
    if (!text || !query) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return {
        before: text.slice(0, idx),
        match: text.slice(idx, idx + query.length),
        after: text.slice(idx + query.length)
    }
}

export function SearchProvider({ children }) {
    const { stakes, ideas, boards, talents } = useData()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')

    const results = useMemo(() => {
        if (!query || query.length < 2) {
            return { stakes: [], ideas: [], boards: [], talents: [], total: 0 }
        }

        const searchStakes = stakes
            .map(s => {
                const titleMatch = fuzzyMatch(s.title, query)
                const descMatch = fuzzyMatch(s.description, query)
                const catMatch = fuzzyMatch(s.category, query)
                const bestScore = Math.max(titleMatch.score, descMatch.score * 0.7, catMatch.score * 0.5)
                return { ...s, _score: bestScore, _matched: titleMatch.match || descMatch.match || catMatch.match }
            })
            .filter(s => s._matched)
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)

        const searchIdeas = ideas
            .map(i => {
                const titleMatch = fuzzyMatch(i.title, query)
                const descMatch = fuzzyMatch(i.description, query)
                const tagMatch = (i.impactTags || []).some(t => fuzzyMatch(t, query).match)
                const bestScore = Math.max(titleMatch.score, descMatch.score * 0.7, tagMatch ? 0.4 : 0)
                return { ...i, _score: bestScore, _matched: titleMatch.match || descMatch.match || tagMatch }
            })
            .filter(i => i._matched)
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)

        const searchBoards = boards
            .map(b => {
                const titleMatch = fuzzyMatch(b.title, query)
                const descMatch = fuzzyMatch(b.description, query)
                const bestScore = Math.max(titleMatch.score, descMatch.score * 0.7)
                return { ...b, _score: bestScore, _matched: titleMatch.match || descMatch.match }
            })
            .filter(b => b._matched)
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)

        const searchTalents = talents
            .map(t => {
                const nameMatch = fuzzyMatch(t.displayName, query)
                const bioMatch = fuzzyMatch(t.bio, query)
                const skillMatch = (t.skills || []).some(s => fuzzyMatch(s.name, query).match)
                const bestScore = Math.max(nameMatch.score, bioMatch.score * 0.5, skillMatch ? 0.6 : 0)
                return { ...t, _score: bestScore, _matched: nameMatch.match || bioMatch.match || skillMatch }
            })
            .filter(t => t._matched)
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)

        return {
            stakes: searchStakes,
            ideas: searchIdeas,
            boards: searchBoards,
            talents: searchTalents,
            total: searchStakes.length + searchIdeas.length + searchBoards.length + searchTalents.length
        }
    }, [query, stakes, ideas, boards, talents])

    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => { setIsOpen(false); setQuery('') }, [])
    const toggle = useCallback(() => {
        setIsOpen(prev => {
            if (prev) setQuery('')
            return !prev
        })
    }, [])

    return (
        <SearchContext.Provider value={{
            isOpen, query, results,
            setQuery, open, close, toggle,
            highlightMatch
        }}>
            {children}
        </SearchContext.Provider>
    )
}

export function useSearch() {
    const context = useContext(SearchContext)
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider')
    }
    return context
}
