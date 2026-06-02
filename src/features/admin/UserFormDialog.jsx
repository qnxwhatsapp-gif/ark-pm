import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ROLES = [
  { value: 'principal_architect', label: 'Principal Architect' },
  { value: 'architect', label: 'Architect' },
  { value: 'staff_engineer', label: 'Staff Engineer' },
]

export default function UserFormDialog({ open, onOpenChange, onSubmit }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'architect' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await onSubmit(form)
    setSubmitting(false)
    if (error) { setError(typeof error === 'string' ? error : error.message ?? 'Unknown error'); return }
    setForm({ full_name: '', email: '', password: '', role: 'architect' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-slate-300">Full Name</Label>
            <Input
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              placeholder="Priya Sharma"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="priya@arkdesign.com"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="Temporary password"
              required
              minLength={8}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Role</Label>
            <Select value={form.role} onValueChange={v => update('role', v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {ROLES.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-white">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? 'Creating…' : 'Create User'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
