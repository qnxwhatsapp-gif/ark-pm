import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './features/auth/AuthContext'
import { useAuth } from './features/auth/useAuth'
import ProtectedRoute from './features/auth/ProtectedRoute'
import LoginPage from './features/auth/LoginPage'
import UsersPage from './features/admin/UsersPage'
import ClientsPage from './features/clients/ClientsPage'
import ClientDetailPage from './features/clients/ClientDetailPage'

const queryClient = new QueryClient()

function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Welcome to Ark Design PM</h1>
      <p className="text-slate-400 mb-6">You are logged in successfully.</p>
      <div className="flex gap-4">
        <a href="/clients" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Clients
        </a>
        <a href="/admin/users" className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Manage Users
        </a>
      </div>
      <p className="text-slate-600 text-sm mt-8">Full dashboard coming in Module 5.</p>
    </div>
  )
}

function SidebarLayout({ children }) {
  const { profile, signOut } = useAuth()

  const navItems = [
    { to: '/', label: '🏠 Dashboard', always: true },
    { to: '/clients', label: '👥 Clients', roles: ['admin', 'principal_architect'] },
    { to: '/admin/users', label: '⚙️ Users', roles: ['admin'] },
  ].filter(item => item.always || item.roles?.includes(profile?.role))

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="text-white font-bold text-lg">Ark Design PM</div>
          <div className="text-slate-500 text-xs mt-0.5 truncate">{profile?.full_name}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={signOut}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function ProtectedWithSidebar({ children, requiredRole }) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <SidebarLayout>{children}</SidebarLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedWithSidebar><DashboardPage /></ProtectedWithSidebar>} />
            <Route path="/clients" element={<ProtectedWithSidebar><ClientsPage /></ProtectedWithSidebar>} />
            <Route path="/clients/:id" element={<ProtectedWithSidebar><ClientDetailPage /></ProtectedWithSidebar>} />
            <Route path="/admin/users" element={<ProtectedWithSidebar requiredRole="admin"><UsersPage /></ProtectedWithSidebar>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
