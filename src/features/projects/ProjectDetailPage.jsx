import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProject } from './useProjects'
import { useUsers } from '@/features/admin/useUsers'
import PhaseFormDialog from './PhaseFormDialog'
import PhaseWithTasks from './PhaseWithTasks'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

const PHASE_STATUS_COLORS = {
  pending:   'bg-slate-700 text-slate-400',
  active:    'bg-emerald-900/40 text-emerald-400',
  completed: 'bg-blue-900/40 text-blue-400',
}

const ROLE_LABELS = {
  admin: 'Admin', principal_architect: 'Principal Architect',
  architect: 'Architect', staff_engineer: 'Staff Engineer',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { project, phases, members, loading, addPhase, updatePhase, addMember, removeMember } = useProject(id)
  const { users } = useUsers()
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState(null)
  const [activeTab, setActiveTab] = useState('phases')

  const nonMembers = users.filter(u => !members.some(m => m.user_id === u.id))

  async function handlePhaseSubmit(form) {
    if (editingPhase) return updatePhase(editingPhase.id, form)
    return addPhase(form)
  }

  function openEditPhase(e, phase) {
    e.stopPropagation()
    setEditingPhase(phase)
    setPhaseDialogOpen(true)
  }

  function openAddPhase() {
    setEditingPhase(null)
    setPhaseDialogOpen(true)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>
  if (!project) return <div className="p-8 text-slate-400">Project not found.</div>

  const completedPhases = phases.filter(p => p.status === 'completed').length
  const progress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0

  return (
    <div className="p-8 min-h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/projects" className="hover:text-slate-300 transition-colors">Projects</Link>
        <span>/</span>
        <span className="text-slate-300">Details</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <Badge variant="outline" className={`${STATUS_COLORS[project.status]}`}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {project.clients?.organization && <span>👥 {project.clients.organization}</span>}
            {(project.city || project.state) && <span>📍 {[project.city, project.state].filter(Boolean).join(', ')}</span>}
            {project.deadline && <span>⏰ Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/projects')} className="border-slate-700 text-slate-300 hover:bg-slate-800">
          ← Back
        </Button>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-400 text-sm">Overall Progress</span>
          <span className="text-indigo-400 font-semibold text-sm">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-slate-600 text-xs mt-1">{completedPhases} of {phases.length} phases completed</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-slate-800">
        {['phases', 'team'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab} {tab === 'phases' ? `(${phases.length})` : `(${members.length})`}
          </button>
        ))}
      </div>

      {/* Phases tab — always rendered, hidden when not active */}
      <div className={activeTab !== 'phases' ? 'hidden' : ''}>
        <div className="flex justify-end mb-4">
          <Button onClick={openAddPhase} className="bg-indigo-600 hover:bg-indigo-700 text-sm">
            + Add Phase
          </Button>
        </div>
        {phases.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center text-slate-500 text-sm">
            No phases yet. Click &quot;+ Add Phase&quot; to define project phases.
          </div>
        ) : (
          <div className="space-y-3">
            {phases.map((phase, idx) => (
              <PhaseWithTasks
                key={phase.id}
                phase={phase}
                idx={idx}
                onEditPhase={phase => { setEditingPhase(phase); setPhaseDialogOpen(true) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Team tab — always rendered, hidden when not active */}
      <div className={activeTab !== 'team' ? 'hidden' : ''}>
        {nonMembers.length > 0 && (
          <div className="flex gap-2 mb-5">
            <Select onValueChange={userId => addMember(userId)}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white max-w-xs">
                <SelectValue placeholder="Add team member…" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {nonMembers.map(u => (
                  <SelectItem key={u.id} value={u.id} className="text-white">
                    {u.full_name} ({ROLE_LABELS[u.role] ?? u.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {members.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-8 text-center text-slate-500 text-sm">
            No team members assigned yet.
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center justify-between bg-slate-900 rounded-lg border border-slate-800 px-4 py-3">
                <div>
                  <div className="text-white font-medium text-sm">{m.users?.full_name}</div>
                  <div className="text-slate-500 text-xs">{ROLE_LABELS[m.users?.role] ?? m.users?.role}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={m.role_in_project === 'lead' ? 'border-indigo-500 text-indigo-400 text-xs' : 'border-slate-600 text-slate-400 text-xs'}>
                    {m.role_in_project}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => removeMember(m.user_id)} className="border-slate-700 text-red-400 hover:bg-red-900/20 text-xs">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <PhaseFormDialog
        open={phaseDialogOpen}
        onOpenChange={open => { setPhaseDialogOpen(open); if (!open) setEditingPhase(null) }}
        onSubmit={handlePhaseSubmit}
        initial={editingPhase}
      />
    </div>
  )
}
