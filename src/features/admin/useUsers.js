import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('full_name')
    setUsers(data ?? [])
    setLoading(false)
  }

  async function createUser({ email, password, full_name, role }) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email, password, full_name, role }),
      }
    )
    const json = await res.json()
    if (json.error) return { error: json.error }
    await fetchUsers()
    return { error: null }
  }

  async function updateUser(id, updates) {
    const { error } = await supabase.from('users').update(updates).eq('id', id)
    if (!error) await fetchUsers()
    return { error }
  }

  return { users, loading, createUser, updateUser }
}
