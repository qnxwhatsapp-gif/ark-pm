import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider } from '../../features/auth/AuthContext'
import { useAuth } from '../../features/auth/useAuth'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

function TestConsumer() {
  const { user, session, loading } = useAuth()
  if (loading) return <div>loading</div>
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'none'}</span>
      <span data-testid="session">{session ? 'has-session' : 'no-session'}</span>
    </div>
  )
}

test('provides null user and session when not logged in', async () => {
  await act(async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
  })
  expect(screen.getByTestId('user')).toHaveTextContent('none')
  expect(screen.getByTestId('session')).toHaveTextContent('no-session')
})

test('throws when useAuth used outside AuthProvider', () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<TestConsumer />)).toThrow()
  spy.mockRestore()
})
