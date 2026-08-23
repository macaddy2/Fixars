import { useState } from 'react'
import fixarsMark from '@/assets/fixars-mark.png'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '@/contexts/SearchContext'
import { useSocial } from '@/contexts/SocialContext'
import { Search, Bell } from 'lucide-react'

export default function MobileHeader() {
  const { setIsSearchOpen } = useSearch()
  const navigate = useNavigate()
  const { unreadCount } = useSocial()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="fx-mobile-header">
      <img src={fixarsMark} alt="Fixars" />
      <span className="mobile-brand-name display">Fixars</span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="icon-btn" onClick={() => setIsSearchOpen(true)} aria-label="Search">
          <Search size={18} />
        </button>
        <button
          className="icon-btn"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
          onClick={() => {
            if (notifOpen) {
              setNotifOpen(false)
              return
            }
            setNotifOpen(true)
            navigate('/notifications')
          }}
          onBlur={() => setNotifOpen(false)}
        >
          <Bell size={18} />
          {unreadCount > 0 && <span className="dot-notif" />}
        </button>
      </div>
    </header>
  )
}
