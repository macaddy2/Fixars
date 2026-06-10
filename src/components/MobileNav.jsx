import { NavLink, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Wallet, User, Plus } from 'lucide-react'

const tabs = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/apps', icon: LayoutGrid, label: 'Apps' },
  { to: null, icon: Plus, label: 'Create', isCreate: true },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function MobileNav() {
  const location = useLocation()

  const isActive = (path) => {
    if (!path) return false
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fx-mobile-tabs">
      <div className="tabs-row">
        {tabs.map((tab, i) => {
          if (tab.isCreate) {
            return (
              <button key={i} className="tab-create" aria-label="Create">
                <Plus size={26} />
              </button>
            )
          }
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`tab-btn ${isActive(tab.to) ? 'active' : ''}`}
            >
              <tab.icon size={22} />
              {tab.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
