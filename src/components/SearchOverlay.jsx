import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '@/contexts/SearchContext'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search, X, TrendingUp, Lightbulb,
    LayoutGrid, Palette, ArrowRight, Command
} from 'lucide-react'

const APP_CONFIG = {
    stakes: { label: 'VestDen', icon: TrendingUp, color: 'var(--color-vestden)', path: '/apps/vestden' },
    ideas: { label: 'ConceptNexus', icon: Lightbulb, color: 'var(--color-conceptnexus)', path: '/apps/conceptnexus' },
    boards: { label: 'Collaboard', icon: LayoutGrid, color: 'var(--color-collaboard)', path: '/apps/collaboard' },
    talents: { label: 'SkillsCanvas', icon: Palette, color: 'var(--color-skillscanvas)', path: '/apps/skillscanvas' }
}

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

function ResultGroup({ type, items, query, onSelect }) {
    if (!items.length) return null
    const config = APP_CONFIG[type]
    const Icon = config.icon

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 px-4 py-2">
                <Icon className="w-4 h-4" style={{ color: config.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: config.color }}>
                    {config.label}
                </span>
                <Badge variant="secondary" className="text-xs ml-auto">{items.length}</Badge>
            </div>
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => onSelect(type, item)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors text-left group"
                >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${config.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            <HighlightedText text={item.title || item.displayName} query={query} />
                        </p>
                        <p className="text-xs text-muted truncate">
                            {item.description || item.bio || (item.skills || []).map(s => s.name).join(', ')}
                        </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
            ))}
        </div>
    )
}

export default function SearchOverlay() {
    const { isOpen, query, results, setQuery, close } = useSearch()
    const inputRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape' && isOpen) {
                close()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, close])

    const handleSelect = (type, item) => {
        const config = APP_CONFIG[type]
        if (type === 'talents') {
            navigate(`/apps/skillscanvas/talent/${item.id}`)
        } else {
            navigate(config.path)
        }
        close()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={close}
            />

            {/* Search Panel */}
            <div className="relative max-w-2xl mx-auto mt-[10vh] animate-search-slide-down">
                <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 border-b">
                        <Search className="w-5 h-5 text-muted flex-shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search across all apps..."
                            className="flex-1 py-4 bg-transparent text-foreground text-base outline-none placeholder:text-muted-foreground"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-muted/10 rounded-md">
                                <X className="w-4 h-4 text-muted" />
                            </button>
                        )}
                        <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-muted/10 rounded-md text-xs text-muted border">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div className="max-h-[60vh] overflow-y-auto py-2">
                        {query.length < 2 ? (
                            <div className="px-4 py-12 text-center">
                                <Search className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                                <p className="text-sm text-muted">
                                    Search stakes, ideas, boards, and talents
                                </p>
                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <kbd className="px-2 py-1 bg-muted/10 rounded-md text-xs text-muted border">
                                        <Command className="w-3 h-3 inline mr-1" />K
                                    </kbd>
                                    <span className="text-xs text-muted">to toggle search</span>
                                </div>
                            </div>
                        ) : results.total === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <p className="text-sm text-muted">No results for "{query}"</p>
                                <p className="text-xs text-muted mt-1">Try different keywords</p>
                            </div>
                        ) : (
                            <>
                                <ResultGroup type="ideas" items={results.ideas} query={query} onSelect={handleSelect} />
                                <ResultGroup type="stakes" items={results.stakes} query={query} onSelect={handleSelect} />
                                <ResultGroup type="boards" items={results.boards} query={query} onSelect={handleSelect} />
                                <ResultGroup type="talents" items={results.talents} query={query} onSelect={handleSelect} />

                                <div className="px-4 py-2 border-t">
                                    <p className="text-xs text-muted text-center">
                                        {results.total} result{results.total !== 1 ? 's' : ''} across all apps
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
