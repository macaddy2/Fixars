import { supabase, TABLES } from '@/lib/supabase'

// ── Fetch all boards for a user ──
export async function fetchBoards(userId) {
    // Fetch boards where user is creator or member
    const { data: memberRows } = await supabase
        .from(TABLES.BOARD_MEMBERS)
        .select('board_id')
        .eq('user_id', userId)

    const memberBoardIds = (memberRows || []).map(r => r.board_id)

    const { data: boards, error } = await supabase
        .from(TABLES.BOARDS)
        .select('*')
        .or(`creator_id.eq.${userId},id.in.(${memberBoardIds.join(',')})`)
        .order('created_at', { ascending: false })

    if (error) throw error
    if (!boards?.length) return []

    const boardIds = boards.map(b => b.id)

    // Fetch members, columns, and tasks in parallel
    const [membersRes, columnsRes, tasksRes] = await Promise.all([
        supabase.from(TABLES.BOARD_MEMBERS).select('*').in('board_id', boardIds),
        supabase.from(TABLES.BOARD_COLUMNS).select('*').in('board_id', boardIds).order('position'),
        supabase.from(TABLES.TASKS).select('*').in('board_id', boardIds).order('position')
    ])

    const members = membersRes.data || []
    const columns = columnsRes.data || []
    const tasks = tasksRes.data || []

    return boards.map(board => ({
        id: board.id,
        title: board.title,
        description: board.description,
        creatorId: board.creator_id,
        linkedIdeaId: board.linked_idea_id,
        createdAt: board.created_at,
        members: members
            .filter(m => m.board_id === board.id)
            .map(m => ({ userId: m.user_id, role: m.role, name: m.name })),
        columns: columns
            .filter(c => c.board_id === board.id)
            .map(col => ({
                id: col.id,
                title: col.title,
                tasks: tasks
                    .filter(t => t.column_id === col.id)
                    .map(t => ({
                        id: t.id,
                        title: t.title,
                        assigneeId: t.assignee_id,
                        dueDate: t.due_date,
                        labels: t.labels || [],
                        completedAt: t.completed_at
                    }))
            })),
        agreements: []
    }))
}

// ── Create a new board ──
export async function createBoardDB(board) {
    const { data, error } = await supabase
        .from(TABLES.BOARDS)
        .insert({
            title: board.title,
            description: board.description,
            creator_id: board.creatorId,
            linked_idea_id: board.linkedIdeaId || null
        })
        .select()
        .single()

    if (error) throw error

    // Add creator as owner member
    await supabase.from(TABLES.BOARD_MEMBERS).insert({
        board_id: data.id,
        user_id: board.creatorId,
        role: 'owner',
        name: board.members?.[0]?.name || 'Owner'
    })

    // Create default columns
    const defaultColumns = [
        { board_id: data.id, title: 'To Do', position: 0 },
        { board_id: data.id, title: 'In Progress', position: 1 },
        { board_id: data.id, title: 'Done', position: 2 }
    ]
    const { data: cols } = await supabase
        .from(TABLES.BOARD_COLUMNS)
        .insert(defaultColumns)
        .select()

    // Add additional members if provided
    if (board.members?.length > 1) {
        const additionalMembers = board.members.slice(1).map(m => ({
            board_id: data.id,
            user_id: m.userId,
            role: m.role || 'member',
            name: m.name
        }))
        await supabase.from(TABLES.BOARD_MEMBERS).insert(additionalMembers)
    }

    return {
        id: data.id,
        title: data.title,
        description: data.description,
        creatorId: data.creator_id,
        linkedIdeaId: data.linked_idea_id,
        createdAt: data.created_at,
        members: board.members || [{ userId: board.creatorId, role: 'owner', name: 'Owner' }],
        columns: (cols || []).map(c => ({ id: c.id, title: c.title, tasks: [] })),
        agreements: []
    }
}

// ── Add a task to a column ──
export async function addTaskDB(boardId, columnId, task) {
    const { data, error } = await supabase
        .from(TABLES.TASKS)
        .insert({
            board_id: boardId,
            column_id: columnId,
            title: task.title,
            assignee_id: task.assigneeId || null,
            due_date: task.dueDate || null,
            labels: task.labels || []
        })
        .select()
        .single()

    if (error) throw error

    return {
        id: data.id,
        title: data.title,
        assigneeId: data.assignee_id,
        dueDate: data.due_date,
        labels: data.labels || [],
        completedAt: data.completed_at
    }
}

// ── Move task between columns ──
export async function moveTaskDB(taskId, toColumnId, isComplete = false) {
    const updates = {
        column_id: toColumnId,
        completed_at: isComplete ? new Date().toISOString() : null
    }

    const { error } = await supabase
        .from(TABLES.TASKS)
        .update(updates)
        .eq('id', taskId)

    if (error) throw error
}

// ── Add a member to a board ──
export async function addBoardMemberDB(boardId, userId, name, role = 'member') {
    const { error } = await supabase
        .from(TABLES.BOARD_MEMBERS)
        .insert({
            board_id: boardId,
            user_id: userId,
            role,
            name
        })

    if (error) throw error
}
