import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetSubmitting, setResetSubmitting] = useState(false)

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
    if (error) {
      setResetError(error.message)
      return
    }

    setResetSuccess(true)
    setResetEmail('')
    setTimeout(() => setResetOpen(false), 3000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-sm bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-center text-xl">Ark Design PM</CardTitle>
          <p className="text-slate-400 text-center text-sm mt-1">Sign in to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@arkdesign.com"
                required
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
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>

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
                <p className="text-emerald-400 text-sm">
                  ✅ Check your email for a password reset link. It will expire in 1 hour.
                </p>
              </div>
            )}
            <Button
              type="submit"
              disabled={resetSubmitting || resetSuccess}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {resetSubmitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
