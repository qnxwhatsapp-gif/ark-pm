import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProjects } from './useProjects'
import { useClients } from '@/features/clients/useClients'
import ProjectFormDialog from './ProjectFormDialog'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

const STATUS_FILTERS = ['all', 'active', 'planning', 'on_hold', 'completed']

export default function ProjectsPage() {
  const { projects, loading, createProject, updateProject } = useProjects()
  const { clients } = useClients()
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const navigate = useNavigate()

  const filtered = statusFilter === 'all'
    ? projects
    : projects.filter(p => p.status === statusFilter)

  function handleEdit(e, project) {
    e.stopPropagation()
    setEditing(project)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleSubmit(form) {
    if (editing) return updateProject(editing.id, form)
    return createProject(form)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading projects…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          + New Project
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center text-slate-500 text-sm">
            {statusFilter !== 'all' ? `No ${statusFilter.replace('_', ' ')} projects.` : 'No projects yet. Click "+ New Project" to create one.'}
          </div>
        ) : filtered.map(project => (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="bg-slate-900 rounded-lg border border-slate-800 p-4 cursor-pointer hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white font-semibold truncate">{project.name}</h3>
                  <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_COLORS[project.status] ?? STATUS_COLORS.planning}`}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {project.clients?.organization && <span>👥 {project.clients.organization}</span>}
                  {(project.city || project.state) && <span>📍 {[project.city, project.state].filter(Boolean).join(', ')}</span>}
                  {project.deadline && <span>⏰ Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                </div>
                {project.description && <p className="text-slate-500 text-xs mt-1.5 truncate">{project.description}</p>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={e => handleEdit(e, project)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs ml-4 shrink-0"
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={open => { setDialogOpen(open); if (!open) setEditing(null) }}
        onSubmit={handleSubmit}
        initial={editing}
        clients={clients}
      />
    </div>
  )
}
