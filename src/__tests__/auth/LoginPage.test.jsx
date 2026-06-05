import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../../features/auth/AuthContext'
import LoginPage from '../../features/auth/LoginPage'

function renderWithContext(signIn) {
  const value = { signIn, loading: false, session: null, user: null, profile: null }
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

function selectRole(roleName = '🔐 Admin') {
  fireEvent.click(screen.getByText(roleName))
}

test('renders role selector on first step', () => {
  renderWithContext(vi.fn())
  expect(screen.getByText(/select your role to continue/i)).toBeInTheDocument()
  expect(screen.getByText('🔐 Admin')).toBeInTheDocument()
})

test('renders email and password fields after selecting a role', () => {
  renderWithContext(vi.fn())
  selectRole()
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
})

test('calls signIn with email and password on submit', async () => {
  const signIn = vi.fn().mockResolvedValue({ error: null })
  renderWithContext(signIn)
  selectRole()

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@ark.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => {
    expect(signIn).toHaveBeenCalledWith('admin@ark.com', 'password123')
  })
})

test('shows error message when signIn fails', async () => {
  const signIn = vi.fn().mockResolvedValue({ error: { message: 'Invalid credentials' } })
  renderWithContext(signIn)
  selectRole()

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@ark.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
  })
})
