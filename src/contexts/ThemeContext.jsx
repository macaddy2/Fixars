import { createContext, useContext, useEffect, useState } from 'react'

/**
 * ThemeContext — single source of truth for the v2 appearance system.
 *
 * Three independent axes, each applied as a data-* attribute on <html> and
 * persisted to localStorage:
 *   - theme:   light | dim (sepia) | dark
 *   - density: compact | cozy | spacious
 *   - vibe:    focused | expressive | playful
 *
 * Shipping default is light · cozy · expressive (per v2 handoff).
 */

const THEMES = ['light', 'dim', 'dark']
const DENSITIES = ['compact', 'cozy', 'spacious']
const VIBES = ['focused', 'expressive', 'playful']

const DEFAULTS = { theme: 'light', density: 'cozy', vibe: 'expressive' }

const ThemeContext = createContext(null)

function readStored(key, allowed, fallback) {
  const v = localStorage.getItem(key)
  return allowed.includes(v) ? v : fallback
}

export function ThemeProvider({ children }) {
  // Migrate the legacy `theme` key (light/dark only) transparently.
  const [theme, setTheme] = useState(() => readStored('theme', THEMES, DEFAULTS.theme))
  const [density, setDensity] = useState(() => readStored('density', DENSITIES, DEFAULTS.density))
  const [vibe, setVibe] = useState(() => readStored('vibe', VIBES, DEFAULTS.vibe))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
    localStorage.setItem('density', density)
  }, [density])

  useEffect(() => {
    document.documentElement.setAttribute('data-vibe', vibe)
    localStorage.setItem('vibe', vibe)
  }, [vibe])

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, density, setDensity, vibe, setVibe, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

export { THEMES, DENSITIES, VIBES }
