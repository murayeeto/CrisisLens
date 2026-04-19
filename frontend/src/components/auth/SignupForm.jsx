import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signup } from '../../lib/firebaseAuth'
import { AlertCircle, Loader } from 'lucide-react'

export const SignupForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await signup(formData.email, formData.password, formData.displayName)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="glass-panel border border-red-500/20 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Full Name</label>
          <input
            type="text"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            required
            className="w-full glass-panel rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="John Doe"
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
            className="w-full glass-panel rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="your@email.com"
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
            className="w-full glass-panel rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full glass-panel rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {loading && <Loader className="h-4 w-4 animate-spin" />}
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-white/60">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-cyan-400 hover:text-cyan-300"
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  )
}
