import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { isRealSessionEnabled } from '@/lib/flags'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function Login() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, isAuthenticated } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const flagOn = isRealSessionEnabled()

    const redirectTo = location.state?.from || '/dashboard'

    // Once auth context confirms we're signed in, navigate away from the login page
    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirectTo, { replace: true })
        }
    }, [isAuthenticated, navigate, redirectTo])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            const result = await login(email, password)

            if (result.error) {
                const msg = result.error.message || ''
                if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('not confirmed')) {
                    setError('Email is not confirmed on this prototype path. Try the dummy password sign-in.')
                } else {
                    setError(msg || 'Invalid credentials. Please try again.')
                }
                setSubmitting(false)
                return
            }

            // Navigation happens in the useEffect once isAuthenticated flips true.
            // Keep submitting=true until then so the button stays in its loading state.
        } catch {
            setError('Something went wrong. Please try again.')
            setSubmitting(false)
        }
    }

    return (
        <main className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-2xl">F</span>
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-foreground">
                        {flagOn ? 'Preview sign-in' : 'Prototype sign-in'}
                    </h1>
                    <p className="text-muted mt-2">
                        {flagOn
                            ? 'Mock server session for a named internal preview. Not a live account. The client cannot mint a session.'
                            : 'Dummy login for the public demo. Not a live Fixars account.'}
                    </p>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                    <Input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {flagOn ? 'Signing in...' : 'Entering demo...'}</>
                                ) : (
                                    <>{flagOn ? 'Sign in' : 'Enter demo'} <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted">
                                {flagOn ? "Don't have an account? " : 'Need a demo profile? '}
                                <Link to="/signup" className="text-primary font-medium hover:underline">
                                    {flagOn ? 'Create one' : 'Create a dummy profile'}
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-muted mt-6">
                    {flagOn
                        ? 'Named internal preview. Not a live account. '
                        : 'Public prototype. Dummy sign-in — not a live account. '}
                    <Link to="/terms" className="text-primary hover:underline">Terms</Link>
                    {' · '}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </p>
            </div>
        </main>
    )
}
