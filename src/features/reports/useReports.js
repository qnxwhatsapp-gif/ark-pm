import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useReports(filters = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [filters.projectId, filters.status])

  async function fetchReports() {
    setLoading(true)

    let query = supabase
      .from('projects')
      .select(`
        id, name, status, start_date, deadline,
        clients(name, organization),
        phases(
          id, name, status,
          tasks(id, status, priority, assigned_to, due_date, completed_at)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters.projectId) query = query.eq('id', filters.projectId)
    if (filters.status) query = query.eq('status', filters.status)

    const { data: projects } = await query

    const enriched = (projects ?? []).map(project => {
      const allTasks = project.phases?.flatMap(ph => ph.tasks ?? []) ?? []
      const totalTasks = allTasks.length
      const doneTasks = allTasks.filter(t => t.status === 'done').length
      const overdueTasks = allTasks.filter(t =>
        t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()
      ).length
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

      return {
        ...project,
        totalTasks,
        doneTasks,
        overdueTasks,
        progress,
        phaseCount: project.phases?.length ?? 0,
        completedPhases: project.phases?.filter(ph => ph.status === 'completed').length ?? 0,
      }
    })

    setData(enriched)
    setLoading(false)
  }

  return { data, loading }
}

export function useAllProjects() {
  const [projects, setProjects] = useState([])
  useEffect(() => {
    supabase.from('projects').select('id, name').order('name').then(({ data }) => setProjects(data ?? []))
  }, [])
  return projects
}
