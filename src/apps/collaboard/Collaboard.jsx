import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'
import CreateBoardModal from '@/components/CreateBoardModal'
import AddTaskModal from '@/components/AddTaskModal'
import PageHead from '@/components/PageHead'
import { StatRow, Toolbar, ListGrid, EmptyState } from '@/components/SubAppKit'
import {
    Users,
    Plus,
    MoreVertical,
    CheckCircle,
    Clock,
    ArrowRight,
    MessageSquare,
    Calendar,
    ExternalLink
} from 'lucide-react'


function TaskCard({ task, columnId }) {
    return (
        <div className="p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-move">
            <div className="flex items-start justify-between mb-2">
                <div className="flex flex-wrap gap-1">
                    {task.labels?.map(label => (
                        <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                        </Badge>
                    ))}
                </div>
                <button className="p-1 rounded hover:bg-muted/20">
                    <MoreVertical className="w-4 h-4 text-muted" />
                </button>
            </div>

            <h4 className="font-medium text-foreground text-sm mb-2">{task.title}</h4>

            <div className="flex items-center justify-between text-xs text-muted">
                {task.dueDate && (
                    <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                )}
                {task.assigneeId && (
                    <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                            {task.assigneeId.slice(-2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}
            </div>
        </div>
    )
}

function BoardColumn({ column, boardId, onAddTask }) {
    const columnStyles = {
        todo: { icon: Clock, color: 'text-muted' },
        progress: { icon: ArrowRight, color: 'text-collaboard' },
        done: { icon: CheckCircle, color: 'text-success' }
    }

    const style = columnStyles[column.id] || columnStyles.todo
    const Icon = style.icon

    return (
        <div className="flex-1 min-w-[280px]">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${style.color}`} />
                    <h3 className="font-semibold text-foreground">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">{column.tasks.length}</Badge>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    aria-label={`Add task to ${column.title}`}
                    onClick={() => onAddTask?.(column.id)}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-2 p-2 rounded-xl bg-muted/10 min-h-[200px]">
                {column.tasks.map(task => (
                    <TaskCard key={task.id} task={task} columnId={column.id} />
                ))}
                {column.tasks.length === 0 && (
                    <p className="text-center text-sm text-muted py-8">No tasks</p>
                )}
            </div>
        </div>
    )
}

const TEAM_AV_BG = ['var(--color-collab)', 'var(--color-navy-900)', 'var(--color-skills)', 'var(--color-ink-300)']

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'mine', label: 'My Boards' },
    { value: 'active', label: 'Active' },
    { value: 'review', label: 'In review' },
    { value: 'done', label: 'Done' },
]

function boardStatus(board) {
    const taskCount = board.columns.reduce((s, c) => s + c.tasks.length, 0)
    const doneCount = board.columns.find(c => c.id === 'done')?.tasks.length || 0
    const reviewCount = board.columns.find(c => c.id === 'review' || c.id === 'in-review')?.tasks.length || 0
    if (taskCount > 0 && doneCount === taskCount) return { key: 'Done', cls: 'tag-success' }
    if (reviewCount > 0) return { key: 'In review', cls: 'tag-warning' }
    return { key: 'Active', cls: 'tag-collab' }
}

function ProjectCard({ board, onOpen }) {
    const taskCount = board.columns.reduce((s, c) => s + c.tasks.length, 0)
    const doneCount = board.columns.find(c => c.id === 'done')?.tasks.length || 0
    const status = boardStatus(board)

    return (
        <button className="list-card" onClick={() => onOpen(board.id)}>
            <div className="lc-head">
                <span className={`tag ${status.cls}`}><span className="tag-dot" />{status.key}</span>
                <span className="lc-mono">{doneCount}/{taskCount} tasks</span>
            </div>
            <div className="title">{board.title}</div>
            <p className="desc line-clamp-2">{board.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex' }}>
                    {board.members.slice(0, 4).map((m, i) => (
                        <div key={m.userId} className="av team-av" style={{ background: TEAM_AV_BG[i % 4], marginLeft: i ? -8 : 0 }}>
                            {getInitials(m.name)}
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div className="micro-k">Team</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{board.members.length} members</div>
                </div>
            </div>
        </button>
    )
}

export default function Collaboard() {
    const { boards, getRecommendedTalents } = useData()
    const { isAuthenticated, user } = useAuth()
    const [searchParams] = useSearchParams()
    const [selectedBoard, setSelectedBoard] = useState(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [addTaskState, setAddTaskState] = useState({ open: false, column: 'todo' })
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        const boardId = searchParams.get('boardId')
        if (boardId) {
            setSelectedBoard(boardId)
        }
    }, [searchParams])

    if (selectedBoard) {
        const board = boards.find(b => b.id === selectedBoard)
        if (!board) {
            setSelectedBoard(null)
            return null
        }

        const recommendations = getRecommendedTalents(board.id)

        return (
            <main className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Board Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => setSelectedBoard(null)}>
                                ← Back
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{board.title}</h1>
                                <p className="text-sm text-muted">{board.members.length} members</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link to="/messages">
                                    <MessageSquare className="w-4 h-4 mr-2" /> Chat
                                </Link>
                            </Button>
                            <Button variant="collaboard" onClick={() => setAddTaskState({ open: true, column: 'todo' })}>
                                <Plus className="w-4 h-4 mr-2" /> Add Task
                            </Button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-4 gap-6">
                        {/* Kanban Board */}
                        <div className="lg:col-span-3 flex gap-4 overflow-x-auto pb-4">
                            {board.columns.map(column => (
                                <BoardColumn
                                    key={column.id}
                                    column={column}
                                    boardId={board.id}
                                    onAddTask={(colId) => setAddTaskState({ open: true, column: colId })}
                                />
                            ))}
                        </div>

                        {/* Skill Summoner Sidebar */}
                        <div className="space-y-6">
                            <Card className="border-collaboard/20 bg-collaboard/5">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2 text-collaboard">
                                        <Users className="w-5 h-5 font-bold" />
                                        <CardTitle className="text-lg">Skill Summoner</CardTitle>
                                    </div>
                                    <p className="text-xs text-muted">AI-recommended talent for this project</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {recommendations.length > 0 ? (
                                        recommendations.map(talent => (
                                            <div key={talent.id} className="p-3 rounded-lg bg-card border shadow-sm group hover:border-collaboard transition-colors">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="text-xs">{getInitials(talent.displayName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{talent.displayName}</p>
                                                        <p className="text-xs text-muted">{talent.hourlyRate}/hr</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {talent.skills.slice(0, 2).map((s, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">{s.name}</Badge>
                                                    ))}
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full h-8 text-xs group-hover:bg-collaboard group-hover:text-white">
                                                    Summon Help
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted text-center py-4">No matching talent found</p>
                                    )}
                                    <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                                        <Link to="/apps/skillscanvas">
                                            View all on SkillsCanvas →
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Project Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted leading-relaxed">
                                        {board.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <AddTaskModal
                    open={addTaskState.open}
                    onClose={() => setAddTaskState({ open: false, column: 'todo' })}
                    boardId={board.id}
                    defaultColumnId={addTaskState.column}
                />
            </main>
        )
    }

    const totalTasks = boards.reduce((sum, b) => sum + b.columns.reduce((s, c) => s + c.tasks.length, 0), 0)
    const collaborators = new Set(boards.flatMap(b => b.members.map(m => m.userId))).size
    const doneBoards = boards.filter(b => boardStatus(b).key === 'Done').length

    const stats = [
        { k: 'Total boards', v: boards.length, t: 'projects in flight' },
        { k: 'Active tasks', v: totalTasks, t: 'across all boards' },
        { k: 'Collaborators', v: collaborators, t: 'shipping together' },
        { k: 'Completed', v: doneBoards, t: 'boards delivered', tColor: 'var(--color-success)' },
    ]

    const visibleBoards = boards.filter(board => {
        const matchesSearch = board.title.toLowerCase().includes(search.toLowerCase()) ||
            (board.description || '').toLowerCase().includes(search.toLowerCase())
        if (!matchesSearch) return false
        if (filter === 'mine') return board.members.some(m => m.userId === user?.id)
        if (filter === 'active') return boardStatus(board).key === 'Active'
        if (filter === 'review') return boardStatus(board).key === 'In review'
        if (filter === 'done') return boardStatus(board).key === 'Done'
        return true
    })

    return (
        <main className="py-8">
            <div className="subapp-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <PageHead
                    app="collab"
                    glyph="B"
                    tag="Execution · Escrowed sprints"
                    title="CollaBoard"
                    sub="Where validated ideas become shipped products. Milestone-based escrow keeps money safe and teams paid."
                    actions={isAuthenticated && (
                        <Button variant="collaboard" size="lg" onClick={() => setCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Create Board
                        </Button>
                    )}
                />

                <StatRow stats={stats} />

                <Toolbar
                    search={search}
                    onSearch={setSearch}
                    placeholder="Search boards…"
                    filters={FILTERS}
                    active={filter}
                    onFilter={setFilter}
                />

                <ListGrid>
                    {visibleBoards.length > 0 ? (
                        visibleBoards.map(board => (
                            <ProjectCard key={board.id} board={board} onOpen={setSelectedBoard} />
                        ))
                    ) : (
                        <EmptyState
                            title={boards.length === 0 ? 'No boards yet' : 'No boards match'}
                            sub={boards.length === 0 ? 'Create one to start collaborating.' : 'Try a different search or filter.'}
                            onClear={() => { setSearch(''); setFilter('all') }}
                        />
                    )}
                </ListGrid>
            </div>

            <CreateBoardModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(board) => setSelectedBoard(board.id)}
            />
        </main>
    )
}
