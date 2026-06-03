import { render, screen, waitFor } from '@testing-library/react'
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
