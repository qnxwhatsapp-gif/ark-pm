# Module 4: Tasks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Tasks module — tasks inside project phases (create, edit, assign, update status, priority), comments on tasks, and a personal "My Tasks" page showing all tasks assigned to the logged-in user.

**Architecture:** `usePhaseTasks` hook manages tasks for a single phase. `useMyTasks` hook fetches tasks assigned to the current user. `TaskFormDialog` handles create/edit. `TaskCard` renders each task inline inside the phase. `CommentsPanel` handles task-level discussion. ProjectDetailPage phases tab is updated to show tasks inside each phase. New `/tasks` route shows the My Tasks page.

**Tech Stack:** React 18, Vite, Supabase, React Router v6, shadcn/ui, Vitest + RTL

---

## File Map

| File | Responsibility |
|---|---|
| `src/features/tasks/useTasks.js` | usePhaseTasks(phaseId) + useMyTasks() hooks |
| `src/features/tasks/TaskFormDialog.jsx` | Create/edit task modal |
| `src/features/tasks/TaskCard.jsx` | Single task row — inline status update, priority badge |
| `src/features/tasks/CommentsPanel.jsx` | Comments list + add comment for a task |
| `src/features/tasks/MyTasksPage.jsx` | Personal tasks page at /tasks |
| `src/features/projects/PhaseWithTasks.jsx` | Phase row that expands to show tasks |
| `src/__tests__/tasks/MyTasksPage.test.jsx` | Tests for MyTasksPage |
| `src/__tests__/tasks/TaskFormDialog.test.jsx` | Tests for TaskFormDialog |
| `src/App.jsx` | Add /tasks route + My Tasks sidebar nav item |
| `src/features/projects/ProjectDetailPage.jsx` | Replace plain phase list with PhaseWithTasks |

---

## Task 1: Build useTasks hooks

**Files:**
- Create: `src/features/tasks/useTasks.js`

- [ ] **Step 1: Create the file**

Create `src/features/tasks/useTasks.js`:

```js
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function usePhaseTasks(phaseId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!phaseId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, users!tasks_assigned_to_fkey(id, full_name)')
      .eq('phase_id', phaseId)
      .order('created_at')
    setTasks(data ?? [])
    setLoading(false)
  }, [phaseId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createTask(fields) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }
    const { error } = await supabase.from('tasks').insert({
      ...fields,
      phase_id: phaseId,
      created_by: session.user.id,
      due_date: fields.due_date || null,
      assigned_to: fields.assigned_to || null,
    })
    if (!error) await fetchTasks()
    return { error }
  }

  async function updateTask(taskId, fields) {
    const payload = { ...fields }
    if ('due_date' in payload) payload.due_date = payload.due_date || null
    if ('assigned_to' in payload) payload.assigned_to = payload.assigned_to || null
    if (fields.status === 'done') payload.completed_at = new Date().toISOString()
    else if ('status' in fields) payload.completed_at = null
    const { error } = await supabase.from('tasks').update(payload).eq('id', taskId)
    if (!error) await fetchTasks()
    return { error }
  }

  async function deleteTask(taskId) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) await fetchTasks()
    return { error }
  }

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: fetchTasks }
}

export function useMyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMyTasks() }, [])

  async function fetchMyTasks() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, phases(id, name, project_id, projects(id, name))')
      .eq('assigned_to', session.user.id)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  return { tasks, loading, refetch: fetchMyTasks }
}

export function useTaskComments(taskId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) return
    fetchComments()
  }, [taskId])

  async function fetchComments() {
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .select('*, users(id, full_name)')
      .eq('task_id', taskId)
      .order('created_at')
    setComments(data ?? [])
    setLoading(false)
  }

  async function addComment(body) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }
    const { error } = await supabase.from('comments').insert({
      task_id: taskId,
      user_id: session.user.id,
      body,
    })
    if (!error) await fetchComments()
    return { error }
  }

  return { comments, loading, addComment }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/tasks/useTasks.js
git commit -m "feat: add usePhaseTasks, useMyTasks, useTaskComments hooks"
```

---

## Task 2: Build TaskFormDialog with tests

**Files:**
- Create: `src/features/tasks/TaskFormDialog.jsx`
- Create: `src/__tests__/tasks/TaskFormDialog.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/tasks/TaskFormDialog.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthContext } from '../../features/auth/AuthContext'
import TaskFormDialog from '../../features/tasks/TaskFormDialog'

const mockUsers = [
  { id: 'u1', full_name: 'Priya Sharma', role: 'principal_architect' },
  { id: 'u2', full_name: 'Rahul Kumar', role: 'architect' },
]

function renderDialog(props = {}) {
  return render(
    <AuthContext.Provider value={{ profile: { id: 'u1', role: 'admin' }, session: {}, user: {}, loading: false }}>
      <TaskFormDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue({ error: null })}
        users={mockUsers}
        {...props}
      />
    </AuthContext.Provider>
  )
}

test('renders task title field', () => {
  renderDialog()
  expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
})

test('renders priority and status selects', () => {
  renderDialog()
  expect(screen.getByText(/priority/i)).toBeInTheDocument()
  expect(screen.getByText(/status/i)).toBeInTheDocument()
})

test('calls onSubmit with form data', async () => {
  const onSubmit = vi.fn().mockResolvedValue({ error: null })
  renderDialog({ onSubmit })
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Submit floor plan' } })
  fireEvent.click(screen.getByRole('button', { name: /create task/i }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalled())
})

test('shows error message on submit failure', async () => {
  const onSubmit = vi.fn().mockResolvedValue({ error: { message: 'Failed to create' } })
  renderDialog({ onSubmit })
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test task' } })
  fireEvent.click(screen.getByRole('button', { name: /create task/i }))
  await waitFor(() => expect(screen.getByText(/failed to create/i)).toBeInTheDocument())
})
```

- [ ] **Step 2: Run test — confirm fails**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test -- TaskFormDialog
```

- [ ] **Step 3: Create TaskFormDialog**

Create `src/features/tasks/TaskFormDialog.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EMPTY = { title: '', description: '', assigned_to: '', priority: 'medium', status: 'todo', due_date: '' }

const PRIORITIES = [
  { value: 'low',    label: '🟢 Low' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'high',   label: '🟠 High' },
  { value: 'urgent', label: '🔴 Urgent' },
]

const STATUSES = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review',      label: 'Review' },
  { value: 'done',        label: 'Done' },
]

export default function TaskFormDialog({ open, onOpenChange, onSubmit, initial, users = [] }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial, assigned_to: initial.assigned_to ?? '', due_date: initial.due_date ?? '' } : EMPTY)
    setError('')
  }, [initial, open])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await onSubmit(form)
    setSubmitting(false)
    if (error) {
      setError(typeof error === 'string' ? error : error.message ?? 'Something went wrong')
      return
    }
    onOpenChange(false)
  }

  const isEdit = Boolean(initial?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label htmlFor="task-title" className="text-slate-300">Title *</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Submit structural drawings"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Description</Label>
            <Input
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Optional details…"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Priority</Label>
              <Select value={form.priority} onValueChange={v => update('priority', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value} className="text-white">{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Assign To</Label>
              <Select value={form.assigned_to} onValueChange={v => update('assigned_to', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {users.map(u => <SelectItem key={u.id} value={u.id} className="text-white">{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Task')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Run tests — confirm 4 pass**

```bash
npm run test -- TaskFormDialog
```

- [ ] **Step 5: Commit**

```bash
git add src/features/tasks/TaskFormDialog.jsx src/__tests__/tasks/TaskFormDialog.test.jsx
git commit -m "feat: add TaskFormDialog with priority, status, assignee, due date"
```

---

## Task 3: Build TaskCard and CommentsPanel

**Files:**
- Create: `src/features/tasks/TaskCard.jsx`
- Create: `src/features/tasks/CommentsPanel.jsx`

- [ ] **Step 1: Create TaskCard**

Create `src/features/tasks/TaskCard.jsx`:

```jsx
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CommentsPanel from './CommentsPanel'

const PRIORITY_COLORS = {
  low:    'border-slate-500 text-slate-400',
  medium: 'border-yellow-500 text-yellow-400',
  high:   'border-orange-500 text-orange-400',
  urgent: 'border-red-500 text-red-400',
}

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review',      label: 'Review' },
  { value: 'done',        label: 'Done' },
]

export default function TaskCard({ task, onUpdate, onEdit, onDelete }) {
  const [showComments, setShowComments] = useState(false)

  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  return (
    <div className={`bg-slate-800/50 rounded-lg border p-3 ${task.status === 'done' ? 'border-slate-700 opacity-60' : 'border-slate-700'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
              {task.title}
            </span>
            <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium}`}>
              {task.priority}
            </Badge>
          </div>
          {task.description && <p className="text-slate-500 text-xs mt-0.5 truncate">{task.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
            {task.users?.full_name && <span>👤 {task.users.full_name}</span>}
            {task.due_date && (
              <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
                📅 {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
            <button
              onClick={() => setShowComments(s => !s)}
              className="hover:text-slate-300 transition-colors"
            >
              💬 Comments
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Select value={task.status} onValueChange={v => onUpdate(task.id, { status: v })}>
            <SelectTrigger className="h-7 text-xs bg-slate-700 border-slate-600 text-slate-300 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value} className="text-white text-xs">{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="h-7 text-xs border-slate-600 text-slate-400 hover:bg-slate-700 px-2">
            ✏
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(task.id)} className="h-7 text-xs border-slate-600 text-red-400 hover:bg-red-900/20 px-2">
            ✕
          </Button>
        </div>
      </div>
      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <CommentsPanel taskId={task.id} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create CommentsPanel**

Create `src/features/tasks/CommentsPanel.jsx`:

```jsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTaskComments } from './useTasks'
import { useAuth } from '@/features/auth/useAuth'

export default function CommentsPanel({ taskId }) {
  const { comments, loading, addComment } = useTaskComments(taskId)
  const { profile } = useAuth()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    await addComment(body.trim())
    setBody('')
    setSubmitting(false)
  }

  if (loading) return <div className="text-slate-500 text-xs">Loading comments…</div>

  return (
    <div className="space-y-2">
      {comments.length === 0 && <p className="text-slate-600 text-xs">No comments yet.</p>}
      {comments.map(c => (
        <div key={c.id} className="text-xs">
          <span className="text-indigo-400 font-medium">{c.users?.full_name ?? 'Unknown'}</span>
          <span className="text-slate-600 ml-1.5">
            {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
          <p className="text-slate-400 mt-0.5">{c.body}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <Input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="bg-slate-700 border-slate-600 text-white text-xs h-7 flex-1"
        />
        <Button type="submit" disabled={submitting || !body.trim()} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 px-3">
          Send
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/tasks/TaskCard.jsx src/features/tasks/CommentsPanel.jsx
git commit -m "feat: add TaskCard with inline status update and CommentsPanel"
```

---

## Task 4: Build PhaseWithTasks and update ProjectDetailPage

**Files:**
- Create: `src/features/projects/PhaseWithTasks.jsx`
- Modify: `src/features/projects/ProjectDetailPage.jsx`

- [ ] **Step 1: Create PhaseWithTasks**

Create `src/features/projects/PhaseWithTasks.jsx`:

```jsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePhaseTasks } from '@/features/tasks/useTasks'
import { useUsers } from '@/features/admin/useUsers'
import TaskCard from '@/features/tasks/TaskCard'
import TaskFormDialog from '@/features/tasks/TaskFormDialog'

const PHASE_STATUS_COLORS = {
  pending:   'bg-slate-700 text-slate-400',
  active:    'bg-emerald-900/40 text-emerald-400',
  completed: 'bg-blue-900/40 text-blue-400',
}

export default function PhaseWithTasks({ phase, idx, onEditPhase }) {
  const { tasks, loading, createTask, updateTask, deleteTask } = usePhaseTasks(phase.id)
  const { users } = useUsers()
  const [expanded, setExpanded] = useState(true)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  async function handleTaskSubmit(form) {
    if (editingTask) return updateTask(editingTask.id, form)
    return createTask(form)
  }

  function openEditTask(task) {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  function openAddTask() {
    setEditingTask(null)
    setTaskDialogOpen(true)
  }

  const doneCount = tasks.filter(t => t.status === 'done').length

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Phase header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium shrink-0">
            {idx + 1}
          </div>
          <div>
            <div className="text-white font-medium flex items-center gap-2">
              {phase.name}
              <span className="text-slate-500 text-xs font-normal">
                {doneCount}/{tasks.length} tasks
              </span>
            </div>
            {(phase.start_date || phase.end_date) && (
              <div className="text-slate-500 text-xs mt-0.5">
                {[phase.start_date, phase.end_date].filter(Boolean).map(d =>
                  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                ).join(' → ')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PHASE_STATUS_COLORS[phase.status] ?? PHASE_STATUS_COLORS.pending}`}>
            {phase.status}
          </span>
          <Button variant="outline" size="sm" onClick={() => onEditPhase(phase)} className="border-slate-700 text-slate-400 hover:bg-slate-800 text-xs h-7">
            Edit
          </Button>
          <Button size="sm" onClick={openAddTask} className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7">
            + Task
          </Button>
          <span className="text-slate-500 text-sm ml-1">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Tasks list */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {loading ? (
            <div className="text-slate-500 text-xs py-2">Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="text-slate-600 text-xs py-3 text-center border border-dashed border-slate-700 rounded-lg">
              No tasks yet. Click "+ Task" to add the first one.
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onEdit={openEditTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>
      )}

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={open => { setTaskDialogOpen(open); if (!open) setEditingTask(null) }}
        onSubmit={handleTaskSubmit}
        initial={editingTask}
        users={users}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update ProjectDetailPage phases tab**

Open `src/features/projects/ProjectDetailPage.jsx`.

Add import at the top (after existing imports):
```jsx
import PhaseWithTasks from './PhaseWithTasks'
```

Remove the import of `useUsers` (it's now used inside PhaseWithTasks, not in ProjectDetailPage directly):
```jsx
// Remove this line:
import { useUsers } from '@/features/admin/useUsers'
```

Remove the line that uses `useUsers`:
```jsx
// Remove this line inside the component:
const { users } = useUsers()
```

Remove the line that computes `nonMembers` — it used `users`:
```jsx
// Remove this line:
const nonMembers = users.filter(u => !members.some(m => m.user_id === u.id))
```

In the Team tab, add a `useUsers` call back (since we removed it from the component level). Actually, re-add the import and hook **only for the team tab**. Replace the approach: keep `useUsers` import, but only use it in the team tab section.

**Simplest fix** — keep `useUsers` import and hook call in `ProjectDetailPage`, but also pass `users` into the team tab for the member dropdown. The PhaseWithTasks component also has its own `useUsers` call internally.

So the final state should be:
- Keep `import { useUsers } from '@/features/admin/useUsers'` 
- Keep `const { users } = useUsers()` in the component
- Keep `const nonMembers = users.filter(...)`
- **Replace the phases tab content**: instead of rendering the old plain phase cards, render `<PhaseWithTasks>` for each phase
- The old Edit phase button logic moves into `PhaseWithTasks` via the `onEditPhase` prop

**Replace only the phases tab JSX block** — find this section:
```jsx
{activeTab === 'phases' && (
  <div>
    <div className="flex justify-end mb-4">
      <Button onClick={openAddPhase} className="bg-indigo-600 hover:bg-indigo-700 text-sm">
        + Add Phase
      </Button>
    </div>
    {phases.length === 0 ? (
```

Replace the entire `{activeTab === 'phases' && (...)}` block with:

```jsx
{activeTab === 'phases' && (
  <div>
    <div className="flex justify-end mb-4">
      <Button onClick={openAddPhase} className="bg-indigo-600 hover:bg-indigo-700 text-sm">
        + Add Phase
      </Button>
    </div>
    {phases.length === 0 ? (
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center text-slate-500 text-sm">
        No phases yet. Click "+ Add Phase" to define project phases.
      </div>
    ) : (
      <div className="space-y-3">
        {phases.map((phase, idx) => (
          <PhaseWithTasks
            key={phase.id}
            phase={phase}
            idx={idx}
            onEditPhase={phase => { setEditingPhase(phase); setPhaseDialogOpen(true) }}
          />
        ))}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Run all existing tests to verify nothing broke**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test
```

Expected: all 28 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/features/projects/PhaseWithTasks.jsx src/features/projects/ProjectDetailPage.jsx
git commit -m "feat: phases now expand to show tasks inline with add/edit/status/comments"
```

---

## Task 5: Build MyTasksPage with tests

**Files:**
- Create: `src/features/tasks/MyTasksPage.jsx`
- Create: `src/__tests__/tasks/MyTasksPage.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/tasks/MyTasksPage.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import MyTasksPage from '../../features/tasks/MyTasksPage'

const mockTasks = [
  {
    id: 't1', title: 'Submit floor plan', status: 'in_progress', priority: 'high',
    due_date: '2026-07-15', description: 'Final floor plan submission',
    phases: { id: 'ph1', name: 'Design Development', project_id: 'p1', projects: { id: 'p1', name: 'Bangalore Villa' } },
  },
  {
    id: 't2', title: 'Review structure', status: 'todo', priority: 'medium',
    due_date: null, description: null,
    phases: { id: 'ph2', name: 'Schematic Design', project_id: 'p2', projects: { id: 'p2', name: 'Delhi Office' } },
  },
]

vi.mock('../../features/tasks/useTasks', () => ({
  useMyTasks: () => ({
    tasks: mockTasks,
    loading: false,
    refetch: vi.fn(),
  }),
}))

function renderWithUser() {
  return render(
    <AuthContext.Provider value={{ profile: { id: 'u1', role: 'architect', full_name: 'Rahul Kumar' }, session: {}, user: {}, loading: false }}>
      <MemoryRouter>
        <MyTasksPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders my tasks heading', () => {
  renderWithUser()
  expect(screen.getByText(/my tasks/i)).toBeInTheDocument()
})

test('renders assigned tasks', async () => {
  renderWithUser()
  await waitFor(() => {
    expect(screen.getByText('Submit floor plan')).toBeInTheDocument()
    expect(screen.getByText('Review structure')).toBeInTheDocument()
  })
})

test('shows project name for each task', async () => {
  renderWithUser()
  await waitFor(() => {
    expect(screen.getByText('Bangalore Villa')).toBeInTheDocument()
    expect(screen.getByText('Delhi Office')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — confirm fails**

```bash
npm run test -- MyTasksPage
```

- [ ] **Step 3: Create MyTasksPage**

Create `src/features/tasks/MyTasksPage.jsx`:

```jsx
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useMyTasks } from './useTasks'
import { useAuth } from '@/features/auth/useAuth'

const PRIORITY_COLORS = {
  low:    'border-slate-500 text-slate-400',
  medium: 'border-yellow-500 text-yellow-400',
  high:   'border-orange-500 text-orange-400',
  urgent: 'border-red-500 text-red-400',
}

const STATUS_LABELS = {
  todo:        'To Do',
  in_progress: 'In Progress',
  review:      'Review',
  done:        'Done',
}

const STATUS_COLORS = {
  todo:        'bg-slate-700 text-slate-400',
  in_progress: 'bg-indigo-900/40 text-indigo-400',
  review:      'bg-yellow-900/40 text-yellow-400',
  done:        'bg-emerald-900/40 text-emerald-400',
}

export default function MyTasksPage() {
  const { tasks, loading } = useMyTasks()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date())
  const dueSoon = tasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    const now = new Date()
    return d >= now && d <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  })

  if (loading) return <div className="p-8 text-slate-400">Loading tasks…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-slate-400 text-sm mt-1">
          {profile?.full_name} · {tasks.length} open task{tasks.length !== 1 ? 's' : ''}
          {overdue.length > 0 && <span className="text-red-400 ml-2">· {overdue.length} overdue</span>}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{tasks.length}</div>
          <div className="text-slate-400 text-xs mt-1">Open Tasks</div>
        </div>
        <div className={`border rounded-lg p-4 text-center ${overdue.length > 0 ? 'bg-red-900/20 border-red-800' : 'bg-slate-900 border-slate-800'}`}>
          <div className={`text-2xl font-bold ${overdue.length > 0 ? 'text-red-400' : 'text-white'}`}>{overdue.length}</div>
          <div className="text-slate-400 text-xs mt-1">Overdue</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{dueSoon.length}</div>
          <div className="text-slate-400 text-xs mt-1">Due This Week</div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <div className="text-slate-500 text-lg mb-2">🎉 All caught up!</div>
          <div className="text-slate-600 text-sm">No open tasks assigned to you.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date()
            return (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => navigate(`/projects/${task.phases?.project_id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium text-sm">{task.title}</span>
                      <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {task.phases?.projects?.name && (
                        <span className="text-indigo-400">📁 {task.phases.projects.name}</span>
                      )}
                      {task.phases?.name && <span>🔷 {task.phases.name}</span>}
                      {task.due_date && (
                        <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
                          📅 {isOverdue ? '⚠ Overdue · ' : ''}{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm 3 pass**

```bash
npm run test -- MyTasksPage
```

- [ ] **Step 5: Commit**

```bash
git add src/features/tasks/MyTasksPage.jsx src/__tests__/tasks/MyTasksPage.test.jsx
git commit -m "feat: add My Tasks page with overdue and due-this-week stats"
```

---

## Task 6: Wire /tasks route and sidebar, run all tests, push

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Add import after ProjectDetailPage import:
```jsx
import MyTasksPage from './features/tasks/MyTasksPage'
```

Add Tasks nav item in navItems (after Dashboard, before Projects):
```js
{ to: '/tasks', label: '✅ My Tasks', roles: ['admin', 'principal_architect', 'architect', 'staff_engineer'] },
```

Add route inside Routes after `/projects/:id`:
```jsx
<Route path="/tasks" element={<ProtectedWithSidebar><MyTasksPage /></ProtectedWithSidebar>} />
```

- [ ] **Step 2: Run all tests**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test
```

Expected: **31 tests pass** (24 existing + 4 TaskFormDialog + 3 MyTasksPage).

- [ ] **Step 3: Commit and push**

```bash
git add src/App.jsx
git commit -m "feat: add My Tasks route and sidebar nav"
git push
```
