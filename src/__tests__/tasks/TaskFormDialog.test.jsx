import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthContext } from '../../features/auth/AuthContext'
import TaskFormDialog from '../../features/tasks/TaskFormDialog'

const mockUsers = [
  { id: 'u1', full_name: 'Priya Sharma', role: 'principal_architect' },
  { id: 'u2', full_name: 'Rahul Kumar', role: 'architect' },
]

function renderDialog(props = {}) {
  return render(
    <AuthContext.Provider value={{ profile: { id: 'u1', role: 'admin' }, session: {}, user: {}, loading: false }}>
      <TaskFormDialog
        open={true}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue({ error: null })}
        users={mockUsers}
        {...props}
      />
    </AuthContext.Provider>
  )
}

test('renders task title field', () => {
  renderDialog()
  expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
})

test('renders priority and status selects', () => {
  renderDialog()
  expect(screen.getByText(/priority/i)).toBeInTheDocument()
  expect(screen.getByText(/status/i)).toBeInTheDocument()
})

test('calls onSubmit with form data', async () => {
  const onSubmit = vi.fn().mockResolvedValue({ error: null })
  renderDialog({ onSubmit })
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Submit floor plan' } })
  fireEvent.click(screen.getByRole('button', { name: /create task/i }))
  await waitFor(() => expect(onSubmit).toHaveBeenCalled())
})

test('shows error message on submit failure', async () => {
  const onSubmit = vi.fn().mockResolvedValue({ error: { message: 'Failed to create' } })
  renderDialog({ onSubmit })
  fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test task' } })
  fireEvent.click(screen.getByRole('button', { name: /create task/i }))
  await waitFor(() => expect(screen.getByText(/failed to create/i)).toBeInTheDocument())
})
