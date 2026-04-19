import { LogOut, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PreferenceEditor } from '../components/auth/PreferenceEditor'
import { ReliefCampaignCard } from '../components/relief/ReliefCampaignCard'
import { ProfileHeader } from '../components/user/ProfileHeader'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useCampaignReviewQueue, useMyCampaigns } from '../hooks/useCampaigns'
import { api } from '../lib/api'
import { useAuthSession } from '../providers/AuthSessionProvider'

function buildInitials(name = 'CrisisLens Member') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function AccountPage() {
  const navigate = useNavigate()
  const { profile, idToken, updateAccount, signOut } = useAuthSession()
  const [preferencesDraft, setPreferencesDraft] = useState({ countries: [], categories: [] })
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [preferencesHelper, setPreferencesHelper] = useState('')
  const [reviewActionId, setReviewActionId] = useState('')
  const [reviewHelper, setReviewHelper] = useState('')
  const { data: campaigns, loading: campaignsLoading } = useMyCampaigns(idToken)
  const { data: reviewQueue, loading: reviewQueueLoading, refetch: refetchReviewQueue } = useCampaignReviewQueue(
    profile?.role === 'reviewer' ? idToken : null,
  )

  useEffect(() => {
    setPreferencesDraft({
      countries: profile?.preferences?.countries ?? [],
      categories: profile?.preferences?.categories ?? [],
    })
  }, [profile?.preferences?.categories, profile?.preferences?.countries])

  const preferencesChanged =
    JSON.stringify(preferencesDraft) !==
    JSON.stringify({
      countries: profile?.preferences?.countries ?? [],
      categories: profile?.preferences?.categories ?? [],
    })

  const accountUser = useMemo(() => {
    const name = profile?.displayName || profile?.email?.split('@')[0] || 'CrisisLens Member'

    return {
      name,
      initials: buildInitials(name),
      email: profile?.email || 'No email available',
      role: profile?.role === 'reviewer' ? 'Reviewer' : 'Member',
      joinedAt: profile?.createdAt || new Date().toISOString(),
      metrics: [
        { label: 'Saved', value: profile?.savedEvents?.length ?? 0 },
        { label: 'Countries', value: preferencesDraft.countries.length },
        { label: 'Topics', value: preferencesDraft.categories.length },
      ],
    }
  }, [preferencesDraft.categories.length, preferencesDraft.countries.length, profile?.createdAt, profile?.displayName, profile?.email, profile?.role, profile?.savedEvents?.length])

  const handleSavePreferences = async () => {
    setSavingPreferences(true)
    setPreferencesHelper('')

    try {
      await updateAccount({
        preferences: preferencesDraft,
        onboardingCompleted: true,
      })
      setPreferencesHelper('Saved.')
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setPreferencesHelper('Could not save. Try again.')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const handleReview = async (campaignId, decision) => {
    setReviewHelper('')
    setReviewActionId(campaignId)
    try {
      await api.reviewCampaign(campaignId, { decision }, { token: idToken })
      await refetchReviewQueue()
    } catch (error) {
      setReviewHelper(error?.body?.error || error.message || 'Could not save review.')
    } finally {
      setReviewActionId('')
    }
  }

  return (
    <section className="relative z-10 mx-auto max-w-[1280px] px-6 py-16 pb-28">
      <div className="max-w-[780px]">
        <h1 className="font-display text-[42px] font-semibold tracking-snug text-white md:text-[54px]">Account</h1>
      </div>

      <div className="mt-8">
        <ProfileHeader user={accountUser} />
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-6 md:p-7">
          <h2 className="font-display text-[30px] font-semibold tracking-tightish text-white md:text-[36px]">Preferences</h2>

          <div className="mt-6">
            <PreferenceEditor
              value={preferencesDraft}
              onChange={setPreferencesDraft}
              helper={preferencesHelper}
              compact
              countryLabel="Countries"
              categoryLabel="Topics"
              disabled={savingPreferences}
            />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">{preferencesChanged ? 'Unsaved changes' : 'Saved'}</p>
            <Button
              type="button"
              onClick={handleSavePreferences}
              disabled={!preferencesChanged || savingPreferences}
              className="justify-center rounded-[18px] px-5 py-3 text-[11px]"
            >
              {savingPreferences ? 'Saving changes' : 'Save preferences'}
            </Button>
          </div>
        </Panel>

        <Panel className="p-6 md:p-7">
          <h2 className="font-display text-[30px] font-semibold tracking-tightish text-white md:text-[36px]">Account details</h2>
          <div className="mt-6 space-y-4 text-sm text-text-secondary">
            <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">Email</div>
              <div className="mt-2 text-white">{accountUser.email}</div>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">Joined</div>
              <div className="mt-2 text-white">{accountUser.joinedAt ? new Date(accountUser.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}</div>
            </div>
          </div>

          <div className="mt-8">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-center rounded-[18px] border border-red-400/18 bg-red-400/[0.08] px-5 py-3 text-[11px] text-red-100 hover:bg-red-400/[0.14] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </Panel>
      </div>

      <div className="mt-8">
        <Panel className="p-6 md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Relief Fund</div>
              <h2 className="mt-3 font-display text-[30px] font-semibold tracking-tightish text-white md:text-[36px]">
                Your campaigns
              </h2>
            </div>
            <Button variant="ghost" className="rounded-[18px] px-5 py-3 text-[11px]" onClick={() => navigate('/trending')}>
              Open feed
            </Button>
          </div>

          {campaignsLoading ? (
            <div className="mt-6 text-sm text-text-secondary">Loading campaigns…</div>
          ) : null}

          {!campaignsLoading && campaigns.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {campaigns.map((campaign) => (
                <ReliefCampaignCard key={campaign.id} campaign={campaign} actionLabel="View" />
              ))}
            </div>
          ) : null}

          {!campaignsLoading && !campaigns.length ? (
            <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-5">
              <div className="font-display text-[22px] text-white">No active funds yet.</div>
              <div className="mt-2 text-sm leading-7 text-text-secondary">
                Open any event and start one when needed.
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      {profile?.role === 'reviewer' ? (
        <div className="mt-8">
          <Panel className="p-6 md:p-7">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Relief Fund</div>
              <h2 className="mt-3 font-display text-[30px] font-semibold tracking-tightish text-white md:text-[36px]">
                Review queue
              </h2>
            </div>

            {reviewQueueLoading ? <div className="mt-6 text-sm text-text-secondary">Loading requests…</div> : null}
            {reviewHelper ? <div className="mt-4 text-sm text-cyan-100">{reviewHelper}</div> : null}

            {!reviewQueueLoading && reviewQueue.length ? (
              <div className="mt-6 space-y-4">
                {reviewQueue.map((campaign) => (
                  <div key={campaign.id} className="space-y-3 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <ReliefCampaignCard campaign={campaign} actionLabel="Inspect" />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleReview(campaign.id, 'approve')}
                        disabled={reviewActionId === campaign.id}
                        className="rounded-[18px] px-5 py-3 text-[11px]"
                      >
                        {reviewActionId === campaign.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleReview(campaign.id, 'deny')}
                        disabled={reviewActionId === campaign.id}
                        className="rounded-[18px] border border-red-400/18 bg-red-400/[0.08] px-5 py-3 text-[11px] text-red-100 hover:bg-red-400/[0.14] hover:text-white"
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!reviewQueueLoading && !reviewQueue.length ? (
              <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-5">
                <div className="font-display text-[22px] text-white">No pending requests.</div>
              </div>
            ) : null}
          </Panel>
        </div>
      ) : null}
    </section>
  )
}
