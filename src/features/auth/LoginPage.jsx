import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

const ROLES = [
  { value: 'admin', label: '🔐 Admin', description: 'Full system access' },
  { value: 'principal_architect', label: '🏛 Principal Architect', description: 'Projects & team management' },
  { value: 'architect', label: '📐 Architect', description: 'Projects & tasks' },
  { value: 'staff_engineer', label: '⚙️ Staff Engineer', description: 'Assigned tasks' },
]

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState('role') // 'role' | 'credentials'
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetSubmitting, setResetSubmitting] = useState(false)

  function handleRoleSelect(role) {
    setSelectedRole(role)
    setStep('credentials')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) { setError(error.message); return }
    navigate('/')
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setResetError('')
    setResetSuccess(false)
    setResetSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setResetSubmitting(false)
    if (error) { setResetError(error.message); return }
    setResetSuccess(true)
    setResetEmail('')
    setTimeout(() => setResetOpen(false), 3000)
  }

  const selectedRoleData = ROLES.find(r => r.value === selectedRole)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-white mb-1">Ark Design PM</div>
          <div className="text-slate-500 text-sm">Architecture Project Management</div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            {step === 'role' ? (
              <CardTitle className="text-white text-base text-center">Select your role to continue</CardTitle>
            ) : (
              <div>
                <button
                  onClick={() => setStep('role')}
                  className="text-slate-500 hover:text-slate-300 text-xs mb-2 flex items-center gap-1"
                >
                  ← Change role
                </button>
                <CardTitle className="text-white text-base">
                  Sign in as {selectedRoleData?.label}
                </CardTitle>
                <p className="text-slate-500 text-xs mt-0.5">{selectedRoleData?.description}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {step === 'role' ? (
              <div className="space-y-2 mt-2">
                {ROLES.map(role => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleSelect(role.value)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 transition-all group"
                  >
                    <div className="text-white text-sm font-medium group-hover:text-indigo-300">{role.label}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{role.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@arkdesign.com"
                    required
                    autoFocus
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <button
                      type="button"
                      onClick={() => setResetOpen(true)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs"
                    >
                      Forgot?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {submitting ? 'Signing in…' : 'Sign In'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label htmlFor="reset-email" className="text-slate-300">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="you@arkdesign.com"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            {resetError && <p className="text-red-400 text-sm">{resetError}</p>}
            {resetSuccess && (
              <div className="bg-emerald-900/20 border border-emerald-800 rounded p-3">
                <p className="text-emerald-400 text-sm">✅ Check your email for a reset link. Expires in 1 hour.</p>
              </div>
            )}
            <Button type="submit" disabled={resetSubmitting || resetSuccess} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {resetSubmitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
