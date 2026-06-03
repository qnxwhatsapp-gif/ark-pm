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
