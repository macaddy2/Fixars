import { Search } from 'lucide-react'

/* ====================================================================
   SubAppKit — shared v2 sub-app building blocks (head, stats, toolbar,
   list grid, empty state). Each sub-app composes these with its own
   card renderer.
   ==================================================================== */

// 4-up stat strip (k / value / trend), no sparkline.
export function StatRow({ stats }) {
    return (
        <section className="stats-strip" style={{ marginBottom: 16 }}>
            {stats.map(s => (
                <div key={s.k} className="stat-card">
                    <div className="stat-k">{s.k}</div>
                    <div className={`stat-v display${s.mono ? ' mono' : ''}`}>{s.v}</div>
                    <div className={`stat-t${s.tone === 'up' ? ' up' : ''}`} style={s.tColor ? { color: s.tColor } : undefined}>
                        {s.t}
                    </div>
                </div>
            ))}
        </section>
    )
}

// Search + segmented filter control with live state lifted to the page.
export function Toolbar({ search, onSearch, placeholder, filters, active, onFilter }) {
    return (
        <div className="toolbar">
            <div className="toolbar-search">
                <Search size={14} style={{ color: 'var(--color-ink-400)' }} />
                <input
                    value={search}
                    onChange={e => onSearch(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
            <div className="segment" role="tablist">
                {filters.map(f => (
                    <button
                        key={f.value}
                        role="tab"
                        aria-selected={active === f.value}
                        className={active === f.value ? 'active' : ''}
                        onClick={() => onFilter(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

export function ListGrid({ children }) {
    return <div className="list-grid">{children}</div>
}

export function EmptyState({ title = 'Nothing matches', sub = 'Try a different search or filter.', onClear }) {
    return (
        <div className="empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <h4>{title}</h4>
            <p>{sub}</p>
            {onClear && <button className="btn-ghost" onClick={onClear}>Clear filters</button>}
        </div>
    )
}
