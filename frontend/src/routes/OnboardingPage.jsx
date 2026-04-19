import { ArrowRight, Loader } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { PreferenceEditor } from '../components/auth/PreferenceEditor'
import { Button } from '../components/ui/Button'
import { getReturnPath } from '../lib/authRouting'
import { useAuthSession } from '../providers/AuthSessionProvider'

export default function OnboardingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, loading, profile, updateAccount } = useAuthSession()
  const [localPreferences, setLocalPreferences] = useState({
    countries: profile?.preferences?.countries ?? [],
    categories: profile?.preferences?.categories ?? [],
  })
  const [helper, setHelper] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalPreferences({
      countries: profile?.preferences?.countries ?? [],
      categories: profile?.preferences?.categories ?? [],
    })
  }, [profile?.preferences?.categories, profile?.preferences?.countries])

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: getReturnPath(location.state) }} />
  }

  if (!loading && profile?.onboardingCompleted) {
    return <Navigate to={getReturnPath(location.state)} replace />
  }

  const handleContinue = async () => {
    if (!localPreferences.countries.length && !localPreferences.categories.length) {
      setHelper('Pick at least one country or one signal type so we can tune the watchlist with something real.')
      return
    }

    setHelper('')
    setSaving(true)

    try {
      await updateAccount({
        preferences: localPreferences,
        onboardingCompleted: true,
      })
      navigate(getReturnPath(location.state), { replace: true })
    } catch (_error) {
      setHelper('We could not save those preferences on the first try. Give it another moment and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
      <div className="w-full max-w-[760px]">
        <div className="glass-panel rounded-[32px] border-white/8 bg-[linear-gradient(180deg,rgba(18,24,40,0.92),rgba(9,12,20,0.96))] p-6 sm:p-8">
          <div className="border-b border-white/8 pb-5">
            <div className="font-display text-[30px] font-semibold tracking-tightish text-white sm:text-[36px]">Choose your focus</div>
          </div>

          <div className="mt-6">
            <PreferenceEditor
              value={localPreferences}
              onChange={setLocalPreferences}
              helper={helper}
              compact
              countryLabel="Countries"
              categoryLabel="Topics"
              disabled={saving}
            />
          </div>

          <div className="mt-8 flex justify-end">
            <Button type="button" onClick={handleContinue} disabled={saving} className="justify-center rounded-[18px] px-5 py-3 text-[11px]">
              {saving ? <Loader className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving' : 'Continue'}
              {!saving ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
