# Module 3: Projects & Phases — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Projects module — list, create, edit projects; manage phases inside each project; assign team members; view project timeline.

**Architecture:** Same pattern as Modules 1–2. `useProjects` hook for list/CRUD, `useProject` for single project with phases and members. ProjectsPage lists all projects (RLS-filtered by role), ProjectDetailPage shows phases+tasks placeholder+team. PhaseFormDialog and ProjectFormDialog handle creation. Members managed inline on detail page.

**Tech Stack:** React 18, Vite, @supabase/supabase-js, React Router v6, shadcn/ui, Vitest + React Testing Library

---

## File Map

| File | Responsibility |
|---|---|
| `src/features/projects/useProjects.js` | useProjects() list hook + useProject(id) detail hook |
| `src/features/projects/ProjectFormDialog.jsx` | Create/edit project modal |
| `src/features/projects/ProjectsPage.jsx` | List all projects with filters |
| `src/features/projects/ProjectDetailPage.jsx` | Project detail: phases, team, progress |
| `src/features/projects/PhaseFormDialog.jsx` | Add/edit phase modal |
| `src/__tests__/projects/ProjectsPage.test.jsx` | Tests |
| `src/__tests__/projects/ProjectDetailPage.test.jsx` | Tests |
| `src/App.jsx` | Add /projects and /projects/:id routes + sidebar nav item |

---

## Task 1: Build useProjects and useProject hooks

**Files:**
- Create: `src/features/projects/useProjects.js`

- [ ] **Step 1: Create the file**

Create `src/features/projects/useProjects.js`:

```js
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*, clients(name, organization)')
      .order('created_at', { ascending: false })
    setProjects(data ?? [])
    setLoading(false)
  }

  async function createProject(fields) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }
    const { error } = await supabase.from('projects').insert({
      ...fields,
      created_by: session.user.id,
    })
    if (!error) await fetchProjects()
    return { error }
  }

  async function updateProject(id, fields) {
    const { error } = await supabase.from('projects').update(fields).eq('id', id)
    if (!error) await fetchProjects()
    return { error }
  }

  return { projects, loading, createProject, updateProject }
}

export function useProject(id) {
  const [project, setProject] = useState(null)
  const [phases, setPhases] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchProject()
  }, [id])

  async function fetchProject() {
    setLoading(true)
    const [{ data: projectData }, { data: phaseData }, { data: memberData }] = await Promise.all([
      supabase.from('projects').select('*, clients(name, organization)').eq('id', id).single(),
      supabase.from('phases').select('*').eq('project_id', id).order('order_index'),
      supabase.from('project_members').select('*, users(id, full_name, role)').eq('project_id', id),
    ])
    setProject(projectData ?? null)
    setPhases(phaseData ?? [])
    setMembers(memberData ?? [])
    setLoading(false)
  }

  async function addPhase(fields) {
    const nextIndex = phases.length
    const { error } = await supabase.from('phases').insert({
      ...fields,
      project_id: id,
      order_index: nextIndex,
    })
    if (!error) await fetchProject()
    return { error }
  }

  async function updatePhase(phaseId, fields) {
    const { error } = await supabase.from('phases').update(fields).eq('id', phaseId)
    if (!error) await fetchProject()
    return { error }
  }

  async function addMember(userId, roleInProject = 'member') {
    const { error } = await supabase.from('project_members').insert({
      project_id: id,
      user_id: userId,
      role_in_project: roleInProject,
    })
    if (!error) await fetchProject()
    return { error }
  }

  async function removeMember(userId) {
    const { error } = await supabase.from('project_members').delete()
      .eq('project_id', id).eq('user_id', userId)
    if (!error) await fetchProject()
    return { error }
  }

  return { project, phases, members, loading, fetchProject, addPhase, updatePhase, addMember, removeMember }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/projects/useProjects.js
git commit -m "feat: add useProjects and useProject hooks"
```

---

## Task 2: Build ProjectFormDialog

**Files:**
- Create: `src/features/projects/ProjectFormDialog.jsx`

- [ ] **Step 1: Create the file**

Create `src/features/projects/ProjectFormDialog.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EMPTY = {
  name: '', description: '', client_id: '', city: '', state: '', pin_code: '',
  status: 'planning', start_date: '', deadline: '',
}

const STATUSES = [
  { value: 'planning',  label: 'Planning' },
  { value: 'active',    label: 'Active' },
  { value: 'on_hold',   label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
]

export default function ProjectFormDialog({ open, onOpenChange, onSubmit, initial, clients = [] }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial, client_id: initial.client_id ?? '' } : EMPTY)
    setError('')
  }, [initial, open])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const payload = {
      ...form,
      client_id: form.client_id || null,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
    }
    const { error } = await onSubmit(payload)
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
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label className="text-slate-300">Project Name *</Label>
            <Input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Sharma Corporate HQ — Phase 2"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Description</Label>
            <Input
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Brief project description"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Client</Label>
              <Select value={form.client_id} onValueChange={v => update('client_id', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-white">
                      {c.organization}
                    </SelectItem>
                  ))}
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
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">City</Label>
              <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Bangalore" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">State</Label>
              <Input value={form.state} onChange={e => update('state', e.target.value)} placeholder="Karnataka" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">PIN</Label>
              <Input value={form.pin_code} onChange={e => update('pin_code', e.target.value)} placeholder="560001" className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Deadline</Label>
              <Input type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Project')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/projects/ProjectFormDialog.jsx
git commit -m "feat: add ProjectFormDialog"
```

---

## Task 3: Build ProjectsPage with tests

**Files:**
- Create: `src/features/projects/ProjectsPage.jsx`
- Create: `src/__tests__/projects/ProjectsPage.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/projects/ProjectsPage.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import ProjectsPage from '../../features/projects/ProjectsPage'

const mockProjects = [
  { id: 'p1', name: 'Bangalore Villa', status: 'active', deadline: '2026-12-31', city: 'Bangalore', state: 'Karnataka', description: 'Residential villa', clients: { organization: 'Sharma Industries' }, created_at: '2026-01-01' },
  { id: 'p2', name: 'Delhi Office', status: 'planning', deadline: '2027-03-31', city: 'Delhi', state: 'Delhi', description: 'Commercial office', clients: { organization: 'Patel Constructions' }, created_at: '2026-01-02' },
]

vi.mock('../../features/projects/useProjects', () => ({
  useProjects: () => ({
    projects: mockProjects,
    loading: false,
    createProject: vi.fn().mockResolvedValue({ error: null }),
    updateProject: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

vi.mock('../../features/clients/useClients', () => ({
  useClients: () => ({ clients: [], loading: false }),
}))

function renderWithAdmin() {
  return render(
    <AuthContext.Provider value={{ profile: { role: 'admin' }, session: {}, user: {}, loading: false }}>
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders project list', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('Bangalore Villa')).toBeInTheDocument()
    expect(screen.getByText('Delhi Office')).toBeInTheDocument()
  })
})

test('shows New Project button', () => {
  renderWithAdmin()
  expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
})

test('filters projects by status', async () => {
  renderWithAdmin()
  const activeFilter = screen.getByRole('button', { name: /active/i })
  await userEvent.click(activeFilter)
  expect(screen.getByText('Bangalore Villa')).toBeInTheDocument()
  expect(screen.queryByText('Delhi Office')).not.toBeInTheDocument()
})

test('opens dialog on New Project click', async () => {
  renderWithAdmin()
  await userEvent.click(screen.getByRole('button', { name: /new project/i }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test — confirm fails**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test -- ProjectsPage
```

Expected: FAIL.

- [ ] **Step 3: Create ProjectsPage**

Create `src/features/projects/ProjectsPage.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProjects } from './useProjects'
import { useClients } from '@/features/clients/useClients'
import ProjectFormDialog from './ProjectFormDialog'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

const STATUS_FILTERS = ['all', 'active', 'planning', 'on_hold', 'completed']

export default function ProjectsPage() {
  const { projects, loading, createProject, updateProject } = useProjects()
  const { clients } = useClients()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const navigate = useNavigate()

  const filtered = statusFilter === 'all'
    ? projects
    : projects.filter(p => p.status === statusFilter)

  function handleEdit(e, project) {
    e.stopPropagation()
    setEditing(project)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleSubmit(form) {
    if (editing) return updateProject(editing.id, form)
    return createProject(form)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading projects…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          + New Project
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center text-slate-500 text-sm">
            {statusFilter !== 'all' ? `No ${statusFilter.replace('_', ' ')} projects.` : 'No projects yet. Click "+ New Project" to create one.'}
          </div>
        ) : filtered.map(project => (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-slate-900 rounded-lg border border-slate-800 p-4 cursor-pointer hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-semibold truncate">{project.name}</h3>
                  <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_COLORS[project.status] ?? STATUS_COLORS.planning}`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {project.clients?.organization && <span>👥 {project.clients.organization}</span>}
                  {(project.city || project.state) && <span>📍 {[project.city, project.state].filter(Boolean).join(', ')}</span>}
                  {project.deadline && <span>⏰ Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                </div>
                {project.description && <p className="text-slate-500 text-xs mt-1.5 truncate">{project.description}</p>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={e => handleEdit(e, project)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs ml-4 shrink-0"
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={open => { setDialogOpen(open); if (!open) setEditing(null) }}
        onSubmit={handleSubmit}
        initial={editing}
        clients={clients}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm 4 pass**

```bash
npm run test -- ProjectsPage
```

- [ ] **Step 5: Commit**

```bash
git add src/features/projects/ProjectsPage.jsx src/__tests__/projects/ProjectsPage.test.jsx
git commit -m "feat: add projects list page with status filters"
```

---

## Task 4: Build PhaseFormDialog

**Files:**
- Create: `src/features/projects/PhaseFormDialog.jsx`

- [ ] **Step 1: Create the file**

Create `src/features/projects/PhaseFormDialog.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EMPTY = { name: '', start_date: '', end_date: '', status: 'pending' }

const PHASE_STATUSES = [
  { value: 'pending',   label: 'Pending' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const SUGGESTED_PHASES = [
  'Schematic Design',
  'Design Development',
  'Construction Documents',
  'Bidding & Negotiation',
  'Construction Administration',
  'Project Closeout',
]

export default function PhaseFormDialog({ open, onOpenChange, onSubmit, initial }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial } : EMPTY)
    setError('')
  }, [initial, open])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const payload = {
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    const { error } = await onSubmit(payload)
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
          <DialogTitle>{isEdit ? 'Edit Phase' : 'Add Phase'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label className="text-slate-300">Phase Name *</Label>
            <Input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Schematic Design"
              required
              list="phase-suggestions"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <datalist id="phase-suggestions">
              {SUGGESTED_PHASES.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Status</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {PHASE_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {submitting ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save Changes' : 'Add Phase')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/projects/PhaseFormDialog.jsx
git commit -m "feat: add PhaseFormDialog with suggested phase names"
```

---

## Task 5: Build ProjectDetailPage with tests

**Files:**
- Create: `src/features/projects/ProjectDetailPage.jsx`
- Create: `src/__tests__/projects/ProjectDetailPage.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/projects/ProjectDetailPage.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import ProjectDetailPage from '../../features/projects/ProjectDetailPage'

const mockProject = {
  id: 'p1', name: 'Bangalore Villa', status: 'active',
  description: 'Luxury residential villa',
  start_date: '2026-01-01', deadline: '2026-12-31',
  city: 'Bangalore', state: 'Karnataka',
  clients: { name: 'Rahul Sharma', organization: 'Sharma Industries' },
  created_at: '2026-01-01',
}

const mockPhases = [
  { id: 'ph1', name: 'Schematic Design', status: 'completed', order_index: 0, start_date: '2026-01-01', end_date: '2026-03-31' },
  { id: 'ph2', name: 'Design Development', status: 'active', order_index: 1, start_date: '2026-04-01', end_date: '2026-07-31' },
]

const mockMembers = [
  { project_id: 'p1', user_id: 'u1', role_in_project: 'lead', users: { id: 'u1', full_name: 'Priya Sharma', role: 'principal_architect' } },
]

vi.mock('../../features/projects/useProjects', () => ({
  useProject: () => ({
    project: mockProject,
    phases: mockPhases,
    members: mockMembers,
    loading: false,
    addPhase: vi.fn().mockResolvedValue({ error: null }),
    updatePhase: vi.fn().mockResolvedValue({ error: null }),
    addMember: vi.fn().mockResolvedValue({ error: null }),
    removeMember: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

vi.mock('../../features/admin/useUsers', () => ({
  useUsers: () => ({ users: [], loading: false }),
}))

function renderDetail() {
  return render(
    <AuthContext.Provider value={{ profile: { id: 'u1', role: 'admin' }, session: {}, user: {}, loading: false }}>
      <MemoryRouter initialEntries={['/projects/p1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders project name', async () => {
  renderDetail()
  await waitFor(() => expect(screen.getByText('Bangalore Villa')).toBeInTheDocument())
})

test('renders phase list', async () => {
  renderDetail()
  await waitFor(() => {
    expect(screen.getByText('Schematic Design')).toBeInTheDocument()
    expect(screen.getByText('Design Development')).toBeInTheDocument()
  })
})

test('renders team members', async () => {
  renderDetail()
  await waitFor(() => expect(screen.getByText('Priya Sharma')).toBeInTheDocument())
})

test('Add Phase button opens dialog', async () => {
  renderDetail()
  await userEvent.click(screen.getByRole('button', { name: /add phase/i }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test — confirm fails**

```bash
npm run test -- ProjectDetailPage
```

- [ ] **Step 3: Create ProjectDetailPage**

Create `src/features/projects/ProjectDetailPage.jsx`:

```jsx
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProject } from './useProjects'
import { useUsers } from '@/features/admin/useUsers'
import PhaseFormDialog from './PhaseFormDialog'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

const PHASE_STATUS_COLORS = {
  pending:   'bg-slate-700 text-slate-400',
  active:    'bg-emerald-900/40 text-emerald-400',
  completed: 'bg-blue-900/40 text-blue-400',
}

const ROLE_LABELS = {
  admin: 'Admin', principal_architect: 'Principal Architect',
  architect: 'Architect', staff_engineer: 'Staff Engineer',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { project, phases, members, loading, addPhase, updatePhase, addMember, removeMember } = useProject(id)
  const { users } = useUsers()
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState(null)
  const [activeTab, setActiveTab] = useState('phases')

  const nonMembers = users.filter(u => !members.some(m => m.user_id === u.id))

  async function handlePhaseSubmit(form) {
    if (editingPhase) return updatePhase(editingPhase.id, form)
    return addPhase(form)
  }

  function openEditPhase(e, phase) {
    e.stopPropagation()
    setEditingPhase(phase)
    setPhaseDialogOpen(true)
  }

  function openAddPhase() {
    setEditingPhase(null)
    setPhaseDialogOpen(true)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>
  if (!project) return <div className="p-8 text-slate-400">Project not found.</div>

  const completedPhases = phases.filter(p => p.status === 'completed').length
  const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0

  return (
    <div className="p-8 min-h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/projects" className="hover:text-slate-300 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-slate-300">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <Badge variant="outline" className={`${STATUS_COLORS[project.status]}`}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {project.clients?.organization && <span>👥 {project.clients.organization}</span>}
            {(project.city || project.state) && <span>📍 {[project.city, project.state].filter(Boolean).join(', ')}</span>}
            {project.deadline && <span>⏰ Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/projects')} className="border-slate-700 text-slate-300 hover:bg-slate-800">
          ← Back
        </Button>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-sm">Overall Progress</span>
          <span className="text-indigo-400 font-semibold text-sm">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-slate-600 text-xs mt-1">{completedPhases} of {phases.length} phases completed</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-slate-800 pb-0">
        {['phases', 'team'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab} {tab === 'phases' ? `(${phases.length})` : `(${members.length})`}
          </button>
        ))}
      </div>

      {/* Phases tab */}
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
                <div key={phase.id} className="bg-slate-900 rounded-lg border border-slate-800 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{phase.name}</div>
                        {(phase.start_date || phase.end_date) && (
                          <div className="text-slate-500 text-xs mt-0.5">
                            {[phase.start_date, phase.end_date].filter(Boolean).map(d =>
                              new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            ).join(' → ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${PHASE_STATUS_COLORS[phase.status] ?? PHASE_STATUS_COLORS.pending}`}>
                        {phase.status}
                      </span>
                      <Button variant="outline" size="sm" onClick={e => openEditPhase(e, phase)} className="border-slate-700 text-slate-400 hover:bg-slate-800 text-xs">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team tab */}
      {activeTab === 'team' && (
        <div>
          {/* Add member */}
          {nonMembers.length > 0 && (
            <div className="flex gap-2 mb-5">
              <Select onValueChange={userId => addMember(userId)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white max-w-xs">
                  <SelectValue placeholder="Add team member…" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {nonMembers.map(u => (
                    <SelectItem key={u.id} value={u.id} className="text-white">
                      {u.full_name} ({ROLE_LABELS[u.role] ?? u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {members.length === 0 ? (
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center text-slate-500 text-sm">
              No team members assigned yet.
            </div>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center justify-between bg-slate-900 rounded-lg border border-slate-800 px-4 py-3">
                  <div>
                    <div className="text-white font-medium text-sm">{m.users?.full_name}</div>
                    <div className="text-slate-500 text-xs">{ROLE_LABELS[m.users?.role] ?? m.users?.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={m.role_in_project === 'lead' ? 'border-indigo-500 text-indigo-400 text-xs' : 'border-slate-600 text-slate-400 text-xs'}>
                      {m.role_in_project}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMember(m.user_id)}
                      className="border-slate-700 text-red-400 hover:bg-red-900/20 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <PhaseFormDialog
        open={phaseDialogOpen}
        onOpenChange={open => { setPhaseDialogOpen(open); if (!open) setEditingPhase(null) }}
        onSubmit={handlePhaseSubmit}
        initial={editingPhase}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm 4 pass**

```bash
npm run test -- ProjectDetailPage
```

- [ ] **Step 5: Commit**

```bash
git add src/features/projects/ProjectDetailPage.jsx src/__tests__/projects/ProjectDetailPage.test.jsx
git commit -m "feat: add project detail page with phases and team management"
```

---

## Task 6: Wire project routes into App.jsx and sidebar, run all tests, push

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Open `src/App.jsx`. Make these two changes:

**Add imports** (after the ClientDetailPage import line):
```jsx
import ProjectsPage from './features/projects/ProjectsPage'
import ProjectDetailPage from './features/projects/ProjectDetailPage'
```

**Add sidebar nav item** — in `SidebarLayout`, find the `navItems` array and add Projects entry:
```js
const navItems = [
  { to: '/', label: '🏠 Dashboard', always: true },
  { to: '/projects', label: '📁 Projects', roles: ['admin', 'principal_architect', 'architect', 'staff_engineer'] },
  { to: '/clients', label: '👥 Clients', roles: ['admin', 'principal_architect'] },
  { to: '/admin/users', label: '⚙️ Users', roles: ['admin'] },
].filter(item => item.always || item.roles?.includes(profile?.role))
```

**Add routes** — inside `<Routes>`, after the `/clients/:id` route add:
```jsx
<Route path="/projects" element={<ProtectedWithSidebar><ProjectsPage /></ProtectedWithSidebar>} />
<Route path="/projects/:id" element={<ProtectedWithSidebar><ProjectDetailPage /></ProtectedWithSidebar>} />
```

- [ ] **Step 2: Run all tests**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test
```

Expected: All 24 tests pass (16 existing + 4 ProjectsPage + 4 ProjectDetailPage).

- [ ] **Step 3: Commit and push**

```bash
git add src/App.jsx
git commit -m "feat: add project routes and sidebar nav item"
git push
```
