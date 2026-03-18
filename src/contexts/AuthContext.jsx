import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, TABLES } from '@/lib/supabase'

const AuthContext = createContext(null)

// Mock user data for development
const MOCK_USER = {
    id: 'user-001',
    name: 'Alex Morgan',
    email: 'alex@fixars.io',
    avatar: null,
    points: 1250,
    level: 'Pioneer',
    joinedAt: '2025-06-15',
    bio: 'Building the future, one idea at a time.',
    skills: ['Product Strategy', 'UX Design', 'React'],
    connections: 47,
    projects: 12
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Initialize auth state
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            // Use localStorage mock for development
            const savedUser = localStorage.getItem('fixars_user')
            if (savedUser) {
                setUser(JSON.parse(savedUser))
            }
            setIsLoading(false)
            return
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession)
            if (initialSession?.user) {
                fetchProfile(initialSession.user.id)
            } else {
                setIsLoading(false)
            }
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                setSession(currentSession)

                if (event === 'SIGNED_IN' && currentSession?.user) {
                    await fetchProfile(currentSession.user.id)
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setIsLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from(TABLES.PROFILES)
                .select('*')
                .eq('id', userId)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error)
            }

            if (data) {
                setUser({
                    id: data.id,
                    name: data.display_name,
                    email: data.email,
                    avatar: data.avatar_url,
                    points: data.points || 0,
                    level: data.level || 'Newcomer',
                    bio: data.bio,
                    joinedAt: data.created_at
                })
            } else {
                // Profile doesn't exist yet, create from auth user
                const { data: { user: authUser } } = await supabase.auth.getUser()
                if (authUser) {
                    setUser({
                        id: authUser.id,
                        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                        email: authUser.email,
                        avatar: authUser.user_metadata?.avatar_url,
                        points: 0,
                        level: 'Newcomer'
                    })
                }
            }
        } catch (err) {
            console.error('Error in fetchProfile:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email, password) => {
        if (!isSupabaseConfigured()) {
            // Mock login
            setIsLoading(true)
            await new Promise(resolve => setTimeout(resolve, 800))

            let userId = 'user-001'
            let name = 'Alex Morgan'

            if (email === 'marcus@fixars.com' || email === 'marcus@fixars.io') {
                userId = 'user-003'
                name = 'Marcus Williams'
            } else if (email === 'sarah@fixars.com' || email === 'sarah@fixars.io') {
                userId = 'user-002'
                name = 'Sarah Chen'
            }

            const loggedInUser = { ...MOCK_USER, id: userId, name: name, email }
            setUser(loggedInUser)
            localStorage.setItem('fixars_user', JSON.stringify(loggedInUser))
            setIsLoading(false)
            return { user: loggedInUser, error: null }
        }

        setIsLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                setIsLoading(false)
                return { user: null, error }
            }

            // If we got a session, fetchProfile will be triggered by onAuthStateChange
            // If not, reset loading
            if (!data.session) {
                setIsLoading(false)
            }

            return { user: data.user, error: null }
        } catch (err) {
            setIsLoading(false)
            return { user: null, error: { message: err.message || 'Login failed' } }
        }
    }

    const loginWithMagicLink = async (email) => {
        if (!isSupabaseConfigured()) {
            return { error: { message: 'Magic link not available in development mode' } }
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin + '/dashboard'
                }
            })
            return { error }
        } catch (err) {
            return { error: { message: err.message || 'Failed to send magic link' } }
        }
    }

    const signup = async (name, email, password) => {
        if (!isSupabaseConfigured()) {
            // Mock signup
            setIsLoading(true)
            await new Promise(resolve => setTimeout(resolve, 800))
            const newUser = {
                ...MOCK_USER,
                id: 'user-' + Date.now(),
                name,
                email,
                points: 50,
                level: 'Newcomer',
                joinedAt: new Date().toISOString()
            }
            setUser(newUser)
            localStorage.setItem('fixars_user', JSON.stringify(newUser))
            setIsLoading(false)
            return { user: newUser, error: null }
        }

        setIsLoading(true)
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            })

            if (error) {
                setIsLoading(false)
                return { user: null, error }
            }

            // Supabase may require email confirmation — no session yet
            // Always reset loading so the button doesn't hang
            setIsLoading(false)

            // If email confirmation is required, data.session will be null
            const needsConfirmation = !data.session
            return {
                user: data.user,
                error: null,
                needsConfirmation
            }
        } catch (err) {
            setIsLoading(false)
            return { user: null, error: { message: err.message || 'Signup failed' } }
        }
    }

    const loginWithOAuth = async (provider) => {
        if (!isSupabaseConfigured()) {
            return { error: { message: 'OAuth not available in development mode' } }
        }

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin + '/dashboard'
            }
        })

        return { data, error }
    }

    const logout = async () => {
        if (!isSupabaseConfigured()) {
            setUser(null)
            localStorage.removeItem('fixars_user')
            return
        }

        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
    }

    const updateUser = async (updates) => {
        if (!isSupabaseConfigured()) {
            const updatedUser = { ...user, ...updates }
            setUser(updatedUser)
            localStorage.setItem('fixars_user', JSON.stringify(updatedUser))
            return { error: null }
        }

        if (!user?.id) return { error: 'Not authenticated' }

        const { error } = await supabase
            .from(TABLES.PROFILES)
            .update({
                display_name: updates.name,
                avatar_url: updates.avatar,
                bio: updates.bio,
                points: updates.points,
                level: updates.level
            })
            .eq('id', user.id)

        if (!error) {
            setUser(prev => ({ ...prev, ...updates }))
        }

        return { error }
    }

    const resetPassword = async (email) => {
        if (!isSupabaseConfigured()) {
            return { error: { message: 'Password reset not available in development mode' } }
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password'
        })

        return { error }
    }

    return (
        <AuthContext.Provider value={{
            user,
            session,
            isLoading,
            isAuthenticated: !!user,
            isSupabaseConfigured: isSupabaseConfigured(),
            login,
            loginWithMagicLink,
            signup,
            loginWithOAuth,
            logout,
            updateUser,
            resetPassword,
            refetchProfile: () => user?.id && fetchProfile(user.id)
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
