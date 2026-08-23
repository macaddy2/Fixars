import { useState, useMemo, useRef, useEffect } from 'react'
import { ArrowLeft, Send, MessagesSquare } from 'lucide-react'
import { useSocial } from '@/contexts/SocialContext'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials, sortByRecency } from '@/lib/utils'

function timeLabel(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    const today = new Date().toDateString() === d.toDateString()
    return today
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/**
 * MessagesPage — real 1:1 chat over the persisted conversations backend.
 * List ↔ thread on mobile; side-by-side on desktop.
 */
export default function MessagesPage() {
    const { user } = useAuth()
    const { conversations, sendMessage } = useSocial()
    const [activeId, setActiveId] = useState(null)
    const [draft, setDraft] = useState('')
    const [sending, setSending] = useState(false)
    const bottomRef = useRef(null)

    const active = conversations.find(c => c.id === activeId) || null

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' })
    }, [active?.messages?.length, activeId])

    // Sort by most recent activity
    const sorted = useMemo(
        () => sortByRecency(conversations, 'lastActivity'),
        [conversations]
    )

    const otherName = (conv) => {
        if (!conv || !user) return 'Conversation'
        return conv.participantNames[user.id] || conv.participants.find(id => id !== user.id) || 'User'
    }

    const handleSend = async (e) => {
        e.preventDefault()
        const content = draft.trim()
        if (!content || !active) return
        setSending(true)
        try {
            const otherId = active.participants.find(id => id !== user.id)
            await sendMessage(otherId, otherName(active), content)
            setDraft('')
            setActiveId(null) // refetch picks the conversation up; reopen below via effect
        } catch (err) {
            console.error('Send failed:', err)
        } finally {
            setSending(false)
        }
    }

    return (
        <main className="py-6">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-5">
                    <h1 className="text-3xl font-bold text-foreground">Messages</h1>
                    <p className="text-muted text-sm mt-1">Direct conversations across the ecosystem.</p>
                </div>

                <div className="grid md:grid-cols-[300px_1fr] gap-4 border rounded-2xl overflow-hidden bg-card min-h-[60vh]">
                    {/* Conversation list */}
                    <div className={`border-r overflow-y-auto ${active ? 'hidden md:block' : ''}`} style={{ maxHeight: '70vh' }}>
                        {sorted.length === 0 && (
                            <p className="text-sm text-muted p-6 text-center">
                                <MessagesSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                No conversations yet. Message a talent or teammate from their profile.
                            </p>
                        )}
                        {sorted.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => setActiveId(conv.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 border-b text-left hover:bg-muted/10 transition-colors ${activeId === conv.id ? 'bg-primary/10' : ''}`}
                            >
                                <Avatar className="w-9 h-9 shrink-0">
                                    <AvatarFallback className="text-xs">{getInitials(otherName(conv))}</AvatarFallback>
                                </Avatar>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-medium truncate">{otherName(conv)}</span>
                                    <span className="block text-xs text-muted truncate">
                                        {conv.messages[conv.messages.length - 1]?.content || 'Say hello'}
                                    </span>
                                </span>
                                {conv.unread > 0 && (
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[10px] grid place-items-center">{conv.unread}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Thread */}
                    <div className={`flex flex-col ${!active ? 'hidden md:flex' : ''}`}>
                        {!active ? (
                            <div className="m-auto text-center text-muted text-sm py-16">
                                Select a conversation to start chatting.
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 px-4 py-3 border-b">
                                    <button className="md:hidden" aria-label="Back to conversations" onClick={() => setActiveId(null)}>
                                        <ArrowLeft size={18} className="text-muted" />
                                    </button>
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="text-xs">{getInitials(otherName(active))}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm">{otherName(active)}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ maxHeight: '52vh' }}>
                                    {[...(active.messages || [])].map(m => {
                                        const mine = m.senderId === user?.id
                                        return (
                                            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-primary text-white rounded-br-sm' : 'bg-muted/15 rounded-bl-sm'}`}>
                                                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                                                    <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-muted'}`}>{timeLabel(m.timestamp)}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={bottomRef} />
                                </div>

                                <form onSubmit={handleSend} className="flex items-center gap-2 border-t px-3 py-3">
                                    <input
                                        className="flex-1 fx-input"
                                        placeholder="Write a message…"
                                        value={draft}
                                        onChange={e => setDraft(e.target.value)}
                                        aria-label="Message"
                                    />
                                    <button type="submit" className="btn-app btn-app-collab" disabled={!draft.trim() || sending} aria-label="Send message">
                                        <Send size={15} />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
