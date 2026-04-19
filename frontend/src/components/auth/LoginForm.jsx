import { useState } from 'react'
import { ArrowRight, Loader } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthSession } from '../../providers/AuthSessionProvider'
import { Button } from '../ui/Button'

export const LoginForm = () => {
  const location = useLocation()
  const { signIn } = useAuthSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [helper, setHelper] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setHelper('')
    setLoading(true)

    try {
      await signIn({ email, password })
    } catch (err) {
      setHelper("That combination didn't work yet. Check the email and password, then try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel rounded-[32px] border-white/8 bg-[linear-gradient(180deg,rgba(18,24,40,0.92),rgba(9,12,20,0.96))] p-6 sm:p-7">
      <div className="border-b border-white/8 pb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Sign in</div>
        <h2 className="mt-3 font-display text-[32px] font-semibold tracking-tightish text-white">Welcome back.</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Work email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-500/35"
            placeholder="name@company.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-white">Password</label>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Case sensitive</span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-500/35"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full justify-center rounded-[18px] py-3 text-[11px]">
          {loading && <Loader className="h-4 w-4 animate-spin" />}
          {loading ? 'Opening your account' : 'Continue to account'}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>

        {helper ? <p className="text-sm leading-7 text-cyan-100">{helper}</p> : null}

        <p className="text-sm text-text-secondary">
          New here?{' '}
          <Link to="/signup" state={location.state} className="text-cyan-300 transition hover:text-white">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}
