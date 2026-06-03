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
