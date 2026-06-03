import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/useAuth'
import { useDashboard } from './useDashboard'
import StatsCard from './StatsCard'

const STATUS_COLORS = {
  planning:  'border-slate-500 text-slate-400',
  active:    'border-emerald-500 text-emerald-400',
  on_hold:   'border-yellow-500 text-yellow-400',
  completed: 'border-blue-500 text-blue-400',
}

const PRIORITY_COLORS = {
  low:    'border-slate-500 text-slate-400',
  medium: 'border-yellow-500 text-yellow-400',
  high:   'border-orange-500 text-orange-400',
  urgent: 'border-red-500 text-red-400',
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { stats, recentProjects, myTasks, loading } = useDashboard(profile)
  const navigate = useNavigate()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return <div className="p-8 text-slate-400">Loading dashboard…</div>

  return (
    <div className="p-8 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {greeting()}, <span>{profile?.full_name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's what's happening today.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatsCard label="Active Projects" value={stats.activeProjects} color="indigo" />
        <StatsCard label="Tasks Due This Week" value={stats.tasksDueThisWeek} color="yellow" />
        <StatsCard label="Overdue Tasks" value={stats.overdueTasks} color="red" alert={true} />
        <StatsCard label="Completed This Month" value={stats.completedThisMonth} color="emerald" sub="tasks done" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-indigo-400 text-xs hover:text-indigo-300">
              View all →
            </button>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-slate-600 text-sm">No active projects.</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-800/50 rounded-lg p-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{p.name}</div>
                    {p.clients?.organization && <div className="text-slate-500 text-xs">{p.clients.organization}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {p.deadline && (
                      <span className="text-slate-500 text-xs">
                        {new Date(p.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[p.status]}`}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">My Tasks</h2>
            <button onClick={() => navigate('/tasks')} className="text-indigo-400 text-xs hover:text-indigo-300">
              View all →
            </button>
          </div>
          {myTasks.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-slate-500 text-2xl mb-1">🎉</div>
              <p className="text-slate-600 text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date()
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/projects/${task.phases?.project_id}`)}
                    className="flex items-start justify-between cursor-pointer hover:bg-slate-800/50 rounded-lg p-2 -mx-2 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {task.phases?.projects?.name && <span>{task.phases.projects.name}</span>}
                        {task.due_date && (
                          <span className={isOverdue ? 'text-red-400' : ''}>
                            · {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
