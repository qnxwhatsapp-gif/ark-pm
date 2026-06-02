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

test('renders email and password fields', () => {
  renderWithContext(vi.fn())
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
})

test('calls signIn with email and password on submit', async () => {
  const signIn = vi.fn().mockResolvedValue({ error: null })
  renderWithContext(signIn)

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

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@ark.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

  await waitFor(() => {
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
  })
})
