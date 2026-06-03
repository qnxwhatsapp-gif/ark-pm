import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function usePhaseTasks(phaseId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!phaseId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, users!tasks_assigned_to_fkey(id, full_name)')
      .eq('phase_id', phaseId)
      .order('created_at')
    setTasks(data ?? [])
    setLoading(false)
  }, [phaseId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createTask(fields) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }
    const { error } = await supabase.from('tasks').insert({
      ...fields,
      phase_id: phaseId,
      created_by: session.user.id,
      due_date: fields.due_date || null,
      assigned_to: fields.assigned_to || null,
    })
    if (!error) await fetchTasks()
    return { error }
  }

  async function updateTask(taskId, fields) {
    const payload = { ...fields }
    if ('due_date' in payload) payload.due_date = payload.due_date || null
    if ('assigned_to' in payload) payload.assigned_to = payload.assigned_to || null
    if (fields.status === 'done') payload.completed_at = new Date().toISOString()
    else if ('status' in fields) payload.completed_at = null
    const { error } = await supabase.from('tasks').update(payload).eq('id', taskId)
    if (!error) await fetchTasks()
    return { error }
  }

  async function deleteTask(taskId) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (!error) await fetchTasks()
    return { error }
  }

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: fetchTasks }
}

export function useMyTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchMyTasks() }, [])

  async function fetchMyTasks() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*, phases(id, name, project_id, projects(id, name))')
      .eq('assigned_to', session.user.id)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  return { tasks, loading, refetch: fetchMyTasks }
}

export function useTaskComments(taskId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!taskId) return
    fetchComments()
  }, [taskId])

  async function fetchComments() {
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .select('*, users(id, full_name)')
      .eq('task_id', taskId)
      .order('created_at')
    setComments(data ?? [])
    setLoading(false)
  }

  async function addComment(body) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }
    const { error } = await supabase.from('comments').insert({
      task_id: taskId,
      user_id: session.user.id,
      body,
    })
    if (!error) await fetchComments()
    return { error }
  }

  return { comments, loading, addComment }
}
