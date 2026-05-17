import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { Search, Bell, MessageSquare, Sun, Moon } from 'lucide-react'

export default function TopBar() {
  const { user } = useAuth()
  const { setIsSearchOpen } = useSearch()
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AO'

  return (
    <header className="fx-topbar">
      <div className="topbar-search" onClick={() => setIsSearchOpen(true)}>
        <Search size={14} />
        <span>Search ideas, projects, people…</span>
        <span className="kbd">⌘K</span>
      </div>
      <div className="topbar-actions">
        <span className="points-pill">★ {(user?.points || 1240).toLocaleString()} pts</span>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link to="/notifications" className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="dot-notif" />
        </Link>
        <Link to="/messages" className="icon-btn" aria-label="Messages">
          <MessageSquare size={18} />
        </Link>
        <Link to="/profile" className="topbar-avatar">{initials}</Link>
      </div>
    </header>
  )
}
