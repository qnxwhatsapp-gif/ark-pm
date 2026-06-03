import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EMPTY = {
  name: '', description: '', client_id: '', city: '', state: '', pin_code: '',
  status: 'planning', start_date: '', deadline: '',
}

const STATUSES = [
  { value: 'planning',  label: 'Planning' },
  { value: 'active',    label: 'Active' },
  { value: 'on_hold',   label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
]

export default function ProjectFormDialog({ open, onOpenChange, onSubmit, initial, clients = [] }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial, client_id: initial.client_id ?? '' } : EMPTY)
    setError('')
  }, [initial, open])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const payload = {
      ...form,
      client_id: form.client_id || null,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
    }
    const { error } = await onSubmit(payload)
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
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label className="text-slate-300">Project Name *</Label>
            <Input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Sharma Corporate HQ — Phase 2"
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Description</Label>
            <Input
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Brief project description"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Client</Label>
              <Select value={form.client_id} onValueChange={v => update('client_id', v)}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-white">
                      {c.organization}
                    </SelectItem>
                  ))}
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
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">City</Label>
              <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Bangalore" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">State</Label>
              <Input value={form.state} onChange={e => update('state', e.target.value)} placeholder="Karnataka" className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">PIN</Label>
              <Input value={form.pin_code} onChange={e => update('pin_code', e.target.value)} placeholder="560001" className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Deadline</Label>
              <Input type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Project')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
