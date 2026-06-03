import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const EMPTY = { name: '', organization: '', address: '', city: '', state: '', pin_code: '', phone: '', email: '' }

export default function ClientFormDialog({ open, onOpenChange, onSubmit, initial }) {
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
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add New Client'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Contact Name *</Label>
              <Input
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="Rahul Sharma"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Organization *</Label>
              <Input
                value={form.organization}
                onChange={e => update('organization', e.target.value)}
                placeholder="Sharma Industries Pvt Ltd"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Address</Label>
            <Input
              value={form.address}
              onChange={e => update('address', e.target.value)}
              placeholder="123 MG Road"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">City</Label>
              <Input
                value={form.city}
                onChange={e => update('city', e.target.value)}
                placeholder="Bangalore"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">State</Label>
              <Input
                value={form.state}
                onChange={e => update('state', e.target.value)}
                placeholder="Karnataka"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">PIN Code</Label>
              <Input
                value={form.pin_code}
                onChange={e => update('pin_code', e.target.value)}
                placeholder="560001"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300">Phone</Label>
              <Input
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="contact@sharma.com"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Add Client')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
