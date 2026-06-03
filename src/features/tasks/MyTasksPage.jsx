import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useMyTasks } from './useTasks'
import { useAuth } from '@/features/auth/useAuth'

const PRIORITY_COLORS = {
  low:    'border-slate-500 text-slate-400',
  medium: 'border-yellow-500 text-yellow-400',
  high:   'border-orange-500 text-orange-400',
  urgent: 'border-red-500 text-red-400',
}

const STATUS_LABELS = {
  todo:        'To Do',
  in_progress: 'In Progress',
  review:      'Review',
  done:        'Done',
}

const STATUS_COLORS = {
  todo:        'bg-slate-700 text-slate-400',
  in_progress: 'bg-indigo-900/40 text-indigo-400',
  review:      'bg-yellow-900/40 text-yellow-400',
  done:        'bg-emerald-900/40 text-emerald-400',
}

export default function MyTasksPage() {
  const { tasks, loading } = useMyTasks()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date())
  const dueSoon = tasks.filter(t => {
    if (!t.due_date) return false
    const d = new Date(t.due_date)
    const now = new Date()
    return d >= now && d <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  })

  if (loading) return <div className="p-8 text-slate-400">Loading tasks…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-slate-400 text-sm mt-1">
          {profile?.full_name} · {tasks.length} open task{tasks.length !== 1 ? 's' : ''}
          {overdue.length > 0 && <span className="text-red-400 ml-2">· {overdue.length} overdue</span>}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{tasks.length}</div>
          <div className="text-slate-400 text-xs mt-1">Open Tasks</div>
        </div>
        <div className={`border rounded-lg p-4 text-center ${overdue.length > 0 ? 'bg-red-900/20 border-red-800' : 'bg-slate-900 border-slate-800'}`}>
          <div className={`text-2xl font-bold ${overdue.length > 0 ? 'text-red-400' : 'text-white'}`}>{overdue.length}</div>
          <div className="text-slate-400 text-xs mt-1">Overdue</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{dueSoon.length}</div>
          <div className="text-slate-400 text-xs mt-1">Due This Week</div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
          <div className="text-slate-500 text-lg mb-2">🎉 All caught up!</div>
          <div className="text-slate-600 text-sm">No open tasks assigned to you.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date()
            return (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => navigate(`/projects/${task.phases?.project_id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium text-sm">{task.title}</span>
                      <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {task.phases?.projects?.name && (
                        <span className="text-indigo-400"><span aria-hidden="true">📁 </span>{task.phases.projects.name}</span>
                      )}
                      {task.phases?.name && <span>🔷 {task.phases.name}</span>}
                      {task.due_date && (
                        <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
                          📅 {isOverdue ? '⚠ Overdue · ' : ''}{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
