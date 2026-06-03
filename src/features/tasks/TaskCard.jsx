import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import CommentsPanel from './CommentsPanel'

const PRIORITY_COLORS = {
  low:    'border-slate-500 text-slate-400',
  medium: 'border-yellow-500 text-yellow-400',
  high:   'border-orange-500 text-orange-400',
  urgent: 'border-red-500 text-red-400',
}

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review',      label: 'Review' },
  { value: 'done',        label: 'Done' },
]

export default function TaskCard({ task, onUpdate, onEdit, onDelete }) {
  const [showComments, setShowComments] = useState(false)

  const isOverdue = task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date()

  return (
    <div className={`bg-slate-800/50 rounded-lg border p-3 ${task.status === 'done' ? 'border-slate-700 opacity-60' : 'border-slate-700'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
              {task.title}
            </span>
            <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority] ?? PRIORITY_COLORS.medium}`}>
              {task.priority}
            </Badge>
          </div>
          {task.description && <p className="text-slate-500 text-xs mt-0.5 truncate">{task.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
            {task.users?.full_name && <span>👤 {task.users.full_name}</span>}
            {task.due_date && (
              <span className={isOverdue ? 'text-red-400 font-medium' : ''}>
                📅 {isOverdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
            <button
              onClick={() => setShowComments(s => !s)}
              className="hover:text-slate-300 transition-colors"
            >
              💬 Comments
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Select value={task.status} onValueChange={v => onUpdate(task.id, { status: v })}>
            <SelectTrigger className="h-7 text-xs bg-slate-700 border-slate-600 text-slate-300 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value} className="text-white text-xs">{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="h-7 text-xs border-slate-600 text-slate-400 hover:bg-slate-700 px-2">
            ✏
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(task.id)} className="h-7 text-xs border-slate-600 text-red-400 hover:bg-red-900/20 px-2">
            ✕
          </Button>
        </div>
      </div>
      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <CommentsPanel taskId={task.id} />
        </div>
      )}
    </div>
  )
}
