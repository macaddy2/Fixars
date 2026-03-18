import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSocial } from '@/contexts/SocialContext'
import { cn } from '@/lib/utils'
import {
    Bell, Check, CheckCheck, Trash2,
    TrendingUp, Lightbulb, LayoutGrid, Palette,
    MessageCircle, Star, Users, Zap
} from 'lucide-react'

const TYPE_CONFIG = {
    stake_funded: { icon: TrendingUp, color: 'var(--color-vestden)', label: 'VestDen' },
    stake_received: { icon: TrendingUp, color: 'var(--color-vestden)', label: 'VestDen' },
    idea_voted: { icon: Lightbulb, color: 'var(--color-conceptnexus)', label: 'ConceptNexus' },
    idea_validated: { icon: Lightbulb, color: 'var(--color-conceptnexus)', label: 'ConceptNexus' },
    task_assigned: { icon: LayoutGrid, color: 'var(--color-collaboard)', label: 'Collaboard' },
    task_completed: { icon: LayoutGrid, color: 'var(--color-collaboard)', label: 'Collaboard' },
    project_launched: { icon: Zap, color: 'var(--color-primary)', label: 'Fixars' },
    talent_request: { icon: Palette, color: 'var(--color-skillscanvas)', label: 'SkillsCanvas' },
    new_follower: { icon: Users, color: 'var(--color-primary)', label: 'Social' },
    reaction_received: { icon: Star, color: 'var(--color-warning)', label: 'Feed' },
    message_received: { icon: MessageCircle, color: 'var(--color-primary)', label: 'Messages' },
    points_earned: { icon: Star, color: 'var(--color-warning)', label: 'Points' },
    default: { icon: Bell, color: 'var(--color-muted)', label: 'Fixars' }
}

function formatTimeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
}

function groupByDate(notifications) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today - 7 * 86400000)

    const groups = { today: [], thisWeek: [], earlier: [] }
    notifications.forEach(n => {
        const date = new Date(n.createdAt)
        if (date >= today) groups.today.push(n)
        else if (date >= weekAgo) groups.thisWeek.push(n)
        else groups.earlier.push(n)
    })
    return groups
}

function NotificationItem({ notification, onDelete }) {
    const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.default
    const Icon = config.icon

    return (
        <div className={cn(
            "flex items-start gap-3 px-4 py-3 hover:bg-muted/5 transition-colors group",
            !notification.read && "bg-primary/[0.03]"
        )}>
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${config.color}15` }}
            >
                <Icon className="w-5 h-5" style={{ color: config.color }} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className={cn(
                            "text-sm",
                            notification.read ? "text-foreground" : "text-foreground font-semibold"
                        )}>
                            {notification.title}
                        </p>
                        {notification.message && (
                            <p className="text-xs text-muted mt-0.5">{notification.message}</p>
                        )}
                    </div>
                    {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="text-xs" style={{ color: config.color }}>
                        {config.label}
                    </Badge>
                    <span className="text-xs text-muted">{formatTimeAgo(notification.createdAt)}</span>
                </div>
            </div>
            <button
                onClick={() => onDelete?.(notification.id)}
                className="p-1 rounded-md hover:bg-muted/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
                <Trash2 className="w-3.5 h-3.5 text-muted" />
            </button>
        </div>
    )
}

function NotificationGroup({ title, items, onDelete }) {
    if (!items.length) return null
    return (
        <div className="mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted px-4 py-2">{title}</h3>
            {items.map(n => (
                <NotificationItem key={n.id} notification={n} onDelete={onDelete} />
            ))}
        </div>
    )
}

export default function NotificationsPage() {
    const { notifications, markNotificationsRead } = useSocial()
    const [dismissed, setDismissed] = useState(new Set())

    const visibleNotifs = notifications.filter(n => !dismissed.has(n.id))
    const groups = groupByDate(visibleNotifs)
    const unreadCount = visibleNotifs.filter(n => !n.read).length

    const handleDelete = (id) => {
        setDismissed(prev => new Set(prev).add(id))
    }

    return (
        <main className="py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-1">Notifications</h1>
                        <p className="text-muted">
                            {unreadCount > 0
                                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                                : 'All caught up!'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markNotificationsRead}>
                            <CheckCheck className="w-4 h-4 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {visibleNotifs.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Bell className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                            <p className="text-muted font-medium">No notifications yet</p>
                            <p className="text-sm text-muted mt-1">
                                You'll see notifications here when things happen across Fixars
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <NotificationGroup title="Today" items={groups.today} onDelete={handleDelete} />
                            <NotificationGroup title="This Week" items={groups.thisWeek} onDelete={handleDelete} />
                            <NotificationGroup title="Earlier" items={groups.earlier} onDelete={handleDelete} />
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    )
}
