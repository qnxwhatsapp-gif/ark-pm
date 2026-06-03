import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let sub = null
    fetchNotifications().then(() => {
      subscribeToRealtime().then(s => { sub = s })
    })
    return () => { if (sub) sub.unsubscribe() }
  }, [])

  async function fetchNotifications() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }

  async function subscribeToRealtime() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    return supabase
      .channel(`notifications:${session.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()
  }

  async function markAsRead(notificationId) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
  }

  async function markAllAsRead() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead }
}
