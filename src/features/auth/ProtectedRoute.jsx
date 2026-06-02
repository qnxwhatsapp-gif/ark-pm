import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ProtectedRoute({ children, requiredRole }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading…</div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return children
}
