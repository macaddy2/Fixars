import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Home, LayoutGrid, AlignLeft, Wallet,
  Lightbulb, TrendingUp, Users, Shield,
  User, Settings
} from 'lucide-react'

const mainNav = [
  { to: '/dashboard', icon: Home, label: 'Home', badge: '3' },
  { to: '/apps', icon: LayoutGrid, label: 'Apps' },
  { to: '/feed', icon: AlignLeft, label: 'Feed' },
  { to: '/wallet', icon: Wallet, label: 'Wallet' },
]

const subApps = [
  { to: '/apps/conceptnexus', icon: Lightbulb, label: 'ConceptNexus', accent: 'app-concept' },
  { to: '/apps/vestden', icon: TrendingUp, label: 'vestDen', accent: 'app-invest' },
  { to: '/apps/collaboard', icon: Users, label: 'CollaBoard', accent: 'app-collab' },
  { to: '/apps/skillscanvas', icon: Shield, label: 'SkillsCanvas', accent: 'app-skills' },
]

const accountNav = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AO'

  return (
    <aside className="fx-sidebar">
      <div className="sidebar-brand">
        <img src="/fixars-mark.png" alt="Fixars" />
        <span className="sidebar-brand-name">Fixars</span>
      </div>

      {mainNav.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={`nav-item ${isActive(item.to) ? 'active' : ''}`}
        >
          <item.icon className="nav-icon" />
          <span className="nav-label">{item.label}</span>
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </NavLink>
      ))}

      <div className="nav-section">Sub-apps</div>
      {subApps.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={`nav-item ${item.accent} ${isActive(item.to) ? 'active' : ''}`}
        >
          <item.icon className="nav-icon" />
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}

      <div className="nav-section">Account</div>
      {accountNav.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={`nav-item ${isActive(item.to) ? 'active' : ''}`}
        >
          <item.icon className="nav-icon" />
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div>
          <div className="sidebar-user-name">{user?.name || 'Amaka O.'}</div>
          <div className="sidebar-user-sub">FCS {user?.points || 742} · Lagos</div>
        </div>
      </div>
    </aside>
  )
}
