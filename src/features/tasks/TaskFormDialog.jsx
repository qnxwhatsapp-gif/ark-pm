import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EMPTY = { title: '', description: '', assigned_to: '', priority: 'medium', status: 'todo', due_date: '' }

const PRIORITIES = [
  { value: 'low',    label: '🟢 Low' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'high',   label: '🟠 High' },
  { value: 'urgent', label: '🔴 Urgent' },
]

const STATUSES = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review',      label: 'Review' },
  { value: 'done',        label: 'Done' },
]

export default function TaskFormDialog({ open, onOpenChange, onSubmit, initial, users = [] }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial, assigned_to: initial.assigned_to ?? '', due_date: initial.due_date ?? '' } : EMPTY)
    setError('')
  }, [initial, open])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await onSubmit(form)
    setSubmitting(false)
    if (error) {
      setError(typeof error === 'string' ? error : error.message ?? 'Something went wrong')
      return
    }
    onOpenChange(false)
  }

  const isEdit = Boolean(initial?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label htmlFor="task-title" className="text-slate-300">Title *</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Submit structural drawings"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Description</Label>
            <Input
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Optional details…"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Priority</Label>
              <Select value={form.priority} onValueChange={v => update('priority', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value} className="text-white">{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {STATUSES.map(s => <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Assign To</Label>
              <Select value={form.assigned_to} onValueChange={v => update('assigned_to', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {users.map(u => <SelectItem key={u.id} value={u.id} className="text-white">{u.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Task')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
