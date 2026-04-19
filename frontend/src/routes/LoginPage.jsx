import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthEditorialLayout } from '../components/auth/AuthEditorialLayout'
import { LoginForm } from '../components/auth/LoginForm'
import { getReturnPath } from '../lib/authRouting'
import { useAuthSession } from '../providers/AuthSessionProvider'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loading, profile } = useAuthSession()
  const destination = getReturnPath(location.state)

  useEffect(() => {
    if (loading || !isAuthenticated) return

    if (profile?.onboardingCompleted) {
      navigate(destination, { replace: true })
      return
    }

    navigate('/onboarding', { replace: true, state: { from: destination } })
  }, [destination, isAuthenticated, loading, navigate, profile?.onboardingCompleted])

  const redirecting = isAuthenticated

  return (
    <AuthEditorialLayout
      title="Don’t just read the news. Understand its impact."
    >
      {redirecting ? (
        <div className="glass-panel rounded-[32px] border-white/8 bg-[linear-gradient(180deg,rgba(18,24,40,0.92),rgba(9,12,20,0.96))] p-6 text-center sm:p-7">
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Preparing session</div>
            <p className="max-w-[28ch] text-sm leading-7 text-text-secondary">
              Opening your account and syncing your preferences.
            </p>
          </div>
        </div>
      ) : (
        <LoginForm />
      )}
    </AuthEditorialLayout>
  )
}
