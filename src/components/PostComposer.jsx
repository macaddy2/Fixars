import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { getInitials } from '@/lib/utils'
import { Send, TrendingUp, Lightbulb, LayoutGrid, Palette, Link2, X } from 'lucide-react'

const APP_OPTIONS = [
    { key: 'vestden', label: 'VestDen', icon: TrendingUp, color: 'var(--color-vestden)' },
    { key: 'conceptnexus', label: 'ConceptNexus', icon: Lightbulb, color: 'var(--color-conceptnexus)' },
    { key: 'collaboard', label: 'Collaboard', icon: LayoutGrid, color: 'var(--color-collaboard)' },
    { key: 'skillscanvas', label: 'SkillsCanvas', icon: Palette, color: 'var(--color-skillscanvas)' },
]

export default function PostComposer({ onPost }) {
    const { user } = useAuth()
    const { stakes, ideas, boards } = useData()
    const [content, setContent] = useState('')
    const [selectedApp, setSelectedApp] = useState(null)
    const [linkedEntity, setLinkedEntity] = useState(null)
    const [showLinkPicker, setShowLinkPicker] = useState(false)

    if (!user) return null

    const getEntitiesForApp = (app) => {
        switch (app) {
            case 'vestden': return stakes.map(s => ({ type: 'stake', id: s.id, name: s.title }))
            case 'conceptnexus': return ideas.map(i => ({ type: 'idea', id: i.id, name: i.title }))
            case 'collaboard': return boards.map(b => ({ type: 'board', id: b.id, name: b.title }))
            default: return []
        }
    }

    const handlePost = () => {
        if (!content.trim()) return
        onPost(content.trim(), selectedApp || 'fixars', linkedEntity)
        setContent('')
        setSelectedApp(null)
        setLinkedEntity(null)
    }

    const handleAppSelect = (appKey) => {
        if (selectedApp === appKey) {
            setSelectedApp(null)
            setLinkedEntity(null)
            setShowLinkPicker(false)
        } else {
            setSelectedApp(appKey)
            setLinkedEntity(null)
            setShowLinkPicker(false)
        }
    }

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                <div className="flex gap-3">
                    <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getInitials(user.name || 'U')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <textarea
                            placeholder="Share an update with the community..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
                            }}
                            className="w-full bg-transparent text-foreground text-sm outline-none resize-none min-h-[60px] placeholder:text-muted-foreground mb-3"
                            rows={2}
                        />

                        {/* Linked entity preview */}
                        {linkedEntity && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/10 rounded-lg mb-3">
                                <Link2 className="w-4 h-4 text-muted" />
                                <span className="text-sm text-foreground">{linkedEntity.name}</span>
                                <button onClick={() => setLinkedEntity(null)} className="ml-auto">
                                    <X className="w-3.5 h-3.5 text-muted" />
                                </button>
                            </div>
                        )}

                        {/* Link picker */}
                        {showLinkPicker && selectedApp && (
                            <div className="mb-3 p-2 bg-muted/5 rounded-lg border max-h-32 overflow-y-auto">
                                {getEntitiesForApp(selectedApp).map(entity => (
                                    <button
                                        key={entity.id}
                                        onClick={() => { setLinkedEntity(entity); setShowLinkPicker(false) }}
                                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted/10 rounded-md transition-colors"
                                    >
                                        {entity.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <div className="flex gap-1.5">
                                {APP_OPTIONS.map(({ key, label, icon: Icon, color }) => (
                                    <Badge
                                        key={key}
                                        variant="secondary"
                                        onClick={() => handleAppSelect(key)}
                                        className="cursor-pointer hover:opacity-80 transition-opacity text-xs"
                                        style={selectedApp === key ? { backgroundColor: `${color}20`, color, borderColor: color } : {}}
                                    >
                                        <Icon className="w-3 h-3 mr-1" />
                                        {label}
                                    </Badge>
                                ))}
                                {selectedApp && (
                                    <Badge
                                        variant="secondary"
                                        onClick={() => setShowLinkPicker(!showLinkPicker)}
                                        className="cursor-pointer hover:opacity-80 transition-opacity text-xs"
                                    >
                                        <Link2 className="w-3 h-3 mr-1" />
                                        Link
                                    </Badge>
                                )}
                            </div>
                            <Button size="sm" onClick={handlePost} disabled={!content.trim()}>
                                <Send className="w-4 h-4 mr-1" /> Post
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
