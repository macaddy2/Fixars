import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthContext'

// DB service imports
import { fetchStakes, createStakeDB, makeStakeDB } from '@/lib/db/stakes'
import { fetchIdeas, submitIdeaDB, voteIdeaDB, linkIdeaToBoardDB, linkIdeaToStakeDB } from '@/lib/db/ideas'
import { fetchBoards, createBoardDB, addTaskDB, moveTaskDB } from '@/lib/db/boards'

const DataContext = createContext(null)

// Mock data for development (used when Supabase is not configured)
const MOCK_DATA = {
    stakes: [
        {
            id: 'stake-001',
            title: 'AI-Powered Recipe Generator',
            description: 'A mobile app that uses AI to generate personalized recipes based on dietary preferences, available ingredients, and nutritional goals.',
            creatorId: 'user-002',
            creatorName: 'Sarah Chen',
            category: 'tech',
            riskLevel: 'medium',
            targetAmount: 15000,
            currentAmount: 9750,
            stakers: [
                { userId: 'user-003', amount: 2500, date: '2026-01-15' },
                { userId: 'user-004', amount: 3000, date: '2026-01-16' },
                { userId: 'user-005', amount: 4250, date: '2026-01-18' }
            ],
            expectedReturns: '2-4x',
            deadline: '2026-03-01',
            status: 'active',
            createdAt: '2026-01-10'
        },
        {
            id: 'stake-002',
            title: 'Sustainable Fashion Marketplace',
            description: 'A peer-to-peer platform for buying, selling, and renting pre-owned designer fashion items with verified authenticity.',
            creatorId: 'user-003',
            creatorName: 'Marcus Williams',
            category: 'marketplace',
            riskLevel: 'low',
            targetAmount: 25000,
            currentAmount: 22500,
            stakers: [],
            expectedReturns: '1.5-3x',
            deadline: '2026-02-15',
            status: 'active',
            createdAt: '2026-01-05'
        },
        {
            id: 'stake-003',
            title: 'Remote Team Wellness Platform',
            description: 'Enterprise SaaS for tracking and improving remote team wellness through gamified challenges and mental health resources.',
            creatorId: 'user-004',
            creatorName: 'Emily Rodriguez',
            category: 'health',
            riskLevel: 'high',
            targetAmount: 50000,
            currentAmount: 18000,
            stakers: [],
            expectedReturns: '3-6x',
            deadline: '2026-04-01',
            status: 'active',
            createdAt: '2026-01-08'
        }
    ],
    ideas: [
        {
            id: 'idea-001',
            title: 'Community Solar Grid Network',
            description: 'A decentralized network allowing neighborhoods to share solar energy production, reducing costs and increasing sustainability for all participants.',
            creatorId: 'user-005',
            creatorName: 'David Kim',
            category: 'sustainability',
            validationScore: 82,
            votes: { up: 156, down: 18 },
            validators: [
                { userId: 'user-002', badge: 'Expert', vote: 'up', comment: 'Solid technical foundation and clear market need.' }
            ],
            status: 'validated',
            impactTags: ['environmental', 'community', 'energy'],
            linkedStakeId: null,
            linkedBoardId: 'board-002',
            createdAt: '2026-01-12'
        },
        {
            id: 'idea-002',
            title: 'Skills-Based Volunteer Matching',
            description: 'Platform connecting skilled professionals with non-profits that need their specific expertise, maximizing impact per volunteer hour.',
            creatorId: 'user-006',
            creatorName: 'Lisa Park',
            category: 'social-impact',
            validationScore: 68,
            votes: { up: 89, down: 24 },
            validators: [],
            status: 'validating',
            impactTags: ['social', 'skills', 'non-profit'],
            linkedStakeId: null,
            linkedBoardId: null,
            createdAt: '2026-01-14'
        },
        {
            id: 'idea-003',
            title: 'Hyperlocal News Aggregator',
            description: 'AI-curated news feed focusing on truly local stories within a 5-mile radius, supporting community journalism.',
            creatorId: 'user-007',
            creatorName: 'James Wilson',
            category: 'media',
            validationScore: 45,
            votes: { up: 34, down: 31 },
            validators: [],
            status: 'validating',
            impactTags: ['media', 'local', 'community'],
            linkedStakeId: null,
            linkedBoardId: null,
            createdAt: '2026-01-16'
        }
    ],
    boards: [
        {
            id: 'board-001',
            title: 'Fixars Core Development',
            description: 'Main development board for Fixars platform integration features.',
            creatorId: 'user-001',
            members: [
                { userId: 'user-001', role: 'owner', name: 'Alex Morgan' },
                { userId: 'user-003', role: 'admin', name: 'Marcus Williams' },
                { userId: 'user-004', role: 'member', name: 'Emily Rodriguez' }
            ],
            columns: [
                {
                    id: 'todo',
                    title: 'To Do',
                    tasks: [
                        { id: 't1', title: 'Design points leaderboard', assigneeId: 'user-004', dueDate: '2026-01-25', labels: ['design', 'priority'] }
                    ]
                },
                {
                    id: 'progress',
                    title: 'In Progress',
                    tasks: [
                        { id: 't2', title: 'Implement cross-app notifications', assigneeId: 'user-003', dueDate: '2026-01-22', labels: ['feature'] }
                    ]
                },
                {
                    id: 'done',
                    title: 'Done',
                    tasks: [
                        { id: 't3', title: 'Set up shared auth context', assigneeId: 'user-001', dueDate: '2026-01-18', labels: ['core'], completedAt: '2026-01-17' }
                    ]
                }
            ],
            linkedIdeaId: null,
            agreements: [],
            createdAt: '2026-01-01'
        },
        {
            id: 'board-002',
            title: 'Solar Grid Project',
            description: 'Execution board for the Community Solar Grid Network idea.',
            creatorId: 'user-005',
            members: [
                { userId: 'user-005', role: 'owner', name: 'David Kim' },
                { userId: 'user-002', role: 'member', name: 'Sarah Chen' }
            ],
            columns: [
                { id: 'todo', title: 'To Do', tasks: [] },
                { id: 'progress', title: 'In Progress', tasks: [] },
                { id: 'done', title: 'Done', tasks: [] }
            ],
            linkedIdeaId: 'idea-001',
            agreements: [],
            createdAt: '2026-01-13'
        }
    ],
    talents: [
        {
            id: 'talent-001',
            userId: 'user-008',
            displayName: 'Jessica Lee',
            bio: 'Full-stack developer with 8 years of experience in React, Node, and cloud architecture.',
            skills: [
                { name: 'React', level: 'expert', verified: true },
                { name: 'Node.js', level: 'expert', verified: true },
                { name: 'AWS', level: 'advanced', verified: true },
                { name: 'TypeScript', level: 'advanced', verified: false }
            ],
            availability: 'part-time',
            hourlyRate: 95,
            rating: 4.9,
            reviewCount: 28,
            completedProjects: 34,
            portfolio: ['Full-stack SaaS platform', 'E-commerce rebuild', 'Real-time collaboration tool']
        },
        {
            id: 'talent-002',
            userId: 'user-009',
            displayName: 'Michael Torres',
            bio: 'UI/UX designer passionate about creating intuitive and beautiful digital experiences.',
            skills: [
                { name: 'UI Design', level: 'expert', verified: true },
                { name: 'UX Research', level: 'advanced', verified: true },
                { name: 'Figma', level: 'expert', verified: true },
                { name: 'Prototyping', level: 'advanced', verified: false }
            ],
            availability: 'full-time',
            hourlyRate: 75,
            rating: 4.8,
            reviewCount: 19,
            completedProjects: 23,
            portfolio: ['FinTech app redesign', 'E-learning platform', 'Healthcare dashboard']
        },
        {
            id: 'talent-003',
            userId: 'user-010',
            displayName: 'Anna Kowalski',
            bio: 'Marketing strategist specializing in growth hacking and community building for startups.',
            skills: [
                { name: 'Growth Marketing', level: 'expert', verified: true },
                { name: 'Community Building', level: 'expert', verified: true },
                { name: 'Content Strategy', level: 'advanced', verified: false },
                { name: 'Analytics', level: 'intermediate', verified: false }
            ],
            availability: 'part-time',
            hourlyRate: 85,
            rating: 4.7,
            reviewCount: 15,
            completedProjects: 18,
            portfolio: ['0 to 50K users campaign', 'Community launch strategy', 'Viral content series']
        }
    ]
}

export function DataProvider({ children }) {
    const { user } = useAuth()
    const isConfigured = isSupabaseConfigured()

    const [stakes, setStakes] = useState(isConfigured ? [] : MOCK_DATA.stakes)
    const [ideas, setIdeas] = useState(isConfigured ? [] : MOCK_DATA.ideas)
    const [boards, setBoards] = useState(isConfigured ? [] : MOCK_DATA.boards)
    const [talents, setTalents] = useState(isConfigured ? [] : MOCK_DATA.talents)
    const [loading, setLoading] = useState(isConfigured)
    const [error, setError] = useState(null)
    const [activities, setActivities] = useState(isConfigured ? [] : [
        {
            id: 'act-001',
            type: 'launch',
            user: 'Alex Morgan',
            message: 'launched Solar Grid Project',
            timestamp: '2026-01-20T10:00:00Z',
            app: 'conceptnexus'
        },
        {
            id: 'act-002',
            type: 'stake',
            user: 'Sarah Chen',
            message: 'staked $5,000 on Fixars Core Dev',
            timestamp: '2026-01-19T15:30:00Z',
            app: 'vestden'
        },
        {
            id: 'act-003',
            type: 'skill',
            user: 'Jessica Lee',
            message: 'joined the talent pool',
            timestamp: '2026-01-19T09:00:00Z',
            app: 'skillscanvas'
        }
    ])

    // ── Fetch data from Supabase on mount ──
    useEffect(() => {
        if (!isConfigured) return

        async function loadData() {
            try {
                setLoading(true)
                const [stakesData, ideasData] = await Promise.all([
                    fetchStakes(),
                    fetchIdeas()
                ])
                setStakes(stakesData)
                setIdeas(ideasData)

                // Boards require user context
                if (user?.id) {
                    const boardsData = await fetchBoards(user.id)
                    setBoards(boardsData)
                }
            } catch (err) {
                console.error('Error loading data:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [isConfigured, user?.id])

    const logActivity = useCallback((type, userName, message, app) => {
        setActivities(prev => [
            {
                id: `act-${Date.now()}`,
                type,
                user: userName,
                message,
                timestamp: new Date().toISOString(),
                app
            },
            ...prev
        ].slice(0, 10))
    }, [])

    // ── VestDen actions ──
    const createStake = useCallback(async (stake) => {
        if (!isConfigured) {
            const newStake = {
                id: 'stake-' + Date.now(),
                ...stake,
                stakers: [],
                currentAmount: 0,
                status: 'active',
                createdAt: new Date().toISOString()
            }
            setStakes(prev => [newStake, ...prev])
            return newStake
        }

        const newStake = await createStakeDB(stake)
        setStakes(prev => [newStake, ...prev])
        return newStake
    }, [isConfigured])

    const makeStake = useCallback(async (stakeId, userId, amount) => {
        if (!isConfigured) {
            setStakes(prev => prev.map(s => {
                if (s.id !== stakeId) return s
                return {
                    ...s,
                    stakers: [...s.stakers, { userId, amount, date: new Date().toISOString() }],
                    currentAmount: s.currentAmount + amount,
                    status: s.currentAmount + amount >= s.targetAmount ? 'funded' : 'active'
                }
            }))
            return
        }

        await makeStakeDB(stakeId, userId, amount)
        // Re-fetch to get trigger-updated values
        const updated = await fetchStakes()
        setStakes(updated)
    }, [isConfigured])

    // ── ConceptNexus actions ──
    const submitIdea = useCallback(async (idea) => {
        if (!isConfigured) {
            const newIdea = {
                id: 'idea-' + Date.now(),
                ...idea,
                validationScore: 0,
                votes: { up: 0, down: 0 },
                validators: [],
                status: 'validating',
                linkedStakeId: null,
                linkedBoardId: null,
                createdAt: new Date().toISOString()
            }
            setIdeas(prev => [newIdea, ...prev])
            return newIdea
        }

        const newIdea = await submitIdeaDB(idea)
        setIdeas(prev => [newIdea, ...prev])
        return newIdea
    }, [isConfigured])

    const voteIdea = useCallback(async (ideaId, userId, vote) => {
        if (!isConfigured) {
            setIdeas(prev => prev.map(i => {
                if (i.id !== ideaId) return i
                const votes = { ...i.votes }
                votes[vote] = (votes[vote] || 0) + 1
                const total = votes.up + votes.down
                const validationScore = total > 0 ? Math.round((votes.up / total) * 100) : 0
                return {
                    ...i,
                    votes,
                    validationScore,
                    status: validationScore >= 75 && total >= 10 ? 'validated' : i.status
                }
            }))
            return
        }

        await voteIdeaDB(ideaId, userId, vote)
        const updated = await fetchIdeas()
        setIdeas(updated)
    }, [isConfigured])

    // ── Collaboard actions ──
    const createBoard = useCallback(async (board) => {
        if (!isConfigured) {
            const newBoard = {
                id: 'board-' + Date.now(),
                ...board,
                columns: [
                    { id: 'todo', title: 'To Do', tasks: [] },
                    { id: 'progress', title: 'In Progress', tasks: [] },
                    { id: 'done', title: 'Done', tasks: [] }
                ],
                agreements: [],
                createdAt: new Date().toISOString()
            }
            setBoards(prev => [newBoard, ...prev])
            return newBoard
        }

        const newBoard = await createBoardDB(board)
        setBoards(prev => [newBoard, ...prev])
        return newBoard
    }, [isConfigured])

    const addTask = useCallback(async (boardId, columnId, task) => {
        if (!isConfigured) {
            setBoards(prev => prev.map(b => {
                if (b.id !== boardId) return b
                return {
                    ...b,
                    columns: b.columns.map(col => {
                        if (col.id !== columnId) return col
                        return {
                            ...col,
                            tasks: [...col.tasks, { id: 't-' + Date.now(), ...task }]
                        }
                    })
                }
            }))
            return
        }

        const newTask = await addTaskDB(boardId, columnId, task)
        setBoards(prev => prev.map(b => {
            if (b.id !== boardId) return b
            return {
                ...b,
                columns: b.columns.map(col => {
                    if (col.id !== columnId) return col
                    return { ...col, tasks: [...col.tasks, newTask] }
                })
            }
        }))
    }, [isConfigured])

    const moveTask = useCallback(async (boardId, taskId, fromCol, toCol) => {
        if (!isConfigured) {
            setBoards(prev => prev.map(b => {
                if (b.id !== boardId) return b
                let task = null
                const columns = b.columns.map(col => {
                    if (col.id === fromCol) {
                        task = col.tasks.find(t => t.id === taskId)
                        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
                    }
                    if (col.id === toCol && task) {
                        return { ...col, tasks: [...col.tasks, toCol === 'done' ? { ...task, completedAt: new Date().toISOString() } : task] }
                    }
                    return col
                })
                return { ...b, columns }
            }))
            return
        }

        // Find the target column's UUID
        const board = boards.find(b => b.id === boardId)
        const targetColumn = board?.columns.find(c => c.id === toCol)
        if (targetColumn) {
            await moveTaskDB(taskId, targetColumn.id, toCol === 'done')
        }

        // Optimistic update locally
        setBoards(prev => prev.map(b => {
            if (b.id !== boardId) return b
            let task = null
            const columns = b.columns.map(col => {
                if (col.id === fromCol) {
                    task = col.tasks.find(t => t.id === taskId)
                    return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) }
                }
                if (col.id === toCol && task) {
                    return { ...col, tasks: [...col.tasks, toCol === 'done' ? { ...task, completedAt: new Date().toISOString() } : task] }
                }
                return col
            })
            return { ...b, columns }
        }))
    }, [isConfigured, boards])

    // ── SkillsCanvas actions ──
    const updateTalentProfile = useCallback((talentId, updates) => {
        setTalents(prev => prev.map(t =>
            t.id === talentId ? { ...t, ...updates } : t
        ))
    }, [])

    // ── Cross-app linking ──
    const linkIdeaToStake = useCallback(async (ideaId, stakeId) => {
        if (!isConfigured) {
            setIdeas(prev => prev.map(i =>
                i.id === ideaId ? { ...i, linkedStakeId: stakeId } : i
            ))
            return
        }
        await linkIdeaToStakeDB(ideaId, stakeId)
        setIdeas(prev => prev.map(i =>
            i.id === ideaId ? { ...i, linkedStakeId: stakeId } : i
        ))
    }, [isConfigured])

    const linkIdeaToBoard = useCallback(async (ideaId, boardId) => {
        if (!isConfigured) {
            setIdeas(prev => prev.map(i =>
                i.id === ideaId ? { ...i, linkedBoardId: boardId } : i
            ))
            setBoards(prev => prev.map(b =>
                b.id === boardId ? { ...b, linkedIdeaId: ideaId } : b
            ))
            return
        }
        await linkIdeaToBoardDB(ideaId, boardId)
        setIdeas(prev => prev.map(i =>
            i.id === ideaId ? { ...i, linkedBoardId: boardId } : i
        ))
        setBoards(prev => prev.map(b =>
            b.id === boardId ? { ...b, linkedIdeaId: ideaId } : b
        ))
    }, [isConfigured])

    const launchProjectFromIdea = useCallback(async (idea, userId, userName) => {
        const newBoard = await createBoard({
            title: idea.title,
            description: `Project launched from idea: ${idea.description}`,
            creatorId: userId,
            members: [{ userId, role: 'owner', name: userName }],
            linkedIdeaId: idea.id
        })
        await linkIdeaToBoard(idea.id, newBoard.id)
        logActivity('launch', userName, `launched ${idea.title} Project`, 'conceptnexus')
        return newBoard
    }, [createBoard, linkIdeaToBoard, logActivity])

    const getRecommendedTalents = useCallback((boardId) => {
        const board = boards.find(b => b.id === boardId)
        if (!board) return []

        const searchTerms = [
            ...board.title.toLowerCase().split(' '),
            ...board.description.toLowerCase().split(' ')
        ].filter(term => term.length > 3)

        return talents
            .map(talent => {
                let score = 0
                talent.skills.forEach(skill => {
                    if (searchTerms.some(term => skill.name.toLowerCase().includes(term) || term.includes(skill.name.toLowerCase()))) {
                        score += skill.level === 'expert' ? 3 : skill.level === 'advanced' ? 2 : 1
                        if (skill.verified) score += 2
                    }
                })
                return { ...talent, matchScore: score }
            })
            .filter(t => t.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 3)
    }, [boards, talents])

    return (
        <DataContext.Provider value={{
            // Data
            stakes,
            ideas,
            boards,
            talents,
            activities,
            loading,
            error,
            logActivity,
            // VestDen
            createStake,
            makeStake,
            // ConceptNexus
            submitIdea,
            voteIdea,
            // Collaboard
            createBoard,
            addTask,
            moveTask,
            // SkillsCanvas
            updateTalentProfile,
            // Cross-app
            linkIdeaToStake,
            linkIdeaToBoard,
            launchProjectFromIdea,
            getRecommendedTalents
        }}>
            {children}
        </DataContext.Provider>
    )
}

export function useData() {
    const context = useContext(DataContext)
    if (!context) {
        throw new Error('useData must be used within a DataProvider')
    }
    return context
}
