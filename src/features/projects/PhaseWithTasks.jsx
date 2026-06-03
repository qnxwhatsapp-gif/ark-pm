import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePhaseTasks } from '@/features/tasks/useTasks'
import { useUsers } from '@/features/admin/useUsers'
import TaskCard from '@/features/tasks/TaskCard'
import TaskFormDialog from '@/features/tasks/TaskFormDialog'

const PHASE_STATUS_COLORS = {
  pending:   'bg-slate-700 text-slate-400',
  active:    'bg-emerald-900/40 text-emerald-400',
  completed: 'bg-blue-900/40 text-blue-400',
}

export default function PhaseWithTasks({ phase, idx, onEditPhase }) {
  const { tasks, loading, createTask, updateTask, deleteTask } = usePhaseTasks(phase.id)
  const { users } = useUsers()
  const [expanded, setExpanded] = useState(true)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  async function handleTaskSubmit(form) {
    if (editingTask) return updateTask(editingTask.id, form)
    return createTask(form)
  }

  function openEditTask(task) {
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  function openAddTask() {
    setEditingTask(null)
    setTaskDialogOpen(true)
  }

  const doneCount = tasks.filter(t => t.status === 'done').length

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800">
      {/* Phase header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium shrink-0">
            {idx + 1}
          </div>
          <div>
            <div className="text-white font-medium flex items-center gap-2">
              {phase.name}
              <span className="text-slate-500 text-xs font-normal">
                {doneCount}/{tasks.length} tasks
              </span>
            </div>
            {(phase.start_date || phase.end_date) && (
              <div className="text-slate-500 text-xs mt-0.5">
                {[phase.start_date, phase.end_date].filter(Boolean).map(d =>
                  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                ).join(' → ')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${PHASE_STATUS_COLORS[phase.status] ?? PHASE_STATUS_COLORS.pending}`}>
            {phase.status}
          </span>
          <Button variant="outline" size="sm" onClick={() => onEditPhase(phase)} className="border-slate-700 text-slate-400 hover:bg-slate-800 text-xs h-7">
            Edit
          </Button>
          <Button size="sm" onClick={openAddTask} className="bg-indigo-600 hover:bg-indigo-700 text-xs h-7">
            + Task
          </Button>
          <span className="text-slate-500 text-sm ml-1">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Tasks list */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {loading ? (
            <div className="text-slate-500 text-xs py-2">Loading tasks…</div>
          ) : tasks.length === 0 ? (
            <div className="text-slate-600 text-xs py-3 text-center border border-dashed border-slate-700 rounded-lg">
              No tasks yet. Click &quot;+ Task&quot; to add the first one.
            </div>
          ) : (
            tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={updateTask}
                onEdit={openEditTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>
      )}

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={open => { setTaskDialogOpen(open); if (!open) setEditingTask(null) }}
        onSubmit={handleTaskSubmit}
        initial={editingTask}
        users={users}
      />
    </div>
  )
}
