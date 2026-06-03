import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useNotifications } from './useNotifications'

const TYPE_ICONS = {
  task_assigned: '📋',
  deadline_soon: '⏰',
  status_changed: '🔄',
}

const TYPE_LABELS = {
  task_assigned: 'Task Assigned',
  deadline_soon: 'Deadline Soon',
  status_changed: 'Status Changed',
}

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()

  function handleClick(n) {
    if (!n.is_read) markAsRead(n.id)
    if (n.link) navigate(n.link)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading notifications…</div>

  return (
    <div className="p-8 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {notifications.length} item{notifications.length !== 1 ? 's' : ''}
            {unreadCount > 0 && <span className="text-indigo-400 ml-2">· {unreadCount} unread</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🔔</div>
          <div className="text-slate-500">No notifications yet.</div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {notifications.map((n, idx) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex items-start gap-4 px-5 py-4 hover:bg-slate-800/50 transition-colors ${idx < notifications.length - 1 ? 'border-b border-slate-800' : ''} ${!n.is_read ? 'bg-indigo-900/10' : ''}`}
            >
              <div className="text-xl mt-0.5 shrink-0">{TYPE_ICONS[n.type] ?? '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm ${n.is_read ? 'text-slate-400' : 'text-white font-medium'}`}>
                    {n.message}
                  </span>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>{TYPE_LABELS[n.type] ?? n.type}</span>
                  <span>·</span>
                  <span>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
