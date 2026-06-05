# Ark Design PM — Claude Code Context

## Project Overview

**Ark Design PM** is a project management tool for **Ark Design International**, a 15–20 member architecture firm. Built with React 18 + Vite (SPA), Supabase (Auth + Postgres + Realtime + Edge Functions), shadcn/ui, TailwindCSS v4, and React Router v6.

**Live URL:** https://ark-pm.vercel.app  
**GitHub:** https://github.com/qnxwhatsapp-gif/ark-pm  
**Supabase Project Ref:** `zgxcfhnosbowklslmpdm`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| UI Components | shadcn/ui |
| Styling | TailwindCSS v4 |
| Backend / DB | Supabase (Postgres + RLS) |
| Auth | Supabase Auth (email/password) |
| Realtime | Supabase Realtime (notifications) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Charts | Recharts |
| PDF Export | jsPDF + html2canvas |
| Tests | Vitest + React Testing Library |
| Deploy | Vercel (auto-deploy from GitHub main) |

---

## Path Alias

`@/*` resolves to `src/` — configured in `vite.config.js`.

---

## Roles & Permissions

| Role | Access |
|---|---|
| `admin` | Everything — users, clients, projects, reports, notifications |
| `principal_architect` | Users (create/edit/set password), clients, projects, reports, tasks |
| `architect` | Projects, tasks (assigned), my tasks, notifications |
| `staff_engineer` | Projects (assigned), tasks (assigned), my tasks, notifications |

**RLS:** Enforced at database level via `public.get_my_role()` helper function.

---

## Feature Modules (All Complete)

### Module 1 — Auth & Users
- Email/password login with role selector (step 1: pick role, step 2: credentials)
- Forgot password → Supabase email reset link
- `ProtectedRoute` with role-based access
- Admin & Principal Architect can: create users (any role), edit name/role, set password, activate/deactivate
- Edge Functions: `create-user`, `reset-user-password`

### Module 2 — Clients
- Full CRUD — create, edit, view clients
- Fields: name, organization, address, city, state, pin_code, phone, email
- Client detail page shows associated projects
- Search/filter by organization, name, city

### Module 3 — Projects & Phases
- Projects: name, description, client, city, state, PIN, status, start_date, deadline
- Status: planning / active / on_hold / completed
- Phases inside projects: name, start/end date, status (pending/active/completed), order_index
- Project detail: progress bar (% phases completed), tabs (Phases, Team)
- Team tab: add/remove members with role badges

### Module 4 — Tasks
- Tasks inside phases: title, description, assigned_to, priority, status, due_date
- Priority: low / medium / high / urgent
- Status: todo / in_progress / review / done (auto-sets completed_at)
- Inline status dropdown on each task card
- Delete task
- **Comments** per task — click 💬 to expand, add comment, realtime display
- **My Tasks page** (`/tasks`) — all open tasks assigned to current user, overdue stats

### Module 5 — Dashboard
- Greeting by name + time of day
- 4 stat cards: Active Projects, Tasks Due This Week, Overdue (turns red), Completed This Month
- Active Projects widget (top 5, click → project detail)
- My Tasks widget (upcoming, click → project)

### Module 6 — Reports
- Filter by status + project
- 3 summary stat cards
- Recharts bar chart — project progress %
- Summary table: project, client, status, progress bar, task counts, phases, overdue, deadline
- **Export PDF** button (jsPDF + html2canvas captures the report div)
- Access: Admin + Principal Architect only

### Module 7 — Notifications
- 🔔 Bell icon in sidebar bottom with unread count badge (red)
- Dropdown shows 5 most recent, click → marks read + navigates
- `/notifications` full page — mark all read, type icons, timestamps
- **Supabase Realtime** subscription — new notifications appear instantly
- Edge Function: `notify-task-assigned` — inserts notification when task assigned

---

## File Structure

```
src/
├── lib/supabase.js                    # Supabase client singleton
├── features/
│   ├── admin/
│   │   ├── UserFormDialog.jsx            # Add user modal (all roles)
│   │   ├── UsersPage.jsx                 # User list + Edit + Set Password + Activate
│   │   └── useUsers.js                   # useUsers() — list, createUser, updateUser
│   ├── auth/
│   │   ├── AuthContext.jsx               # Session + profile state, signIn/signOut
│   │   ├── LoginPage.jsx                 # Role selector → email/password login
│   │   ├── ProtectedRoute.jsx            # Route guard with optional requiredRole
│   │   └── useAuth.js                    # useAuth() hook
│   ├── clients/
│   │   ├── ClientDetailPage.jsx          # Client info + projects list
│   │   ├── ClientFormDialog.jsx          # Add/edit client modal
│   │   ├── ClientsPage.jsx               # List + search + add/edit
│   │   └── useClients.js                 # useClients() + useClient(id)
│   ├── dashboard/
│   │   ├── DashboardPage.jsx             # Main dashboard
│   │   ├── StatsCard.jsx                 # Reusable stat card
│   │   └── useDashboard.js               # Parallel stats fetch
│   ├── notifications/
│   │   ├── NotificationBell.jsx          # Bell + dropdown in sidebar
│   │   ├── NotificationsPage.jsx         # /notifications full page
│   │   └── useNotifications.js           # Realtime hook + markAsRead + markAllAsRead
│   ├── projects/
│   │   ├── PhaseFormDialog.jsx           # Add/edit phase modal (suggested names)
│   │   ├── PhaseWithTasks.jsx            # Expandable phase row with tasks inline
│   │   ├── ProjectDetailPage.jsx         # Detail: progress, phases (PhaseWithTasks), team
│   │   ├── ProjectFormDialog.jsx         # Add/edit project modal
│   │   ├── ProjectsPage.jsx              # List + status filters + add/edit
│   │   └── useProjects.js                # useProjects() + useProject(id)
│   ├── reports/
│   │   ├── ReportsPage.jsx               # Charts + table + PDF export
│   │   └── useReports.js                 # useReports(filters) + useAllProjects()
│   └── tasks/
│       ├── CommentsPanel.jsx             # Comment list + add form per task
│       ├── MyTasksPage.jsx               # /tasks — personal task list with stats
│       ├── TaskCard.jsx                  # Task row: status dropdown, edit, delete, comments toggle
│       ├── TaskFormDialog.jsx            # Add/edit task modal
│       └── useTasks.js                   # usePhaseTasks(phaseId) + useMyTasks() + useTaskComments(taskId)
├── components/ui/                     # shadcn/ui components
└── App.jsx                            # Routes + SidebarLayout + ProtectedWithSidebar
```

---

## Database Schema (8 tables)

```sql
users           -- extends auth.users (id, email, full_name, role, is_active)
clients         -- (id, name, organization, address, city, state, pin_code, phone, email)
projects        -- (id, name, description, client_id, city, state, status, start_date, deadline)
project_members -- (project_id, user_id, role_in_project)
phases          -- (id, project_id, name, start_date, end_date, order_index, status)
tasks           -- (id, phase_id, title, description, assigned_to, priority, status, due_date, completed_at)
comments        -- (id, task_id, user_id, body, created_at)
notifications   -- (id, user_id, type, message, link, is_read, created_at)
```

Migration: `supabase/migrations/001_initial_schema.sql`

---

## Edge Functions (Deployed to Supabase)

| Function | Purpose | Callers |
|---|---|---|
| `create-user` | Create auth user + public.users row | admin, principal_architect |
| `reset-user-password` | Set another user's password | admin, principal_architect |
| `notify-task-assigned` | Insert notification on task assignment | any authenticated |

Deploy command:
```bash
supabase functions deploy <function-name> --project-ref zgxcfhnosbowklslmpdm
```

---

## Key Patterns

### Hook Pattern
```js
// List hook
export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  // fetchClients, createClient, updateClient
  return { clients, loading, createClient, updateClient }
}

// Detail hook
export function useClient(id) {
  // fetches single client + related data in parallel via Promise.all
  return { client, projects, loading }
}
```

### Supabase — No Relationship Joins
**Do NOT use** `select('*, clients(name, organization)')` — Supabase schema cache causes errors.  
**Use** `select('*')` and resolve client names via client_id lookup separately if needed.

### Route Protection
```jsx
// Admin only
<ProtectedWithSidebar requiredRole="admin"><Page /></ProtectedWithSidebar>

// Any authenticated user
<ProtectedWithSidebar><Page /></ProtectedWithSidebar>
```

### Sidebar Nav — Role Filtering
```js
{ to: '/reports', label: '📊 Reports', roles: ['admin', 'principal_architect'] }
{ to: '/tasks',   label: '✅ My Tasks', roles: ['admin', 'principal_architect', 'architect', 'staff_engineer'] }
{ always: true }  // always shown (Dashboard)
```

---

## Test Count

**44 tests passing** across 12 test files.

```
src/__tests__/
├── admin/UsersPage.test.jsx                      3 tests
├── auth/AuthContext.test.jsx                     3 tests
├── auth/LoginPage.test.jsx                       4 tests
├── clients/ClientDetailPage.test.jsx             3 tests
├── clients/ClientsPage.test.jsx                  4 tests
├── dashboard/DashboardPage.test.jsx              4 tests
├── notifications/NotificationsPage.test.jsx      4 tests
├── projects/ProjectDetailPage.test.jsx           4 tests
├── projects/ProjectsPage.test.jsx                4 tests
├── reports/ReportsPage.test.jsx                  4 tests
├── tasks/MyTasksPage.test.jsx                    3 tests
├── tasks/TaskFormDialog.test.jsx                 4 tests
```

Run: `npm run test`


## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run test     # Run all tests (Vitest)
npm run lint     # ESLint
```

---

## Known Issues / Notes

- **Supabase relationship joins** (`clients(name, organization)`) cause schema cache errors — avoid them, use `select('*')` instead
- **Edge Functions must be manually deployed** via Supabase dashboard or CLI — they are not auto-deployed with Vercel
- `notify-task-assigned` Edge Function is written but not wired into task creation yet (future: call it after createTask when assigned_to is set)
- `seed.sql` — use to create initial admin users via Supabase SQL editor when no admin exists yet

## Last Updated

**2026-06-05 16:51 UTC**

### Files Changed in This Commit
- `scripts/update-claude-md.cjs`
