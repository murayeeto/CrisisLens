import { useState } from 'react'
import { ArrowRight, Loader } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthSession } from '../../providers/AuthSessionProvider'
import { Button } from '../ui/Button'

export const SignupForm = () => {
  const location = useLocation()
  const { signUp, signInGoogle } = useAuthSession()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  })
  const [helper, setHelper] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setHelper('')

    if (formData.password !== formData.confirmPassword) {
      setHelper('Those passwords do not match yet. Re-enter them and we can keep going.')
      return
    }

    setLoading(true)

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
      })
    } catch (err) {
      setHelper('We could not finish the setup with those details. Try a different email or a stronger password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setHelper('')
    setGoogleLoading(true)

    try {
      await signInGoogle()
    } catch (err) {
      setHelper(err.message || 'Failed to sign in with Google. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="glass-panel rounded-[32px] border-white/8 bg-[linear-gradient(180deg,rgba(18,24,40,0.92),rgba(9,12,20,0.96))] p-6 sm:p-7">
      <div className="border-b border-white/8 pb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Create account</div>
        <h2 className="mt-3 font-display text-[32px] font-semibold tracking-tightish text-white">Create your account.</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">How should we address you?</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            required
            className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-500/35"
            placeholder="Alex Morgan"
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-500/35"
            placeholder="name@company.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-500/35"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Confirm password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-500/35"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full justify-center rounded-[18px] py-3 text-[11px]">
          {loading && <Loader className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating your account' : 'Continue to preferences'}
          {!loading ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>

        {helper ? <p className="text-sm leading-7 text-cyan-100">{helper}</p> : null}
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t border-white/10"></div>
        <span className="text-xs uppercase tracking-[0.12em] text-text-muted">or</span>
        <div className="flex-1 border-t border-white/10"></div>
      </div>

      {/* Google Sign In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full inline-flex items-center justify-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white transition hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-45 text-sm font-medium"
      >
        {googleLoading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.91 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
        )}
        {googleLoading ? 'Signing in...' : 'Sign up with Google'}
      </button>

      <p className="mt-6 text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="text-cyan-300 transition hover:text-white">
          Sign in instead
        </Link>
      </p>
    </div>
  )
}
