import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('organization')
    setClients(data ?? [])
    setLoading(false)
  }

  async function createClient(fields) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { error: 'Not authenticated' }
    const { error } = await supabase.from('clients').insert({
      ...fields,
      created_by: session.user.id,
    })
    if (!error) await fetchClients()
    return { error }
  }

  async function updateClient(id, fields) {
    const { error } = await supabase.from('clients').update(fields).eq('id', id)
    if (!error) await fetchClients()
    return { error }
  }

  return { clients, loading, createClient, updateClient }
}

export function useClient(id) {
  const [client, setClient] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchClient()
  }, [id])

  async function fetchClient() {
    setLoading(true)
    const [{ data: clientData }, { data: projectData }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('projects').select('id, name, status, deadline, city, state').eq('client_id', id).order('created_at', { ascending: false }),
    ])
    setClient(clientData ?? null)
    setProjects(projectData ?? [])
    setLoading(false)
  }

  return { client, projects, loading }
}
