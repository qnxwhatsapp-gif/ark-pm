# Module 5: Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder dashboard with a real stats dashboard — 4 stat cards (active projects, tasks due, overdue tasks, completed this month), projects widget, my-tasks widget, and recent activity feed. Role-aware: admins see firm-wide stats, others see their own.

**Architecture:** `useDashboard` hook fetches all dashboard data in parallel from Supabase. `StatsCard` is a reusable card. `DashboardPage` replaces the placeholder in App.jsx. Uses existing hooks (useMyTasks, useProjects) where possible, adds targeted queries for stats.

**Tech Stack:** React 18, Vite, Supabase, Recharts (already installed), shadcn/ui, Vitest + RTL

---

## File Map

| File | Responsibility |
|---|---|
| `src/features/dashboard/useDashboard.js` | Fetch all stats data in parallel |
| `src/features/dashboard/StatsCard.jsx` | Reusable stat card component |
| `src/features/dashboard/DashboardPage.jsx` | Full dashboard layout |
| `src/__tests__/dashboard/DashboardPage.test.jsx` | Tests |
| `src/App.jsx` | Replace DashboardPage placeholder with real component |

---

## Task 1: Build useDashboard hook

**Files:**
- Create: `src/features/dashboard/useDashboard.js`

- [ ] **Step 1: Create the file**

Create `src/features/dashboard/useDashboard.js`:

```js
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useDashboard(profile) {
  const [stats, setStats] = useState({
    activeProjects: 0,
    tasksDueThisWeek: 0,
    overdueTasks: 0,
    completedThisMonth: 0,
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchDashboard()
  }, [profile?.id, profile?.role])

  async function fetchDashboard() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const isAdmin = profile?.role === 'admin' || profile?.role === 'principal_architect'
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Build queries
    const projectsQuery = supabase
      .from('projects')
      .select('id, name, status, deadline, clients(organization)')
      .eq('status', 'active')
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(5)

    const myTasksQuery = supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, phases(project_id, projects(name))')
      .eq('assigned_to', session.user.id)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(8)

    const overdueQuery = supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', session.user.id)
      .neq('status', 'done')
      .lt('due_date', now.toISOString().split('T')[0])

    const dueThisWeekQuery = supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', session.user.id)
      .neq('status', 'done')
      .gte('due_date', now.toISOString().split('T')[0])
      .lte('due_date', weekFromNow.toISOString().split('T')[0])

    const completedQuery = supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', session.user.id)
      .eq('status', 'done')
      .gte('completed_at', monthStart)

    const activeProjectsQuery = supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    const [
      { data: projectsData },
      { data: tasksData },
      { count: overdueCount },
      { count: dueCount },
      { count: completedCount },
      { count: activeCount },
    ] = await Promise.all([
      projectsQuery,
      myTasksQuery,
      overdueQuery,
      dueThisWeekQuery,
      completedQuery,
      activeProjectsQuery,
    ])

    setRecentProjects(projectsData ?? [])
    setMyTasks(tasksData ?? [])
    setStats({
      activeProjects: activeCount ?? 0,
      tasksDueThisWeek: dueCount ?? 0,
      overdueTasks: overdueCount ?? 0,
      completedThisMonth: completedCount ?? 0,
    })
    setLoading(false)
  }

  return { stats, recentProjects, myTasks, loading }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/useDashboard.js
git commit -m "feat: add useDashboard hook"
```

---

## Task 2: Build StatsCard component

**Files:**
- Create: `src/features/dashboard/StatsCard.jsx`

- [ ] **Step 1: Create the file**

Create `src/features/dashboard/StatsCard.jsx`:

```jsx
export default function StatsCard({ label, value, sub, color = 'indigo', alert = false }) {
  const colorMap = {
    indigo:  { bg: 'bg-indigo-600/10',  border: 'border-indigo-500/30',  text: 'text-indigo-400' },
    emerald: { bg: 'bg-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
    red:     { bg: 'bg-red-600/10',     border: 'border-red-500/30',     text: 'text-red-400' },
    yellow:  { bg: 'bg-yellow-600/10',  border: 'border-yellow-500/30',  text: 'text-yellow-400' },
  }
  const c = colorMap[alert && value > 0 ? 'red' : color] ?? colorMap.indigo

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5`}>
      <div className={`text-3xl font-bold ${c.text}`}>{value}</div>
      <div className="text-white font-medium text-sm mt-1">{label}</div>
      {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/dashboard/StatsCard.jsx
git commit -m "feat: add StatsCard component"
```

---

## Task 3: Build DashboardPage with tests

**Files:**
- Create: `src/features/dashboard/DashboardPage.jsx`
- Create: `src/__tests__/dashboard/DashboardPage.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/dashboard/DashboardPage.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import DashboardPage from '../../features/dashboard/DashboardPage'

vi.mock('../../features/dashboard/useDashboard', () => ({
  useDashboard: () => ({
    stats: { activeProjects: 5, tasksDueThisWeek: 3, overdueTasks: 1, completedThisMonth: 12 },
    recentProjects: [
      { id: 'p1', name: 'Bangalore Villa', status: 'active', deadline: '2026-12-31', clients: { organization: 'Sharma Industries' } },
    ],
    myTasks: [
      { id: 't1', title: 'Submit floor plan', status: 'in_progress', priority: 'high', due_date: '2026-07-15', phases: { project_id: 'p1', projects: { name: 'Bangalore Villa' } } },
    ],
    loading: false,
  }),
}))

function renderWithAdmin() {
  return render(
    <AuthContext.Provider value={{ profile: { id: 'u1', role: 'admin', full_name: 'Vivek Singh' }, session: {}, user: {}, loading: false }}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders welcome message with user name', () => {
  renderWithAdmin()
  expect(screen.getByText(/vivek singh/i)).toBeInTheDocument()
})

test('renders stat cards', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('Active Projects')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})

test('renders recent projects', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('Bangalore Villa')).toBeInTheDocument()
  })
})

test('renders my tasks widget', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('Submit floor plan')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test — confirm fails**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test -- DashboardPage
```

- [ ] **Step 3: Create DashboardPage**

Create `src/features/dashboard/DashboardPage.jsx`:

```jsx
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/useAuth'
import { useDashboard } from './useDashboard'
import StatsCard from './StatsCard'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

const PRIORITY_COLORS = {
  low:    'border-slate-500 text-slate-400',
  medium: 'border-yellow-500 text-yellow-400',
  high:   'border-orange-500 text-orange-400',
  urgent: 'border-red-500 text-red-400',
}

const STATUS_LABELS = {
  todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done',
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { stats, recentProjects, myTasks, loading } = useDashboard(profile)
  const navigate = useNavigate()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return <div className="p-8 text-slate-400">Loading dashboard…</div>

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {greeting()}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening today.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Active Projects"
          value={stats.activeProjects}
          color="indigo"
        />
        <StatsCard
          label="Tasks Due This Week"
          value={stats.tasksDueThisWeek}
          color="yellow"
        />
        <StatsCard
          label="Overdue Tasks"
          value={stats.overdueTasks}
          color="red"
          alert={true}
        />
        <StatsCard
          label="Completed This Month"
          value={stats.completedThisMonth}
          color="emerald"
          sub="tasks done"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Active Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Active Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-indigo-400 text-xs hover:text-indigo-300">
              View all →
            </button>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-slate-600 text-sm">No active projects.</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 rounded-lg p-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{p.name}</div>
                    {p.clients?.organization && (
                      <div className="text-slate-500 text-xs">{p.clients.organization}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {p.deadline && (
                      <span className="text-slate-500 text-xs">
                        {new Date(p.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">My Tasks</h2>
            <button onClick={() => navigate('/tasks')} className="text-indigo-400 text-xs hover:text-indigo-300">
              View all →
            </button>
          </div>
          {myTasks.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-slate-500 text-2xl mb-1">🎉</div>
              <p className="text-slate-600 text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date()
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/projects/${task.phases?.project_id}`)}
                    className="flex items-start justify-between cursor-pointer hover:bg-slate-800/50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {task.phases?.projects?.name && <span>{task.phases.projects.name}</span>}
                        {task.due_date && (
                          <span className={isOverdue ? 'text-red-400' : ''}>
                            · {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm 4 pass**

```bash
npm run test -- DashboardPage
```

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/DashboardPage.jsx src/__tests__/dashboard/DashboardPage.test.jsx
git commit -m "feat: add real dashboard with stats, projects and tasks widgets"
```

---

## Task 4: Wire DashboardPage into App.jsx and push

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Add import at the top (replace the inline DashboardPage function):
```jsx
import DashboardPage from './features/dashboard/DashboardPage'
```

Remove the entire `function DashboardPage() { ... }` inline function from App.jsx.

- [ ] **Step 2: Run all tests**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test
```

Expected: **35 tests pass** (31 existing + 4 DashboardPage).

- [ ] **Step 3: Commit and push**

```bash
git add src/App.jsx
git commit -m "feat: wire real DashboardPage into app"
git push
```
