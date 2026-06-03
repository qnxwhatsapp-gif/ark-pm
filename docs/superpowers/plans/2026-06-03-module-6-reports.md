# Module 6: Reports & PDF Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Reports page with filters (project, date range, status), summary stats, task completion chart (Recharts), and a PDF export button using jsPDF + html2canvas.

**Architecture:** `useReports` hook fetches aggregated data. `ReportsPage` has filter controls, a Recharts bar chart for project progress, a summary table, and an Export PDF button. PDF is generated client-side: html2canvas captures the report div, jsPDF converts it to downloadable PDF. Access: Admin + Principal Architect only.

**Tech Stack:** React 18, Vite, Supabase, Recharts (installed), jsPDF (installed), html2canvas (installed), shadcn/ui, Vitest + RTL

---

## File Map

| File | Responsibility |
|---|---|
| `src/features/reports/useReports.js` | Fetch project + task data for reports |
| `src/features/reports/ReportsPage.jsx` | Filters, charts, summary table, PDF export |
| `src/__tests__/reports/ReportsPage.test.jsx` | Tests |
| `src/App.jsx` | Add /reports route + sidebar nav item |

---

## Task 1: Build useReports hook

**Files:**
- Create: `src/features/reports/useReports.js`

- [ ] **Step 1: Create the file**

Create `src/features/reports/useReports.js`:

```js
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useReports(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [filters.projectId, filters.status, filters.dateFrom, filters.dateTo])

  async function fetchReports() {
    setLoading(true)

    let query = supabase
      .from('projects')
      .select(`
        id, name, status, start_date, deadline,
        clients(name, organization),
        phases(
          id, name, status,
          tasks(id, status, priority, assigned_to, due_date, completed_at)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters.projectId) query = query.eq('id', filters.projectId)
    if (filters.status) query = query.eq('status', filters.status)

    const { data: projects } = await query

    const enriched = (projects ?? []).map(project => {
      const allTasks = project.phases?.flatMap(ph => ph.tasks ?? []) ?? []
      const totalTasks = allTasks.length
      const doneTasks = allTasks.filter(t => t.status === 'done').length
      const overdueTasks = allTasks.filter(t =>
        t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()
      ).length
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

      return {
        ...project,
        totalTasks,
        doneTasks,
        overdueTasks,
        progress,
        phaseCount: project.phases?.length ?? 0,
        completedPhases: project.phases?.filter(ph => ph.status === 'completed').length ?? 0,
      }
    })

    setData(enriched)
    setLoading(false)
  }

  return { data, loading }
}

export function useAllProjects() {
  const [projects, setProjects] = useState([])
  useEffect(() => {
    supabase.from('projects').select('id, name').order('name').then(({ data }) => setProjects(data ?? []))
  }, [])
  return projects
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/reports/useReports.js
git commit -m "feat: add useReports hook"
```

---

## Task 2: Build ReportsPage with tests

**Files:**
- Create: `src/features/reports/ReportsPage.jsx`
- Create: `src/__tests__/reports/ReportsPage.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/reports/ReportsPage.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import ReportsPage from '../../features/reports/ReportsPage'

const mockData = [
  {
    id: 'p1', name: 'Bangalore Villa', status: 'active',
    start_date: '2026-01-01', deadline: '2026-12-31',
    clients: { organization: 'Sharma Industries' },
    totalTasks: 10, doneTasks: 6, overdueTasks: 1, progress: 60,
    phaseCount: 3, completedPhases: 1,
  },
  {
    id: 'p2', name: 'Delhi Office', status: 'planning',
    start_date: '2026-03-01', deadline: '2027-06-30',
    clients: { organization: 'Patel Constructions' },
    totalTasks: 5, doneTasks: 0, overdueTasks: 0, progress: 0,
    phaseCount: 2, completedPhases: 0,
  },
]

vi.mock('../../features/reports/useReports', () => ({
  useReports: () => ({ data: mockData, loading: false }),
  useAllProjects: () => [],
}))

function renderWithAdmin() {
  return render(
    <AuthContext.Provider value={{ profile: { role: 'admin' }, session: {}, user: {}, loading: false }}>
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders Reports heading', () => {
  renderWithAdmin()
  expect(screen.getByText(/reports/i)).toBeInTheDocument()
})

test('renders project rows in summary table', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('Bangalore Villa')).toBeInTheDocument()
    expect(screen.getByText('Delhi Office')).toBeInTheDocument()
  })
})

test('shows progress percentages', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})

test('renders Export PDF button', () => {
  renderWithAdmin()
  expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test — confirm fails**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test -- ReportsPage
```

- [ ] **Step 3: Create ReportsPage**

Create `src/features/reports/ReportsPage.jsx`:

```jsx
import { useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useReports, useAllProjects } from './useReports'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
]

export default function ReportsPage() {
  const reportRef = useRef(null)
  const [filters, setFilters] = useState({ projectId: '', status: '' })
  const { data, loading } = useReports(filters)
  const allProjects = useAllProjects()
  const [exporting, setExporting] = useState(false)

  function updateFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value === 'all' ? '' : value }))
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const element = reportRef.current
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#0f172a' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`ark-design-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
    setExporting(false)
  }

  const totalTasks = data.reduce((s, p) => s + p.totalTasks, 0)
  const totalDone = data.reduce((s, p) => s + p.doneTasks, 0)
  const totalOverdue = data.reduce((s, p) => s + p.overdueTasks, 0)

  const chartData = data.slice(0, 8).map(p => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    progress: p.progress,
    done: p.doneTasks,
    total: p.totalTasks,
  }))

  if (loading) return <div className="p-8 text-slate-400">Loading reports…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">{data.length} project{data.length !== 1 ? 's' : ''}</p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={exporting}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {exporting ? 'Exporting…' : '⬇ Export PDF'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={filters.status || 'all'} onValueChange={v => updateFilter('status', v)}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s.value || 'all'} value={s.value || 'all'} className="text-white">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.projectId || 'all'} onValueChange={v => updateFilter('projectId', v)}>
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-52">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">All projects</SelectItem>
            {allProjects.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Report content (captured for PDF) */}
      <div ref={reportRef}>
        {/* Summary stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-indigo-400">{data.length}</div>
            <div className="text-white text-sm mt-1">Projects</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{totalDone}</div>
            <div className="text-white text-sm mt-1">Tasks Completed</div>
            <div className="text-slate-500 text-xs">{totalTasks} total</div>
          </div>
          <div className={`border rounded-xl p-4 text-center ${totalOverdue > 0 ? 'bg-red-900/20 border-red-800' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`text-3xl font-bold ${totalOverdue > 0 ? 'text-red-400' : 'text-white'}`}>{totalOverdue}</div>
            <div className="text-white text-sm mt-1">Overdue Tasks</div>
          </div>
        </div>

        {/* Progress chart */}
        {chartData.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
            <h2 className="text-white font-semibold mb-4">Project Progress (%)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(val, name) => [`${val}%`, 'Progress']}
                />
                <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.progress >= 75 ? '#10b981' : entry.progress >= 40 ? '#6366f1' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Project</th>
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Client</th>
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Status</th>
                <th className="text-center px-4 py-3 text-slate-400 text-sm font-medium">Progress</th>
                <th className="text-center px-4 py-3 text-slate-400 text-sm font-medium">Tasks</th>
                <th className="text-center px-4 py-3 text-slate-400 text-sm font-medium">Phases</th>
                <th className="text-center px-4 py-3 text-slate-400 text-sm font-medium">Overdue</th>
                <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-sm">No projects match the selected filters.</td>
                </tr>
              ) : data.map(project => (
                <tr key={project.id} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-3 text-white font-medium text-sm">{project.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{project.clients?.organization ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[project.status]}`}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span className="text-slate-300 text-xs w-8">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-300 text-sm">
                    {project.doneTasks}/{project.totalTasks}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-300 text-sm">
                    {project.completedPhases}/{project.phaseCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {project.overdueTasks > 0 ? (
                      <span className="text-red-400 text-sm font-medium">{project.overdueTasks}</span>
                    ) : (
                      <span className="text-slate-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm 4 pass**

```bash
npm run test -- ReportsPage
```

- [ ] **Step 5: Commit**

```bash
git add src/features/reports/ReportsPage.jsx src/__tests__/reports/ReportsPage.test.jsx
git commit -m "feat: add reports page with charts and PDF export"
```

---

## Task 3: Wire /reports route and push

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Add import:
```jsx
import ReportsPage from './features/reports/ReportsPage'
```

Add nav item in `navItems` after Projects:
```js
{ to: '/reports', label: '📊 Reports', roles: ['admin', 'principal_architect'] },
```

Add route after `/projects/:id`:
```jsx
<Route path="/reports" element={<ProtectedWithSidebar><ReportsPage /></ProtectedWithSidebar>} />
```

- [ ] **Step 2: Run all tests**

```bash
npm run test
```

Expected: **39 tests pass**.

- [ ] **Step 3: Commit and push**

```bash
git add src/App.jsx
git commit -m "feat: add reports route and sidebar nav"
git push
```
