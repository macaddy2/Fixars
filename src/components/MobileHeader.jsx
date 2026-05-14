import { useSearch } from '@/contexts/SearchContext'
import { Search, Bell } from 'lucide-react'

export default function MobileHeader() {
  const { setIsSearchOpen } = useSearch()

  return (
    <header className="fx-mobile-header">
      <img src="/fixars-mark.png" alt="Fixars" />
      <span className="mobile-brand-name display">Fixars</span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="icon-btn" onClick={() => setIsSearchOpen(true)} aria-label="Search">
          <Search size={18} />
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="dot-notif" />
        </button>
      </div>
    </header>
  )
}
