import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*, clients(name, organization)')
      .order('created_at', { ascending: false })
    setProjects(data ?? [])
    setLoading(false)
  }

  async function createProject(fields) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }
    const { error } = await supabase.from('projects').insert({
      ...fields,
      created_by: session.user.id,
    })
    if (!error) await fetchProjects()
    return { error }
  }

  async function updateProject(id, fields) {
    const { error } = await supabase.from('projects').update(fields).eq('id', id)
    if (!error) await fetchProjects()
    return { error }
  }

  return { projects, loading, createProject, updateProject }
}

export function useProject(id) {
  const [project, setProject] = useState(null)
  const [phases, setPhases] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchProject()
  }, [id])

  async function fetchProject() {
    setLoading(true)
    const [{ data: projectData }, { data: phaseData }, { data: memberData }] = await Promise.all([
      supabase.from('projects').select('*, clients(name, organization)').eq('id', id).single(),
      supabase.from('phases').select('*').eq('project_id', id).order('order_index'),
      supabase.from('project_members').select('*, users(id, full_name, role)').eq('project_id', id),
    ])
    setProject(projectData ?? null)
    setPhases(phaseData ?? [])
    setMembers(memberData ?? [])
    setLoading(false)
  }

  async function addPhase(fields) {
    const nextIndex = phases.length
    const { error } = await supabase.from('phases').insert({
      ...fields,
      project_id: id,
      order_index: nextIndex,
    })
    if (!error) await fetchProject()
    return { error }
  }

  async function updatePhase(phaseId, fields) {
    const { error } = await supabase.from('phases').update(fields).eq('id', phaseId)
    if (!error) await fetchProject()
    return { error }
  }

  async function addMember(userId, roleInProject = 'member') {
    const { error } = await supabase.from('project_members').insert({
      project_id: id,
      user_id: userId,
      role_in_project: roleInProject,
    })
    if (!error) await fetchProject()
    return { error }
  }

  async function removeMember(userId) {
    const { error } = await supabase.from('project_members').delete()
      .eq('project_id', id).eq('user_id', userId)
    if (!error) await fetchProject()
    return { error }
  }

  return { project, phases, members, loading, fetchProject, addPhase, updatePhase, addMember, removeMember }
}
