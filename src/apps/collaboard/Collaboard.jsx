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

function BoardCard({ board }) {
    const taskCount = board.columns.reduce((sum, col) => sum + col.tasks.length, 0)
    const doneCount = board.columns.find(c => c.id === 'done')?.tasks.length || 0

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
            <div className="h-1.5 gradient-collaboard" />
            <CardContent className="p-5">
                <h3 className="font-bold text-lg text-foreground mb-2">{board.title}</h3>
                <p className="text-sm text-muted mb-4 line-clamp-2">{board.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted mb-4">
                    <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {doneCount}/{taskCount} tasks
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {board.members.length} members
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                        {board.members.slice(0, 4).map((member, i) => (
                            <Avatar key={member.userId} className="w-8 h-8 border-2 border-card">
                                <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                        ))}
                        {board.members.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                                +{board.members.length - 4}
                            </div>
                        )}
                    </div>
                    {board.linkedIdeaId && (
                        <Badge variant="conceptnexus" className="text-xs">
                            Linked to idea
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default function Collaboard() {
    const { boards, getRecommendedTalents } = useData()
    const { isAuthenticated, user } = useAuth()
    const [searchParams] = useSearchParams()
    const [selectedBoard, setSelectedBoard] = useState(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [addTaskState, setAddTaskState] = useState({ open: false, column: 'todo' })

    useEffect(() => {
        const boardId = searchParams.get('boardId')
        if (boardId) {
            setSelectedBoard(boardId)
        }
    }, [searchParams])

    const myBoards = boards.filter(b =>
        b.members.some(m => m.userId === user?.id)
    )

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

    return (
        <main className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl gradient-collaboard flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-foreground">Collaboard</h1>
                        </div>
                        <p className="text-muted">Collaboration-ready sandbox. Team up and work together effortlessly.</p>
                    </div>

                    {isAuthenticated && (
                        <Button variant="collaboard" size="lg" onClick={() => setCreateOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Create Board
                        </Button>
                    )}
                </div>

                {/* Stats */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-foreground">{boards.length}</p>
                            <p className="text-sm text-muted">Total Boards</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-foreground">
                                {boards.reduce((sum, b) => sum + b.columns.reduce((s, c) => s + c.tasks.length, 0), 0)}
                            </p>
                            <p className="text-sm text-muted">Active Tasks</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 text-center">
                            <p className="text-3xl font-bold text-foreground">
                                {new Set(boards.flatMap(b => b.members.map(m => m.userId))).size}
                            </p>
                            <p className="text-sm text-muted">Collaborators</p>
                        </CardContent>
                    </Card>
                </div>

                {/* My Boards */}
                {myBoards.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-foreground mb-4">My Boards</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myBoards.map((board, i) => (
                                <div
                                    key={board.id}
                                    onClick={() => setSelectedBoard(board.id)}
                                    className="animate-fade-in"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    <BoardCard board={board} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Boards */}
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-4">All Boards</h2>
                    {boards.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Users className="w-12 h-12 text-muted mx-auto mb-4" />
                                <p className="text-lg font-medium text-foreground mb-2">No boards yet</p>
                                <p className="text-muted mb-4">Create one to start collaborating.</p>
                                {isAuthenticated && (
                                    <Button variant="collaboard" onClick={() => setCreateOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" /> Create your first board
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {boards.map((board, i) => (
                                <div
                                    key={board.id}
                                    onClick={() => setSelectedBoard(board.id)}
                                    className="animate-fade-in"
                                    style={{ animationDelay: `${i * 50}ms` }}
                                >
                                    <BoardCard board={board} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateBoardModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(board) => setSelectedBoard(board.id)}
            />
        </main>
    )
}
