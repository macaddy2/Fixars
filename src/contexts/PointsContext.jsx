import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

const PointsContext = createContext(null)

// Points configuration
const POINT_ACTIONS = {
    DAILY_LOGIN: { points: 5, label: 'Daily login bonus' },
    SUBMIT_IDEA: { points: 10, label: 'Submitted an idea' },
    VALIDATE_IDEA: { points: 5, label: 'Validated an idea' },
    IDEA_VALIDATED: { points: 50, label: 'Your idea was validated' },
    MAKE_STAKE: { points: 15, label: 'Made a stake' },
    COMPLETE_TASK: { points: 10, label: 'Completed a task' },
    GET_HIRED: { points: 25, label: 'Got hired for a project' },
    PROFILE_COMPLETE: { points: 20, label: 'Profile completed' },
    FIRST_MESSAGE: { points: 5, label: 'Sent first message' },
    REFERRAL: { points: 100, label: 'Successful referral' },
    POST_STATUS: { points: 3, label: 'Posted a status' },
    RECEIVE_REACTION: { points: 1, label: 'Received a reaction' }
}

const LEVELS = [
    { name: 'Newcomer', minPoints: 0 },
    { name: 'Explorer', minPoints: 100 },
    { name: 'Contributor', minPoints: 500 },
    { name: 'Pioneer', minPoints: 1000 },
    { name: 'Trailblazer', minPoints: 2500 },
    { name: 'Visionary', minPoints: 5000 },
    { name: 'Legend', minPoints: 10000 }
]

const BADGES = {
    FIRST_IDEA: { id: 'first-idea', name: 'Innovator', icon: '💡', description: 'Submitted your first idea' },
    FIRST_STAKE: { id: 'first-stake', name: 'Investor', icon: '📈', description: 'Made your first stake' },
    TEAM_PLAYER: { id: 'team-player', name: 'Team Player', icon: '🤝', description: 'Joined 3 boards' },
    VALIDATOR: { id: 'validator', name: 'Validator', icon: '✅', description: 'Validated 10 ideas' },
    PIONEER: { id: 'pioneer', name: 'Pioneer', icon: '🚀', description: 'Reached Pioneer level' },
    LEGEND: { id: 'legend', name: 'Legend', icon: '👑', description: 'Reached Legend level' }
}

export function PointsProvider({ children }) {
    const { user, updateUser } = useAuth()
    const [history, setHistory] = useState([])
    const [showReward, setShowReward] = useState(null)
    const [userBadges, setUserBadges] = useState([])
    const [showBadge, setShowBadge] = useState(null)

    const getLevel = useCallback((points) => {
        return LEVELS.reduce((acc, level) => {
            if (points >= level.minPoints) return level
            return acc
        }, LEVELS[0])
    }, [])

    const getNextLevel = useCallback((points) => {
        const currentIndex = LEVELS.findIndex(l => l.minPoints > points)
        return currentIndex > 0 ? LEVELS[currentIndex] : null
    }, [])

    const awardPoints = useCallback((actionKey, metadata = {}) => {
        if (!user) return

        const action = POINT_ACTIONS[actionKey]
        if (!action) {
            console.warn(`Unknown action: ${actionKey}`)
            return
        }

        const newPoints = (user.points || 0) + action.points
        const newLevel = getLevel(newPoints)

        // Record history
        const record = {
            id: Date.now(),
            action: actionKey,
            points: action.points,
            label: action.label,
            timestamp: new Date().toISOString(),
            ...metadata
        }
        setHistory(prev => [record, ...prev].slice(0, 50))

        // Show reward animation
        setShowReward({
            points: action.points,
            label: action.label
        })
        setTimeout(() => setShowReward(null), 2500)

        // Update user
        updateUser({
            points: newPoints,
            level: newLevel.name
        })

        return record
    }, [user, updateUser, getLevel])

    const spendPoints = useCallback((amount, reason) => {
        if (!user || user.points < amount) return false

        const newPoints = user.points - amount
        updateUser({ points: newPoints })

        setHistory(prev => [{
            id: Date.now(),
            action: 'SPEND',
            points: -amount,
            label: reason,
            timestamp: new Date().toISOString()
        }, ...prev].slice(0, 50))

        return true
    }, [user, updateUser])

    const awardBadge = useCallback((badgeKey) => {
        const badge = BADGES[badgeKey]
        if (!badge) return
        if (userBadges.some(b => b.id === badge.id)) return // Already earned

        setUserBadges(prev => [...prev, badge])
        setShowBadge(badge)
        setTimeout(() => setShowBadge(null), 3000)
    }, [userBadges])

    return (
        <PointsContext.Provider value={{
            points: user?.points || 0,
            level: user?.level || 'Newcomer',
            history,
            showReward,
            showBadge,
            userBadges,
            awardPoints,
            spendPoints,
            awardBadge,
            getLevel,
            getNextLevel,
            POINT_ACTIONS,
            LEVELS,
            BADGES
        }}>
            {children}
        </PointsContext.Provider>
    )
}

export function usePoints() {
    const context = useContext(PointsContext)
    if (!context) {
        throw new Error('usePoints must be used within a PointsProvider')
    }
    return context
}
