import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { AuthContext } from '../../features/auth/AuthContext'
import UsersPage from '../../features/admin/UsersPage'

const mockUsers = [
  { id: '1', full_name: 'Priya Sharma', email: 'priya@ark.com', role: 'principal_architect', is_active: true },
  { id: '2', full_name: 'Rahul Kumar', email: 'rahul@ark.com', role: 'architect', is_active: true },
]

vi.mock('../../features/admin/useUsers', () => ({
  useUsers: () => ({
    users: mockUsers,
    loading: false,
    createUser: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

function renderWithAdmin() {
  const adminProfile = { id: 'admin-1', role: 'admin', full_name: 'Admin' }
  return render(
    <AuthContext.Provider value={{ profile: adminProfile, session: {}, user: {}, loading: false }}>
      <UsersPage />
    </AuthContext.Provider>
  )
}

test('renders user list', async () => {
  renderWithAdmin()
  await waitFor(() => {
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
    expect(screen.getByText('Rahul Kumar')).toBeInTheDocument()
  })
})

test('shows Add User button', () => {
  renderWithAdmin()
  expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument()
})

test('opens create user dialog on Add User click', async () => {
  renderWithAdmin()
  await userEvent.click(screen.getByRole('button', { name: /add user/i }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
