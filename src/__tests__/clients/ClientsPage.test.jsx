import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import ClientsPage from '../../features/clients/ClientsPage'

const mockClients = [
  { id: '1', name: 'Rahul Sharma', organization: 'Sharma Industries', city: 'Bangalore', state: 'Karnataka', phone: '9876543210', email: 'rahul@sharma.com', pin_code: '560001', address: '123 MG Road', created_by: 'u1', created_at: '2026-01-01' },
  { id: '2', name: 'Priya Patel', organization: 'Patel Constructions', city: 'Mumbai', state: 'Maharashtra', phone: '9123456789', email: 'priya@patel.com', pin_code: '400001', address: '456 SV Road', created_by: 'u1', created_at: '2026-01-02' },
]

vi.mock('../../features/clients/useClients', () => ({
  useClients: () => ({
    clients: mockClients,
    loading: false,
    createClient: vi.fn().mockResolvedValue({ error: null }),
    updateClient: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

function renderWithAdmin() {
  return render(
    <AuthContext.Provider value={{ profile: { role: 'admin' }, session: {}, user: {}, loading: false }}>
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

test('renders client list', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('Sharma Industries')).toBeInTheDocument()
    expect(screen.getByText('Patel Constructions')).toBeInTheDocument()
  })
})

test('shows Add Client button', () => {
  renderWithAdmin()
  expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument()
})

test('filters clients by search', async () => {
  renderWithAdmin()
  await userEvent.type(screen.getByPlaceholderText(/search/i), 'Sharma')
  expect(screen.getByText('Sharma Industries')).toBeInTheDocument()
  expect(screen.queryByText('Patel Constructions')).not.toBeInTheDocument()
})

test('opens dialog on Add Client click', async () => {
  renderWithAdmin()
  await userEvent.click(screen.getByRole('button', { name: /add client/i }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
