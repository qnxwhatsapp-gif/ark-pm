import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const EMPTY = { name: '', start_date: '', end_date: '', status: 'pending' }

const PHASE_STATUSES = [
  { value: 'pending',   label: 'Pending' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const SUGGESTED_PHASES = [
  'Schematic Design',
  'Design Development',
  'Construction Documents',
  'Bidding & Negotiation',
  'Construction Administration',
  'Project Closeout',
]

export default function PhaseFormDialog({ open, onOpenChange, onSubmit, initial }) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial } : EMPTY)
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
      start_date: form.start_date || null,
      end_date: form.end_date || null,
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
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Phase' : 'Add Phase'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="space-y-1">
            <Label className="text-slate-300">Phase Name *</Label>
            <Input
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="Schematic Design"
              required
              list="phase-suggestions"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <datalist id="phase-suggestions">
              {SUGGESTED_PHASES.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Status</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {PHASE_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {submitting ? (isEdit ? 'Saving…' : 'Adding…') : (isEdit ? 'Save Changes' : 'Add Phase')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
