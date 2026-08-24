import { describe, it, expect } from 'vitest'
import { cn, formatNumber, getInitials, getRelativeTime, sortByRecency } from './utils'

describe('cn', () => {
    it('joins class names', () => {
        expect(cn('a', 'b')).toContain('a')
        expect(cn('a', 'b')).toContain('b')
    })

    it('drops falsy values', () => {
        const cond = false
        const out = cn('a', cond ? 'b' : null, null, undefined, 'c')
        expect(out).toBe('a c')
    })
})

describe('formatNumber', () => {
    it('leaves small numbers alone', () => {
        expect(formatNumber(999)).toBe('999')
    })

    it('abbreviates thousands', () => {
        expect(formatNumber(1500)).toBe('1.5K')
    })

    it('abbreviates millions', () => {
        expect(formatNumber(2500000)).toBe('2.5M')
    })
})

describe('getInitials', () => {
    it('returns up to two initials', () => {
        expect(getInitials('Alex Morgan')).toBe('AM')
        expect(getInitials('alex')).toBe('A')
    })

    it('does not crash on empty/null/undefined', () => {
        expect(getInitials('')).toBe('?')
        expect(getInitials(null)).toBe('?')
        expect(getInitials(undefined)).toBe('?')
    })

    it('handles whitespace-only names', () => {
        expect(getInitials('   ')).toBe('?')
    })
})

describe('getRelativeTime', () => {
    it('says "just now" for the recent past', () => {
        expect(getRelativeTime(new Date(Date.now() - 10_000).toISOString())).toBe('just now')
    })

    it('formats minutes ago', () => {
        expect(getRelativeTime(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5m ago')
    })

    it('formats hours and days ago', () => {
        expect(getRelativeTime(new Date(Date.now() - 3 * 3600_000).toISOString())).toBe('3h ago')
        expect(getRelativeTime(new Date(Date.now() - 2 * 86400_000).toISOString())).toBe('2d ago')
    })
})

describe('sortByRecency', () => {
    const items = [
        { id: 'a', lastActivity: '2026-01-01T00:00:00Z' },
        { id: 'b', lastActivity: '2026-03-01T00:00:00Z' },
        { id: 'c' }, // missing timestamp
        { id: 'd', lastActivity: '2026-02-01T00:00:00Z' },
    ]

    it('sorts newest first and sinks missing timestamps', () => {
        const sorted = sortByRecency(items)
        expect(sorted.map(x => x.id)).toEqual(['b', 'd', 'a', 'c'])
    })

    it('does not mutate the input array', () => {
        sortByRecency(items)
        expect(items[0].id).toBe('a')
    })

    it('supports custom keys', () => {
        const byCreated = sortByRecency(
            [{ id: 1, createdAt: '2026-01-01' }, { id: 2, createdAt: '2026-06-01' }],
            'createdAt'
        )
        expect(byCreated[0].id).toBe(2)
    })
})
