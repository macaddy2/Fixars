import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '@/contexts/SearchContext'
import {
    Search, X, TrendingUp, Lightbulb,
    LayoutGrid, Palette, ArrowRight, CornerDownLeft, ArrowUp, ArrowDown, Compass
} from 'lucide-react'

const APP_CONFIG = {
    pages: { label: 'Go to', icon: Compass, color: 'var(--color-blue-600)' },
    ideas: { label: 'Ideas', icon: Lightbulb, color: 'var(--color-conceptnexus)', path: '/apps/conceptnexus' },
    stakes: { label: 'Campaigns', icon: TrendingUp, color: 'var(--color-vestden)', path: '/apps/vestden' },
    boards: { label: 'Projects', icon: LayoutGrid, color: 'var(--color-collaboard)', path: '/apps/collaboard' },
    talents: { label: 'Talent', icon: Palette, color: 'var(--color-skillscanvas)', path: '/apps/skillscanvas' },
}

// Render order of the result groups inside the palette.
const GROUP_ORDER = ['pages', 'ideas', 'stakes', 'boards', 'talents']

function HighlightedText({ text, query }) {
    if (!text || !query) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
        <span>
            {text.slice(0, idx)}
            <mark className="bg-primary/20 text-primary rounded-sm px-0.5">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </span>
    )
}

function itemLabel(type, item) {
    if (type === 'pages') return item.label
    if (type === 'talents') return item.displayName
    return item.title
}

function itemSub(type, item) {
    if (type === 'pages') return item.sub
    if (type === 'talents') return (item.skills || []).map(s => s.name).join(', ')
    return item.description || item.bio || item.category || ''
}

export default function SearchOverlay() {
    const { isOpen, query, results, setQuery, close } = useSearch()
    const inputRef = useRef(null)
    const listRef = useRef(null)
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(0)

    // Flatten the visible groups into a single indexable list for keyboard nav,
    // capped at 9 results per the v2 spec.
    const flat = useMemo(() => {
        const out = []
        for (const type of GROUP_ORDER) {
            for (const item of results[type] || []) out.push({ type, item })
        }
        return out.slice(0, 9)
    }, [results])

    // Group the capped flat list back into render groups.
    const grouped = useMemo(() => {
        const g = {}
        for (const entry of flat) {
            (g[entry.type] ||= []).push(entry.item)
        }
        return g
    }, [flat])

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus()
    }, [isOpen])

    // Reset the active row whenever the result set changes.
    useEffect(() => { setActiveIndex(0) }, [query, isOpen])

    const handleSelect = (type, item) => {
        if (type === 'pages') {
            navigate(item.path)
        } else if (type === 'talents') {
            navigate(`/apps/skillscanvas/talent/${item.id}`)
        } else {
            navigate(APP_CONFIG[type].path)
        }
        close()
    }

    useEffect(() => {
        function handleKeyDown(e) {
            if (!isOpen) return
            if (e.key === 'Escape') { close(); return }
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex(i => Math.min(i + 1, Math.max(flat.length - 1, 0)))
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex(i => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
                e.preventDefault()
                const sel = flat[activeIndex]
                if (sel) handleSelect(sel.type, sel.item)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, close, flat, activeIndex])

    // Keep the highlighted row scrolled into view.
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-flat-index="${activeIndex}"]`)
        el?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex])

    if (!isOpen) return null

    // Absolute index of an item within the flat list (for highlight + nav).
    let runningIndex = -1

    return (
        <div className="fixed inset-0 z-[100]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={close} />

            <div className="relative max-w-2xl mx-auto mt-[12vh] animate-search-slide-down px-4">
                <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden">
                    {/* Input */}
                    <div className="flex items-center gap-3 px-4 border-b">
                        <Search className="w-5 h-5 text-muted flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search pages, ideas, campaigns, talent…"
                            className="flex-1 py-4 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-muted/10 rounded-md" aria-label="Clear">
                                <X className="w-4 h-4 text-muted" />
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
                        {flat.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <Search className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                                <p className="text-sm text-muted">No matches for "{query}"</p>
                                <p className="text-xs text-muted mt-1">Try a different keyword</p>
                            </div>
                        ) : (
                            GROUP_ORDER.map(type => {
                                const items = grouped[type]
                                if (!items || !items.length) return null
                                const config = APP_CONFIG[type]
                                const Icon = config.icon
                                return (
                                    <div key={type} className="mb-2">
                                        <div className="px-4 py-1.5">
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                                                {config.label}
                                            </span>
                                        </div>
                                        {items.map(item => {
                                            runningIndex += 1
                                            const idx = runningIndex
                                            const active = idx === activeIndex
                                            return (
                                                <button
                                                    key={`${type}-${item.id}`}
                                                    data-flat-index={idx}
                                                    onMouseEnter={() => setActiveIndex(idx)}
                                                    onClick={() => handleSelect(type, item)}
                                                    aria-selected={active}
                                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-muted/10' : ''}`}
                                                >
                                                    <div
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                        style={{ backgroundColor: `${config.color}15` }}
                                                    >
                                                        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            <HighlightedText text={itemLabel(type, item)} query={query} />
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-muted truncate max-w-[40%] text-right">
                                                        {itemSub(type, item)}
                                                    </span>
                                                    {active && <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Footer key hints */}
                    <div className="flex items-center gap-4 px-4 py-2.5 border-t text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-muted/10 rounded border"><ArrowUp className="w-3 h-3 inline" /></kbd>
                            <kbd className="px-1.5 py-0.5 bg-muted/10 rounded border"><ArrowDown className="w-3 h-3 inline" /></kbd>
                            to navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-muted/10 rounded border"><CornerDownLeft className="w-3 h-3 inline" /></kbd>
                            to open
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                            <kbd className="px-1.5 py-0.5 bg-muted/10 rounded border">esc</kbd>
                            to close
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}
