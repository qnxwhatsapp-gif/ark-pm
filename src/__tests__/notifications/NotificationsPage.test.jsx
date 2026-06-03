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

test('shows mark all read button when there are unread notifications', async () => {
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
