import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useClient } from './useClients'
import ClientFormDialog from './ClientFormDialog'
import { supabase } from '@/lib/supabase'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { client, projects, loading } = useClient(id)
  const [editOpen, setEditOpen] = useState(false)

  async function handleUpdate(form) {
    const { error } = await supabase.from('clients').update(form).eq('id', id)
    return { error }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading…</div>
  if (!client) return <div className="min-h-screen bg-slate-950 p-8 text-slate-400">Client not found.</div>

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/clients" className="hover:text-slate-300 transition-colors">Clients</Link>
        <span>/</span>
        <span className="text-slate-300">{client.organization}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{client.organization}</h1>
          <p className="text-slate-400 mt-1">Contact: <span>{client.name}</span></p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setEditOpen(true)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Edit Client
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/clients')}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            ← Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Client Info Card */}
        <div className="col-span-1 bg-slate-900 rounded-lg border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Client Info</h2>
          <div className="space-y-3">
            {client.email && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Email</div>
                <div className="text-slate-300 text-sm">{client.email}</div>
              </div>
            )}
            {client.phone && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Phone</div>
                <div className="text-slate-300 text-sm">{client.phone}</div>
              </div>
            )}
            {(client.city || client.state) && (
              <div>
                <div className="text-xs text-slate-500 mb-0.5">Location</div>
                <div className="text-slate-300 text-sm">
                  {[client.address, client.city, client.state, client.pin_code].filter(Boolean).join(', ')}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Client since</div>
              <div className="text-slate-300 text-sm">
                {new Date(client.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Projects
              <span className="ml-2 text-indigo-400 font-normal normal-case">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </span>
            </h2>
          </div>
          {projects.length === 0 ? (
            <p className="text-slate-600 text-sm">No projects yet for this client.</p>
          ) : (
            <div className="space-y-2">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div>
                    <div className="text-white font-medium text-sm">{project.name}</div>
                    {(project.city || project.state) && (
                      <div className="text-slate-500 text-xs mt-0.5">
                        {[project.city, project.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {project.deadline && (
                      <span className="text-xs text-slate-500">
                        Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[project.status] ?? STATUS_COLORS.planning}`}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ClientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleUpdate}
        initial={client}
      />
    </div>
  )
}
