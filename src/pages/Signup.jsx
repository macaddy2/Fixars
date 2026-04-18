import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, Lock, User, ArrowRight, Loader2, CheckCircle } from 'lucide-react'

const BENEFITS = [
    'Single login for all 4 apps',
    'Earn points for every action',
    'Connect with innovators worldwide',
    'Free to get started'
]

export default function Signup() {
    const navigate = useNavigate()
    const { signup, isAuthenticated } = useAuth()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [confirmationSent, setConfirmationSent] = useState(false)

    // If signup produced an immediate session, navigate once auth state is ready
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true })
        }
    }, [isAuthenticated, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
            setError('Password must include at least one letter and one number')
            return
        }

        setSubmitting(true)
        try {
            const result = await signup(name, email, password)

            if (result.error) {
                setError(result.error.message || 'Something went wrong. Please try again.')
                setSubmitting(false)
                return
            }

            if (result.needsConfirmation) {
                setConfirmationSent(true)
                setSubmitting(false)
            }
            // Otherwise the useEffect above will navigate once isAuthenticated flips true.
        } catch (err) {
            setError('Something went wrong. Please try again.')
            setSubmitting(false)
        }
    }

    return (
        <main className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
                {/* Left side - Benefits */}
                <div className="hidden lg:block">
                    <Link to="/" className="inline-flex items-center gap-2 mb-8">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-2xl">F</span>
                        </div>
                        <span className="font-bold text-2xl text-foreground">Fixars</span>
                    </Link>

                    <h1 className="text-3xl font-bold text-foreground mb-4">
                        Join the future of connected productivity
                    </h1>
                    <p className="text-muted mb-8">
                        Start investing in ideas, validating concepts, collaborating, and showcasing skills—all from one account.
                    </p>

                    <ul className="space-y-4">
                        {BENEFITS.map((benefit, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                                    <CheckCircle className="w-4 h-4 text-success" />
                                </div>
                                <span className="text-foreground">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right side - Form */}
                <div>
                    <div className="text-center mb-8 lg:hidden">
                        <Link to="/" className="inline-flex items-center gap-2 mb-6">
                            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-2xl">F</span>
                            </div>
                        </Link>
                        <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                    </div>

                    <Card>
                        <CardContent className="p-6">
                            {confirmationSent ? (
                                <div className="text-center py-6 space-y-4 animate-fade-in">
                                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                                        <Mail className="w-8 h-8 text-success" />
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                                    <p className="text-muted text-sm max-w-xs mx-auto">
                                        We've sent a confirmation link to <strong className="text-foreground">{email}</strong>.
                                        Click the link to activate your account.
                                    </p>
                                    <Button variant="ghost" asChild>
                                        <Link to="/login">Go to Sign in</Link>
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {error && (
                                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                                {error}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Full name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                                                <Input
                                                    type="text"
                                                    placeholder="John Doe"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>

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
                                                    minLength={8}
                                                />
                                            </div>
                                            <p className="text-xs text-muted">At least 8 characters, with a letter and a number</p>
                                        </div>

                                        <Button type="submit" className="w-full" disabled={submitting}>
                                            {submitting ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                                            ) : (
                                                <>Create account <ArrowRight className="w-4 h-4 ml-2" /></>
                                            )}
                                        </Button>
                                    </form>

                                    <div className="mt-6 text-center">
                                        <p className="text-sm text-muted">
                                            Already have an account?{' '}
                                            <Link to="/login" className="text-primary font-medium hover:underline">
                                                Sign in
                                            </Link>
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <p className="text-center text-sm text-muted mt-6">
                        By creating an account, you agree to our{' '}
                        <Link to="/terms" className="text-primary hover:underline">Terms</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </main>
    )
}
