import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './features/auth/AuthContext'
import { useAuth } from './features/auth/useAuth'
import ProtectedRoute from './features/auth/ProtectedRoute'
import LoginPage from './features/auth/LoginPage'
import UsersPage from './features/admin/UsersPage'
import ClientsPage from './features/clients/ClientsPage'
import ClientDetailPage from './features/clients/ClientDetailPage'
import ProjectsPage from './features/projects/ProjectsPage'
import ProjectDetailPage from './features/projects/ProjectDetailPage'
import MyTasksPage from './features/tasks/MyTasksPage'
import DashboardPage from './features/dashboard/DashboardPage'

const queryClient = new QueryClient()

function SidebarLayout({ children }) {
  const { profile, signOut } = useAuth()

  const navItems = [
    { to: '/', label: '🏠 Dashboard', always: true },
    { to: '/tasks', label: '✅ My Tasks', roles: ['admin', 'principal_architect', 'architect', 'staff_engineer'] },
    { to: '/projects', label: '📁 Projects', roles: ['admin', 'principal_architect', 'architect', 'staff_engineer'] },
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
            <Route path="/projects" element={<ProtectedWithSidebar><ProjectsPage /></ProtectedWithSidebar>} />
            <Route path="/projects/:id" element={<ProtectedWithSidebar><ProjectDetailPage /></ProtectedWithSidebar>} />
            <Route path="/tasks" element={<ProtectedWithSidebar><MyTasksPage /></ProtectedWithSidebar>} />
            <Route path="/admin/users" element={<ProtectedWithSidebar requiredRole="admin"><UsersPage /></ProtectedWithSidebar>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
