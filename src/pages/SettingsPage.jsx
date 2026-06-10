import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import {
    Settings, Sun, Moon, Coffee,
    Minus, Equal, AlignJustify,
    Palette, Bell, Shield, User,
    ChevronRight, LogOut, Globe
} from 'lucide-react'

/* ====================================================================
   Settings Page — Phase 3
   Appearance pickers are wired to ThemeContext (theme / density / vibe),
   applied live as data-* attributes on <html> and persisted.
   ==================================================================== */

const THEMES = [
    { key: 'light', label: 'Light', icon: Sun, preview: '#F9FAFC' },
    { key: 'dim', label: 'Sepia', icon: Coffee, preview: '#F5EFE4' },
    { key: 'dark', label: 'Dark', icon: Moon, preview: '#0A1628' },
]

const DENSITIES = [
    { key: 'compact', label: 'Compact', icon: Minus },
    { key: 'cozy', label: 'Cozy', icon: Equal },
    { key: 'spacious', label: 'Spacious', icon: AlignJustify },
]

const VIBES = [
    { key: 'focused', label: 'Focused', colors: ['#0A1628', '#3E5271', '#EBEFF5'] },
    { key: 'expressive', label: 'Expressive', colors: ['#2F45E0', '#7C3AED', '#10B981'] },
    { key: 'playful', label: 'Playful', colors: ['#7C3AED', '#E87D4A', '#06B6D4'] },
]

export default function SettingsPage() {
    const { logout } = useAuth()
    const { theme, setTheme, density, setDensity, vibe, setVibe } = useTheme()
    const [notifications, setNotifications] = useState({
        stakes: true,
        ideas: true,
        messages: true,
        weekly: false,
    })

    const toggleNotif = (key) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="fx-settings-page">
            {/* Page Header */}
            <div className="fx-page-header">
                <div className="page-header-icon" style={{ background: 'var(--color-ink-100)', color: 'var(--color-ink-700)' }}>
                    <Settings size={20} />
                </div>
                <div>
                    <span className="page-header-eyebrow">Preferences</span>
                    <h1 className="page-header-title display">Settings</h1>
                    <p className="page-header-sub">Customize your Fixars experience.</p>
                </div>
            </div>

            <div className="settings-grid">
                {/* ── Appearance ── */}
                <div className="settings-card">
                    <h3 className="settings-card-title display">
                        <Palette size={18} /> Appearance
                    </h3>

                    {/* Theme */}
                    <label className="settings-label">Theme</label>
                    <div className="settings-theme-grid">
                        {THEMES.map(t => {
                            const Icon = t.icon
                            return (
                                <button
                                    key={t.key}
                                    className={`theme-option ${theme === t.key ? 'active' : ''}`}
                                    onClick={() => setTheme(t.key)}
                                >
                                    <div className="theme-preview" style={{ background: t.preview }} />
                                    <span className="theme-label">
                                        <Icon size={13} /> {t.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Density */}
                    <label className="settings-label">Density</label>
                    <div className="settings-density-row">
                        {DENSITIES.map(d => {
                            const Icon = d.icon
                            return (
                                <button
                                    key={d.key}
                                    className={`density-option ${density === d.key ? 'active' : ''}`}
                                    onClick={() => setDensity(d.key)}
                                >
                                    <Icon size={16} />
                                    <span>{d.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Vibe */}
                    <label className="settings-label">Vibe Preset</label>
                    <div className="settings-vibe-grid">
                        {VIBES.map(v => (
                            <button
                                key={v.key}
                                className={`vibe-option ${vibe === v.key ? 'active' : ''}`}
                                onClick={() => setVibe(v.key)}
                            >
                                <div className="vibe-colors">
                                    {v.colors.map((c, i) => (
                                        <div key={i} className="vibe-swatch" style={{ background: c }} />
                                    ))}
                                </div>
                                <span>{v.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Notifications ── */}
                <div className="settings-card">
                    <h3 className="settings-card-title display">
                        <Bell size={18} /> Notifications
                    </h3>
                    <div className="settings-notif-list">
                        {[
                            { key: 'stakes', label: 'Stake updates', desc: 'Get notified when your staked projects have updates.' },
                            { key: 'ideas', label: 'Idea validations', desc: 'Know when your ideas get validated or scored.' },
                            { key: 'messages', label: 'Direct messages', desc: 'Receive notifications for new messages.' },
                            { key: 'weekly', label: 'Weekly digest', desc: 'A weekly summary of your ecosystem activity.' },
                        ].map(n => (
                            <div key={n.key} className="notif-toggle-row">
                                <div>
                                    <span className="notif-label">{n.label}</span>
                                    <span className="notif-desc">{n.desc}</span>
                                </div>
                                <button
                                    className={`toggle-switch ${notifications[n.key] ? 'on' : 'off'}`}
                                    onClick={() => toggleNotif(n.key)}
                                    aria-pressed={notifications[n.key]}
                                >
                                    <div className="toggle-thumb" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Account ── */}
                <div className="settings-card">
                    <h3 className="settings-card-title display">
                        <User size={18} /> Account
                    </h3>
                    <div className="settings-account-list">
                        <button className="settings-account-row">
                            <User size={16} /> <span>Edit Profile</span> <ChevronRight size={14} className="ml-auto" />
                        </button>
                        <button className="settings-account-row">
                            <Shield size={16} /> <span>Security & Password</span> <ChevronRight size={14} className="ml-auto" />
                        </button>
                        <button className="settings-account-row">
                            <Globe size={16} /> <span>Language & Region</span> <ChevronRight size={14} className="ml-auto" />
                        </button>
                        <button className="settings-account-row danger" onClick={logout}>
                            <LogOut size={16} /> <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
