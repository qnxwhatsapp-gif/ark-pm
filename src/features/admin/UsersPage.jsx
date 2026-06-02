import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUsers } from './useUsers'
import UserFormDialog from './UserFormDialog'

const ROLE_LABELS = {
  admin: 'Admin',
  principal_architect: 'Principal Architect',
  architect: 'Architect',
  staff_engineer: 'Staff Engineer',
}

export default function UsersPage() {
  const { users, loading, createUser, updateUser } = useUsers()
  const [dialogOpen, setDialogOpen] = useState(false)

  async function toggleActive(user) {
    await updateUser(user.id, { is_active: !user.is_active })
  }

  if (loading) return <div className="p-8 text-slate-400">Loading users…</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
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
            {users.map(user => (
              <tr key={user.id} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-3 text-white font-medium">{user.full_name}</td>
                <td className="px-4 py-3 text-slate-400 text-sm">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="border-indigo-500 text-indigo-400 text-xs">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={user.is_active
                      ? 'border-emerald-500 text-emerald-400 text-xs'
                      : 'border-red-500 text-red-400 text-xs'
                    }
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(user)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={createUser}
      />
    </div>
  )
}
