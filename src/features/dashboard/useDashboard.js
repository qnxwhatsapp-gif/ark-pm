import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useDashboard(profile) {
  const [stats, setStats] = useState({
    activeProjects: 0,
    tasksDueThisWeek: 0,
    overdueTasks: 0,
    completedThisMonth: 0,
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchDashboard()
  }, [profile?.id, profile?.role])

  async function fetchDashboard() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const todayStr = now.toISOString().split('T')[0]
    const weekStr = weekFromNow.toISOString().split('T')[0]

    const [
      { data: projectsData },
      { data: tasksData },
      { count: overdueCount },
      { count: dueCount },
      { count: completedCount },
      { count: activeCount },
    ] = await Promise.all([
      supabase.from('projects').select('id, name, status, deadline, clients(organization)').eq('status', 'active').order('deadline', { ascending: true, nullsFirst: false }).limit(5),
      supabase.from('tasks').select('id, title, status, priority, due_date, phases(project_id, projects(name))').eq('assigned_to', session.user.id).neq('status', 'done').order('due_date', { ascending: true, nullsFirst: false }).limit(8),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', session.user.id).neq('status', 'done').lt('due_date', todayStr),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', session.user.id).neq('status', 'done').gte('due_date', todayStr).lte('due_date', weekStr),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', session.user.id).eq('status', 'done').gte('completed_at', monthStart),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ])

    setRecentProjects(projectsData ?? [])
    setMyTasks(tasksData ?? [])
    setStats({
      activeProjects: activeCount ?? 0,
      tasksDueThisWeek: dueCount ?? 0,
      overdueTasks: overdueCount ?? 0,
      completedThisMonth: completedCount ?? 0,
    })
    setLoading(false)
  }

  return { stats, recentProjects, myTasks, loading }
}