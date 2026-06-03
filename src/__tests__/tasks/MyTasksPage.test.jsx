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
