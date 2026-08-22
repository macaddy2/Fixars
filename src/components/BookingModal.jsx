import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { useSocial } from '@/contexts/SocialContext'
import { createBookingRequest } from '@/lib/db/bookings'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getInitials } from '@/lib/utils'
import { X, Send, CheckCircle, Star, Loader2, AlertCircle } from 'lucide-react'

export default function BookingModal({ talent, onClose }) {
    const { user, isAuthenticated } = useAuth()
    const { boards } = useData()
    const { addNotification } = useSocial()
    const [message, setMessage] = useState('')
    const [selectedBoard, setSelectedBoard] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    if (!talent) return null

    const handleSubmit = async () => {
        if (!message.trim()) return
        if (!isAuthenticated) {
            setError('Please sign in to send a booking request.')
            return
        }

        setSubmitting(true)
        setError('')
        try {
            if (isSupabaseConfigured()) {
                // Persist the booking so the talent actually receives it
                await createBookingRequest(user.id, talent.id, message.trim())
            }

            addNotification({
                type: 'talent_request',
                title: `Booking request sent to ${talent.display_name || talent.displayName}`,
                message: message.trim(),
                userId: user?.id
            })

            setSubmitted(true)
        } catch (err) {
            console.error('Error creating booking request:', err)
            setError(err.message || 'Could not send your request. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="fixed inset-0 z-[60]">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                <div className="relative max-w-md mx-auto mt-[15vh] animate-search-slide-down">
                    <Card className="shadow-2xl">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-success" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Booking Request Sent!</h3>
                            <p className="text-muted mb-6">
                                Your request has been sent to {talent.display_name || talent.displayName}.
                                They'll get back to you soon.
                            </p>
                            <Button onClick={onClose} className="w-full">Done</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative max-w-lg mx-auto mt-[10vh] animate-search-slide-down">
                <Card className="shadow-2xl overflow-hidden">
                    <div className="h-2 gradient-skillscanvas" />

                    <CardHeader className="flex-row items-start justify-between gap-4 pb-2">
                        <div>
                            <CardTitle className="text-lg">Book This Talent</CardTitle>
                            <p className="text-sm text-muted mt-1">Send a booking request</p>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-muted/10 rounded-md">
                            <X className="w-5 h-5 text-muted" />
                        </button>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Talent preview */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/5 border">
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={talent.avatar_url || talent.avatar} />
                                <AvatarFallback>{getInitials(talent.display_name || talent.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold text-foreground">{talent.display_name || talent.displayName}</p>
                                <div className="flex items-center gap-2 text-sm text-muted">
                                    <div className="flex items-center gap-1 text-warning">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        <span>{(talent.rating || 0).toFixed?.(1) || '0.0'}</span>
                                    </div>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <span className="mono">₦{(talent.hourly_rate || talent.hourlyRate || 0).toLocaleString()}/hr</span>
                                    </div>
                                </div>
                            </div>
                            <Badge variant={
                                (talent.availability === 'full-time') ? 'success' :
                                (talent.availability === 'part-time') ? 'warning' : 'secondary'
                            }>
                                {talent.availability || 'unavailable'}
                            </Badge>
                        </div>

                        {/* Project reference */}
                        {boards.length > 0 && (
                            <div>
                                <label className="text-sm font-medium text-foreground block mb-2">
                                    Related Project (optional)
                                </label>
                                <select
                                    value={selectedBoard}
                                    onChange={(e) => setSelectedBoard(e.target.value)}
                                    className="w-full p-2.5 rounded-lg border bg-card text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                >
                                    <option value="">Select a project...</option>
                                    {boards.map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Message */}
                        <div>
                            <label className="text-sm font-medium text-foreground block mb-2">
                                Message *
                            </label>
                            <textarea
                                rows={4}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Hi! I'm looking for help with... Tell them about your project, timeline, and requirements."
                                className="w-full p-3 rounded-lg border bg-card text-foreground text-sm resize-none focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" onClick={onClose} className="flex-1" disabled={submitting}>Cancel</Button>
                            <Button
                                variant="skillscanvas"
                                onClick={handleSubmit}
                                disabled={!message.trim() || submitting || !isAuthenticated}
                                className="flex-1"
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" /> Send Request</>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
