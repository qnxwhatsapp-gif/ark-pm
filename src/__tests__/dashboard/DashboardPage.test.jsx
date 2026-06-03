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
  expect(screen.getByText(/vivek/i)).toBeInTheDocument()
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
    expect(screen.getAllByText('Bangalore Villa').length).toBeGreaterThan(0)
  })
})

test('renders my tasks widget', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('Submit floor plan')).toBeInTheDocument()
  })
})
