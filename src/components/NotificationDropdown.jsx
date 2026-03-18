import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSocial } from '@/contexts/SocialContext'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
    Bell, TrendingUp, Lightbulb, LayoutGrid,
    Palette, MessageCircle, Star, Users, Zap, CheckCheck
} from 'lucide-react'

const TYPE_ICONS = {
    stake_funded: TrendingUp,
    stake_received: TrendingUp,
    idea_voted: Lightbulb,
    idea_validated: Lightbulb,
    task_assigned: LayoutGrid,
    task_completed: LayoutGrid,
    project_launched: Zap,
    talent_request: Palette,
    new_follower: Users,
    reaction_received: Star,
    message_received: MessageCircle,
    points_earned: Star,
}

const TYPE_COLORS = {
    stake_funded: 'var(--color-vestden)',
    stake_received: 'var(--color-vestden)',
    idea_voted: 'var(--color-conceptnexus)',
    idea_validated: 'var(--color-conceptnexus)',
    task_assigned: 'var(--color-collaboard)',
    task_completed: 'var(--color-collaboard)',
    project_launched: 'var(--color-primary)',
    talent_request: 'var(--color-skillscanvas)',
    new_follower: 'var(--color-primary)',
    reaction_received: 'var(--color-warning)',
    message_received: 'var(--color-primary)',
    points_earned: 'var(--color-warning)',
}

function formatTimeAgo(dateStr) {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
}

export default function NotificationDropdown() {
    const { notifications, unreadCount, markNotificationsRead } = useSocial()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const recentNotifs = notifications.slice(0, 5)

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-muted/10 transition-colors"
            >
                <Bell className="w-5 h-5 text-muted" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-xl border z-20 animate-fade-in overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b">
                            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markNotificationsRead}
                                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Items */}
                        <div className="max-h-80 overflow-y-auto">
                            {recentNotifs.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Bell className="w-8 h-8 text-muted/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted">No notifications</p>
                                </div>
                            ) : (
                                recentNotifs.map(notif => {
                                    const Icon = TYPE_ICONS[notif.type] || Bell
                                    const color = TYPE_COLORS[notif.type] || 'var(--color-muted)'
                                    return (
                                        <div
                                            key={notif.id}
                                            className={cn(
                                                "flex items-start gap-3 px-4 py-3 hover:bg-muted/5 transition-colors",
                                                !notif.read && "bg-primary/[0.03]"
                                            )}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${color}15` }}
                                            >
                                                <Icon className="w-4 h-4" style={{ color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-xs",
                                                    notif.read ? "text-foreground" : "text-foreground font-semibold"
                                                )}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-xs text-muted">{formatTimeAgo(notif.createdAt)}</span>
                                            </div>
                                            {!notif.read && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <Link
                            to="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="block text-center text-xs text-primary hover:text-primary/80 py-3 border-t font-medium"
                        >
                            View all notifications
                        </Link>
                    </div>
                </>
            )}
        </div>
    )
}
