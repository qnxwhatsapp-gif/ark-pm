import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import ClientDetailPage from '../../features/clients/ClientDetailPage'

const mockClient = {
  id: 'c1',
  name: 'Rahul Sharma',
  organization: 'Sharma Industries',
  address: '123 MG Road',
  city: 'Bangalore',
  state: 'Karnataka',
  pin_code: '560001',
  phone: '9876543210',
  email: 'rahul@sharma.com',
  created_at: '2026-01-01',
}

const mockProjects = [
  { id: 'p1', name: 'Bangalore Villa', status: 'active', deadline: '2026-12-31', city: 'Bangalore', state: 'Karnataka' },
  { id: 'p2', name: 'Delhi Office', status: 'planning', deadline: '2027-03-31', city: 'Delhi', state: 'Delhi' },
]

vi.mock('../../features/clients/useClients', () => ({
  useClient: () => ({
    client: mockClient,
    projects: mockProjects,
    loading: false,
  }),
}))

function renderDetail() {
  return render(
    <AuthContext.Provider value={{ profile: { role: 'admin' }, session: {}, user: {}, loading: false }}>
      <MemoryRouter initialEntries={['/clients/c1']}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders client name and organization', async () => {
  renderDetail()
  await waitFor(() => {
    expect(screen.getByText('Sharma Industries')).toBeInTheDocument()
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument()
  })
})

test('renders client projects', async () => {
  renderDetail()
  await waitFor(() => {
    expect(screen.getByText('Bangalore Villa')).toBeInTheDocument()
    expect(screen.getByText('Delhi Office')).toBeInTheDocument()
  })
})

test('shows project count', async () => {
  renderDetail()
  await waitFor(() => {
    expect(screen.getByText(/2 project/i)).toBeInTheDocument()
  })
})
