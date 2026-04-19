import { Navigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '../../providers/AuthSessionProvider'
import { Panel } from '../ui/Panel'

export function RequireAccountAccess({ children }) {
  const location = useLocation()
  const { isAuthenticated, loading, profile } = useAuthSession()
  const from = `${location.pathname}${location.search}`

  if (loading || (isAuthenticated && !profile)) {
    return (
      <section className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-6 py-16">
        <Panel className="w-full max-w-[420px] p-8 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-400">Preparing your account</div>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            We&apos;re syncing your session and preferences so the account view opens in the right place.
          </p>
        </Panel>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from }} />
  }

  if (profile && !profile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace state={{ from }} />
  }

  return children
}
