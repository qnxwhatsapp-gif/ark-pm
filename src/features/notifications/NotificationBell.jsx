import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from './useNotifications'

const TYPE_ICONS = {
  task_assigned: '📋',
  deadline_soon: '⏰',
  status_changed: '🔄',
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const recent = notifications.slice(0, 5)

  function handleClick(notification) {
    if (!notification.is_read) markAsRead(notification.id)
    if (notification.link) navigate(notification.link)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-10 left-0 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
              <span className="text-white text-sm font-medium">Notifications</span>
              <button
                onClick={() => { navigate('/notifications'); setOpen(false) }}
                className="text-indigo-400 text-xs hover:text-indigo-300"
              >
                View all
              </button>
            </div>
            {recent.length === 0 ? (
              <div className="px-3 py-4 text-slate-500 text-xs text-center">No notifications</div>
            ) : (
              <div className="divide-y divide-slate-700">
                {recent.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-slate-700/50 transition-colors ${!n.is_read ? 'bg-indigo-900/20' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">{TYPE_ICONS[n.type] ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${n.is_read ? 'text-slate-400' : 'text-slate-200'}`}>
                          {n.message}
                        </p>
                        <p className="text-slate-600 text-xs mt-0.5">
                          {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
