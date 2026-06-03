import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useClients } from './useClients'
import ClientFormDialog from './ClientFormDialog'

export default function ClientsPage() {
  const { clients, loading, createClient, updateClient } = useClients()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const navigate = useNavigate()

  const filtered = clients.filter(c =>
    c.organization.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function handleEdit(e, client) {
    e.stopPropagation()
    setEditing(client)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleSubmit(form) {
    if (editing) {
      return updateClient(editing.id, form)
    }
    return createClient(form)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading clients…</div>

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          + Add Client
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by name, organization or city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white max-w-sm"
        />
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Organization</th>
              <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Contact</th>
              <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Location</th>
              <th className="text-left px-4 py-3 text-slate-400 text-sm font-medium">Phone</th>
              <th className="text-right px-4 py-3 text-slate-400 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                  {search ? 'No clients match your search.' : 'No clients yet. Click "+ Add Client" to add the first one.'}
                </td>
              </tr>
            ) : filtered.map(client => (
              <tr
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="border-b border-slate-800 last:border-0 cursor-pointer hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{client.organization}</div>
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">{client.name}</td>
                <td className="px-4 py-3">
                  {client.city ? (
                    <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                      {client.city}{client.state ? `, ${client.state}` : ''}
                    </Badge>
                  ) : <span className="text-slate-600 text-sm">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">{client.phone ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={e => handleEdit(e, client)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={open => { setDialogOpen(open); if (!open) setEditing(null) }}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  )
}
