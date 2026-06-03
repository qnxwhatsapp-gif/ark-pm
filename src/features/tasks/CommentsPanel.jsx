import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTaskComments } from './useTasks'
import { useAuth } from '@/features/auth/useAuth'

export default function CommentsPanel({ taskId }) {
  const { comments, loading, addComment } = useTaskComments(taskId)
  const { profile } = useAuth()
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    await addComment(body.trim())
    setBody('')
    setSubmitting(false)
  }

  if (loading) return <div className="text-slate-500 text-xs">Loading comments…</div>

  return (
    <div className="space-y-2">
      {comments.length === 0 && <p className="text-slate-600 text-xs">No comments yet.</p>}
      {comments.map(c => (
        <div key={c.id} className="text-xs">
          <span className="text-indigo-400 font-medium">{c.users?.full_name ?? 'Unknown'}</span>
          <span className="text-slate-600 ml-1.5">
            {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
          <p className="text-slate-400 mt-0.5">{c.body}</p>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <Input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="bg-slate-700 border-slate-600 text-white text-xs h-7 flex-1"
        />
        <Button type="submit" disabled={submitting || !body.trim()} className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 px-3">
          Send
        </Button>
      </form>
    </div>
  )
}
