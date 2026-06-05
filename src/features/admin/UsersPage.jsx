import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsers } from './useUsers'
import UserFormDialog from './UserFormDialog'
import { useAuth } from '@/features/auth/useAuth'
import { supabase } from '@/lib/supabase'

const ROLE_LABELS = {
  admin: 'Admin',
  principal_architect: 'Principal Architect',
  architect: 'Architect',
  staff_engineer: 'Staff Engineer',
}

const ROLE_COLORS = {
  admin: 'border-red-500 text-red-400',
  principal_architect: 'border-indigo-500 text-indigo-400',
  architect: 'border-blue-500 text-blue-400',
  staff_engineer: 'border-slate-500 text-slate-400',
}

const ROLES = [
  { value: 'admin', label: '🔐 Admin' },
  { value: 'principal_architect', label: 'Principal Architect' },
  { value: 'architect', label: 'Architect' },
  { value: 'staff_engineer', label: 'Staff Engineer' },
]

export default function UsersPage() {
  const { users, loading, createUser, updateUser } = useUsers()
  const { profile } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', role: 'architect' })
  const [editError, setEditError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  function openEdit(user) {
    setEditingUser(user)
    setEditForm({ full_name: user.full_name, role: user.role })
    setEditError('')
    setEditDialogOpen(true)
  }

  function openReset(user) {
    setResetTarget(user)
    setNewPassword('')
    setResetError('')
    setResetSuccess(false)
    setResetDialogOpen(true)
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    setEditError('')
    setEditSubmitting(true)
    const { error } = await updateUser(editingUser.id, { full_name: editForm.full_name, role: editForm.role })
    setEditSubmitting(false)
    if (error) { setEditError(error.message ?? 'Failed to update'); return }
    setEditDialogOpen(false)
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setResetError('')
    setResetSuccess(false)
    if (newPassword.length < 8) { setResetError('Password must be at least 8 characters'); return }
    setResetting(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: resetTarget.id, new_password: newPassword }),
      }
    )
    const json = await res.json()
    setResetting(false)
    if (json.error) { setResetError(json.error); return }
    setResetSuccess(true)
    setNewPassword('')
    setTimeout(() => setResetDialogOpen(false), 2000)
  }

  async function toggleActive(user) {
    await updateUser(user.id, { is_active: !user.is_active })
  }

  if (loading) return <div className="p-8 text-slate-400">Loading users…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          + Add User
        </Button>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Name</th>
              <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Email</th>
              <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Role</th>
              <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Status</th>
              <th className="text-right px-4 py-3 text-slate-400 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                  No users found. Click "+ Add User" to create the first user.
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-3">
                  <div className="text-white font-medium text-sm">{user.full_name}</div>
                  {user.id === profile?.id && <div className="text-indigo-400 text-xs">You</div>}
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role] ?? 'border-slate-500 text-slate-400'}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={user.is_active ? 'border-emerald-500 text-emerald-400 text-xs' : 'border-red-500 text-red-400 text-xs'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(user)} className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openReset(user)} className="border-slate-700 text-yellow-400 hover:bg-slate-800 text-xs">
                      Set Password
                    </Button>
                    {user.id !== profile?.id && (
                      <Button variant="outline" size="sm" onClick={() => toggleActive(user)} className={`border-slate-700 text-xs hover:bg-slate-800 ${user.is_active ? 'text-red-400' : 'text-emerald-400'}`}>
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Dialog */}
      <UserFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={createUser} />

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit User — {editingUser?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-slate-300">Full Name</Label>
              <Input
                value={editForm.full_name}
                onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value} className="text-white">{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editError && <p className="text-red-400 text-sm">{editError}</p>}
            <Button type="submit" disabled={editSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Password — {resetTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
            <p className="text-slate-400 text-sm">Set a new password for <span className="text-white font-medium">{resetTarget?.email}</span>. They can change it after logging in.</p>
            <div className="space-y-1">
              <Label className="text-slate-300">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            {resetError && <p className="text-red-400 text-sm">{resetError}</p>}
            {resetSuccess && (
              <div className="bg-emerald-900/20 border border-emerald-800 rounded p-3">
                <p className="text-emerald-400 text-sm">✅ Password updated successfully!</p>
              </div>
            )}
            <Button type="submit" disabled={resetting || resetSuccess} className="w-full bg-yellow-600 hover:bg-yellow-700">
              {resetting ? 'Setting Password…' : 'Set Password'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
