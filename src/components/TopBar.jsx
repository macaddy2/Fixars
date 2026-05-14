import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { Search, Bell, MessageSquare } from 'lucide-react'

export default function TopBar() {
  const { user } = useAuth()
  const { setIsSearchOpen } = useSearch()

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
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="dot-notif" />
        </button>
        <button className="icon-btn" aria-label="Messages">
          <MessageSquare size={18} />
        </button>
        <div className="topbar-avatar">{initials}</div>
      </div>
    </header>
  )
}
