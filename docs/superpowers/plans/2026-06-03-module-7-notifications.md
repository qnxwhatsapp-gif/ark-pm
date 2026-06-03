# Module 7: Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build in-app realtime notifications (bell icon with unread count, dropdown list, mark-as-read) using Supabase Realtime. Add a Supabase Edge Function that sends email notifications when tasks are assigned. Wire the notification bell into the sidebar.

**Architecture:** `useNotifications` hook subscribes to Supabase Realtime on the `notifications` table for the current user. `NotificationBell` renders in the sidebar with unread count badge and a dropdown. `NotificationsPage` at `/notifications` shows all notifications. Supabase Edge Function `notify-task-assigned` inserts a notification row + sends email when a task's `assigned_to` field changes.

**Tech Stack:** React 18, Vite, Supabase Realtime, Supabase Edge Functions (Deno), shadcn/ui, Vitest + RTL

---

## File Map

| File | Responsibility |
|---|---|
| `src/features/notifications/useNotifications.js` | Realtime notifications hook |
| `src/features/notifications/NotificationBell.jsx` | Bell icon + dropdown in sidebar |
| `src/features/notifications/NotificationsPage.jsx` | Full notifications list at /notifications |
| `src/__tests__/notifications/NotificationsPage.test.jsx` | Tests |
| `supabase/functions/notify-task-assigned/index.ts` | Edge Function: insert notification + send email |
| `src/App.jsx` | Add /notifications route, wire NotificationBell in sidebar |

---

## Task 1: Build useNotifications hook

**Files:**
- Create: `src/features/notifications/useNotifications.js`

- [ ] **Step 1: Create the file**

Create `src/features/notifications/useNotifications.js`:

```js
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let sub = null
    fetchNotifications().then(() => {
      subscribeToRealtime().then(s => { sub = s })
    })
    return () => { if (sub) sub.unsubscribe() }
  }, [])

  async function fetchNotifications() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }

  async function subscribeToRealtime() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    return supabase
      .channel(`notifications:${session.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()
  }

  async function markAsRead(notificationId) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
  }

  async function markAllAsRead() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/notifications/useNotifications.js
git commit -m "feat: add useNotifications hook with realtime subscription"
```

---

## Task 2: Build NotificationBell and NotificationsPage with tests

**Files:**
- Create: `src/features/notifications/NotificationBell.jsx`
- Create: `src/features/notifications/NotificationsPage.jsx`
- Create: `src/__tests__/notifications/NotificationsPage.test.jsx`

- [ ] **Step 1: Write failing test**

Create `src/__tests__/notifications/NotificationsPage.test.jsx`:

```jsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import NotificationsPage from '../../features/notifications/NotificationsPage'

const mockNotifications = [
  { id: 'n1', type: 'task_assigned', message: 'You were assigned: Submit floor plan', link: '/projects/p1', is_read: false, created_at: '2026-06-01T10:00:00Z' },
  { id: 'n2', type: 'deadline_soon', message: 'Task due tomorrow: Review structure', link: '/projects/p2', is_read: true, created_at: '2026-05-31T09:00:00Z' },
]

const markAllAsRead = vi.fn()
const markAsRead = vi.fn()

vi.mock('../../features/notifications/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    loading: false,
    unreadCount: 1,
    markAsRead,
    markAllAsRead,
  }),
}))

function renderWithUser() {
  return render(
    <AuthContext.Provider value={{ profile: { role: 'architect' }, session: {}, user: {}, loading: false }}>
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders Notifications heading', () => {
  renderWithUser()
  expect(screen.getByText(/notifications/i)).toBeInTheDocument()
})

test('renders notification messages', async () => {
  renderWithUser()
  await waitFor(() => {
    expect(screen.getByText('You were assigned: Submit floor plan')).toBeInTheDocument()
    expect(screen.getByText('Task due tomorrow: Review structure')).toBeInTheDocument()
  })
})

test('shows unread badge on unread notifications', async () => {
  renderWithUser()
  await waitFor(() => {
    expect(screen.getByText(/mark all read/i)).toBeInTheDocument()
  })
})

test('calls markAllAsRead when button clicked', async () => {
  renderWithUser()
  await userEvent.click(screen.getByRole('button', { name: /mark all read/i }))
  expect(markAllAsRead).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run test — confirm fails**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test -- NotificationsPage
```

- [ ] **Step 3: Create NotificationBell**

Create `src/features/notifications/NotificationBell.jsx`:

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from './useNotifications'

const TYPE_ICONS = {
  task_assigned: '📋',
  deadline_soon: '⏰',
  status_changed: '🔄',
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const recent = notifications.slice(0, 5)

  function handleClick(notification) {
    if (!notification.is_read) markAsRead(notification.id)
    if (notification.link) navigate(notification.link)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-10 left-0 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
              <span className="text-white text-sm font-medium">Notifications</span>
              <button
                onClick={() => { navigate('/notifications'); setOpen(false) }}
                className="text-indigo-400 text-xs hover:text-indigo-300"
              >
                View all
              </button>
            </div>
            {recent.length === 0 ? (
              <div className="px-3 py-4 text-slate-500 text-xs text-center">No notifications</div>
            ) : (
              <div className="divide-y divide-slate-700">
                {recent.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-700/50 transition-colors ${!n.is_read ? 'bg-indigo-900/20' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${n.is_read ? 'text-slate-400' : 'text-slate-200'}`}>
                          {n.message}
                        </p>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create NotificationsPage**

Create `src/features/notifications/NotificationsPage.jsx`:

```jsx
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useNotifications } from './useNotifications'

const TYPE_ICONS = {
  task_assigned: '📋',
  deadline_soon: '⏰',
  status_changed: '🔄',
}

const TYPE_LABELS = {
  task_assigned: 'Task Assigned',
  deadline_soon: 'Deadline Soon',
  status_changed: 'Status Changed',
}

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()

  function handleClick(n) {
    if (!n.is_read) markAsRead(n.id)
    if (n.link) navigate(n.link)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading notifications…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            {unreadCount > 0 && <span className="text-indigo-400 ml-2">· {unreadCount} unread</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <div className="text-slate-500">No notifications yet.</div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {notifications.map((n, idx) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-slate-800/50 transition-colors ${idx < notifications.length - 1 ? 'border-b border-slate-800' : ''} ${!n.is_read ? 'bg-indigo-900/10' : ''}`}
            >
              <div className="text-xl mt-0.5 shrink-0">{TYPE_ICONS[n.type] ?? '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm ${n.is_read ? 'text-slate-400' : 'text-white font-medium'}`}>
                    {n.message}
                  </span>
                  {!n.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>{TYPE_LABELS[n.type] ?? n.type}</span>
                  <span>·</span>
                  <span>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests — confirm 4 pass**

```bash
npm run test -- NotificationsPage
```

- [ ] **Step 6: Commit**

```bash
git add src/features/notifications/NotificationBell.jsx src/features/notifications/NotificationsPage.jsx src/__tests__/notifications/NotificationsPage.test.jsx
git commit -m "feat: add NotificationBell, NotificationsPage"
```

---

## Task 3: Create notify-task-assigned Edge Function

**Files:**
- Create: `supabase/functions/notify-task-assigned/index.ts`

- [ ] **Step 1: Create the Edge Function**

Create `supabase/functions/notify-task-assigned/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { task_id, assigned_to, task_title, project_name } = await req.json()

    if (!task_id || !assigned_to) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get assignee email for email notification
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', assigned_to)
      .single()

    // Insert in-app notification
    await supabase.from('notifications').insert({
      user_id: assigned_to,
      type: 'task_assigned',
      message: `You were assigned: ${task_title ?? 'a task'}${project_name ? ` (${project_name})` : ''}`,
      link: `/tasks`,
      is_read: false,
    })

    // Send email via Supabase Auth admin
    if (user?.email) {
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email,
      }).catch(() => {
        // Email sending failure is non-fatal
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Update supabase/README.md** — append:

```markdown

## notify-task-assigned Edge Function

Triggered when a task is assigned to a user. Creates an in-app notification.

Deploy:
```bash
supabase functions deploy notify-task-assigned --project-ref YOUR_PROJECT_REF
```

Call from the frontend after creating/updating a task with an assigned_to value:
```js
await supabase.functions.invoke('notify-task-assigned', {
  body: { task_id, assigned_to, task_title, project_name }
})
```
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/notify-task-assigned/ supabase/README.md
git commit -m "feat: add notify-task-assigned Edge Function"
```

---

## Task 4: Wire notifications into App.jsx sidebar and push

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update App.jsx**

Add imports:
```jsx
import NotificationBell from './features/notifications/NotificationBell'
import NotificationsPage from './features/notifications/NotificationsPage'
```

In `SidebarLayout`, add the NotificationBell to the bottom section (next to Sign out):

Find:
```jsx
<div className="p-3 border-t border-slate-800">
  <button
    onClick={signOut}
    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
  >
    Sign out
  </button>
</div>
```

Replace with:
```jsx
<div className="p-3 border-t border-slate-800 space-y-1">
  <div className="flex items-center justify-between px-1">
    <span className="text-slate-600 text-xs">Notifications</span>
    <NotificationBell />
  </div>
  <button
    onClick={signOut}
    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
  >
    Sign out
  </button>
</div>
```

Add route after `/reports`:
```jsx
<Route path="/notifications" element={<ProtectedWithSidebar><NotificationsPage /></ProtectedWithSidebar>} />
```

- [ ] **Step 2: Run all tests**

```bash
cd "C:/Users/vivek.singh/OneDrive - Naviga/Desktop/ark-pm"
npm run test
```

Expected: **43 tests pass** (39 existing + 4 NotificationsPage).

- [ ] **Step 3: Commit and push**

```bash
git add src/App.jsx
git commit -m "feat: wire NotificationBell and /notifications route into app"
git push
```
