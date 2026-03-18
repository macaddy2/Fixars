import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
    Home,
    LayoutGrid,
    User,
    Bell,
    MessageCircle,
    Menu,
    X,
    Star,
    LogOut,
    Settings,
    ChevronDown,
    Search,
    Command,
    BarChart3
} from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { usePoints } from '@/contexts/PointsContext'
import NotificationDropdown from '@/components/NotificationDropdown'
import { cn, getInitials, formatNumber } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function Header() {
    const location = useLocation()
    const { user, isAuthenticated, logout } = useAuth()
    const { points, level, showReward } = usePoints()
    const { toggle: toggleSearch } = useSearch()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)

    // Cmd+K / Ctrl+K keyboard shortcut
    useEffect(() => {
        function handleKeyDown(e) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                toggleSearch()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [toggleSearch])

    const navLinks = [
        { path: '/', label: 'Home', icon: Home },
        { path: '/apps', label: 'Apps', icon: LayoutGrid },
        { path: '/feed', label: 'Feed', icon: MessageCircle },
        ...(isAuthenticated ? [{ path: '/analytics', label: 'Analytics', icon: BarChart3 }] : [])
    ]

    return (
        <header className="sticky top-0 z-50 glass border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                <span className="text-white font-bold text-lg">F</span>
                            </div>
                            {isSupabaseConfigured() && (
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background animate-realtime-pulse" title="Live connected" />
                            )}
                        </div>
                        <span className="font-bold text-xl text-foreground hidden sm:block">Fixars</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ path, label, icon: Icon }) => (
                            <Link
                                key={path}
                                to={path}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                                    location.pathname === path
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted hover:text-foreground hover:bg-muted/10"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Search */}
                    <button
                        onClick={toggleSearch}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors text-sm text-muted border"
                    >
                        <Search className="w-4 h-4" />
                        <span>Search...</span>
                        <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 bg-background rounded text-xs border">
                            <Command className="w-3 h-3" />K
                        </kbd>
                    </button>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Points Badge with animation */}
                                <Link
                                    to="/profile"
                                    className={cn(
                                        "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 text-warning font-semibold text-sm transition-all duration-300",
                                        showReward && "animate-pulse-glow"
                                    )}
                                >
                                    <Star className="w-4 h-4 fill-warning" />
                                    <span>{formatNumber(points)}</span>
                                    {showReward && (
                                        <span className="text-xs text-success animate-fade-in">
                                            +{showReward.points}
                                        </span>
                                    )}
                                </Link>

                                {/* Notifications */}
                                <NotificationDropdown />

                                {/* Messages */}
                                <Link
                                    to="/messages"
                                    className="p-2 rounded-full hover:bg-muted/10 transition-colors"
                                >
                                    <MessageCircle className="w-5 h-5 text-muted" />
                                </Link>

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted/10 transition-colors"
                                    >
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={user?.avatar} />
                                            <AvatarFallback>{getInitials(user?.name || 'User')}</AvatarFallback>
                                        </Avatar>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 text-muted transition-transform duration-200 hidden sm:block",
                                            userMenuOpen && "rotate-180"
                                        )} />
                                    </button>

                                    {userMenuOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setUserMenuOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-64 py-2 bg-card rounded-xl shadow-xl border z-20 animate-fade-in">
                                                <div className="px-4 py-3 border-b">
                                                    <p className="font-semibold text-foreground">{user?.name}</p>
                                                    <p className="text-sm text-muted">{user?.email}</p>
                                                    <Badge variant="default" className="mt-2">{level}</Badge>
                                                </div>
                                                <Link
                                                    to="/profile"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/10 transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <User className="w-4 h-4" />
                                                    Profile
                                                </Link>
                                                <Link
                                                    to="/dashboard"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/10 transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <LayoutGrid className="w-4 h-4" />
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    to="/settings"
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/10 transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Settings
                                                </Link>
                                                <div className="border-t mt-2 pt-2">
                                                    <button
                                                        onClick={() => { logout(); setUserMenuOpen(false); }}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Sign out
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login">
                                    <Button variant="ghost" size="sm">Sign in</Button>
                                </Link>
                                <Link to="/signup">
                                    <Button size="sm">Get Started</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-muted/10 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <nav className="md:hidden py-4 border-t animate-fade-in">
                        {navLinks.map(({ path, label, icon: Icon }) => (
                            <Link
                                key={path}
                                to={path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                    location.pathname === path
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted hover:text-foreground hover:bg-muted/10"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>
        </header>
    )
}
