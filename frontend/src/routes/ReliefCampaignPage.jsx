import { AlertCircle, ArrowUpRight, BadgeCheck, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ReliefCampaignCard } from '../components/relief/ReliefCampaignCard'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useCampaign } from '../hooks/useCampaigns'
import { api } from '../lib/api'
import { formatUsd, getReliefTierMeta, RELIEF_PRESET_AMOUNTS } from '../lib/reliefFund'
import { useAuthSession } from '../providers/AuthSessionProvider'

function StatusBanner({ state, donation }) {
  if (!state) return null

  const copy = {
    cancelled: 'Checkout canceled.',
    pending: 'Payment submitted. Waiting for webhook confirmation.',
    completed: `Confirmed ${formatUsd(donation?.amount || 0)}.`,
  }

  return (
    <div className="mt-5 rounded-[20px] border border-cyan-500/20 bg-cyan-500/[0.08] px-4 py-4 text-sm text-cyan-100">
      {copy[state]}
    </div>
  )
}

export default function ReliefCampaignPage() {
  const { campaignId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile, idToken } = useAuthSession()
  const { data: campaign, loading, error, refetch } = useCampaign(campaignId)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [selectedAmount, setSelectedAmount] = useState(RELIEF_PRESET_AMOUNTS[1])
  const [customAmount, setCustomAmount] = useState('')
  const [checkoutPending, setCheckoutPending] = useState(false)
  const [helper, setHelper] = useState('')
  const [donation, setDonation] = useState(null)
  const [statusState, setStatusState] = useState(searchParams.get('checkout') === 'cancelled' ? 'cancelled' : '')
  const [reviewPending, setReviewPending] = useState(false)

  const sessionId = searchParams.get('session_id')
  const donationAmount = customAmount ? Number(customAmount) : selectedAmount
  const tierMeta = useMemo(() => getReliefTierMeta(campaign?.capTier), [campaign?.capTier])
  const isOwner = Boolean(profile?.uid && campaign?.owner?.uid && profile.uid === campaign.owner.uid)
  const isReviewer = profile?.role === 'reviewer'
  const isPrivileged = isOwner || isReviewer
  const reviewBanner =
    campaign?.reviewStatus === 'pending'
      ? 'Review pending.'
      : campaign?.reviewStatus === 'denied'
        ? 'Review denied.'
        : campaign?.reviewStatus === 'approved'
          ? 'Review approved.'
          : ''

  useEffect(() => {
    if (!sessionId) return undefined

    let attempts = 0
    let timer

    const poll = async () => {
      attempts += 1
      try {
        const response = await api.getDonationSession(sessionId)
        setDonation(response)
        if (response.status === 'completed') {
          setStatusState('completed')
          refetch()
          return
        }
        setStatusState('pending')
      } catch (_error) {
        setStatusState('pending')
      }

      if (attempts < 6) {
        timer = window.setTimeout(poll, 1800)
      }
    }

    poll()

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [refetch, sessionId])

  const handleCheckout = async () => {
    setHelper('')

    if (!donationAmount || donationAmount <= 0) {
      setHelper('Choose an amount.')
      return
    }

    setCheckoutPending(true)
    try {
      const response = await api.createCampaignCheckoutSession(campaignId, {
        amount: donationAmount,
        donorName,
        donorEmail,
      })
      window.location.assign(response.url)
    } catch (checkoutError) {
      setHelper(checkoutError?.body?.error || checkoutError.message || 'Checkout did not open.')
      setCheckoutPending(false)
    }
  }

  const handleReviewDecision = async (decision) => {
    setHelper('')
    setReviewPending(true)
    try {
      await api.reviewCampaign(campaignId, { decision }, { token: idToken })
      await refetch()
    } catch (reviewError) {
      setHelper(reviewError?.body?.error || reviewError.message || 'Review could not be saved.')
    } finally {
      setReviewPending(false)
    }
  }

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-[1320px] px-6 py-16 pb-28">
        <Panel className="p-8">
          <div className="flex items-center gap-3 text-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            Loading fund
          </div>
        </Panel>
      </section>
    )
  }

  if (error || !campaign) {
    return (
      <section className="relative z-10 mx-auto max-w-[900px] px-6 py-16 pb-28">
        <Panel className="p-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-cyan-300">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="mt-4 font-display text-[32px] text-white">Fund not found.</div>
          <div className="mt-3 text-text-secondary">Try another support link.</div>
          <div className="mt-6 flex justify-center">
            <Button variant="secondary" onClick={() => navigate('/trending')}>
              Back to feed
            </Button>
          </div>
        </Panel>
      </section>
    )
  }

  return (
    <section className="relative z-10 mx-auto max-w-[1320px] px-6 py-16 pb-28">
      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Panel className="overflow-hidden p-0">
            <div className="relative min-h-[380px]">
              {campaign.event?.previewImage ? (
                <img src={campaign.event.previewImage} alt={campaign.event.title} className="absolute inset-0 h-full w-full object-cover" />
              ) : null}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.16),rgba(5,7,13,0.98))]" />
              <div className="relative flex min-h-[380px] flex-col justify-end p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${tierMeta.surface} ${tierMeta.accent}`}>
                    {tierMeta.label}
                  </div>
                </div>
                <div className="mt-4 font-display text-[42px] font-semibold tracking-tightish text-white">
                  {campaign.title}
                </div>
                <div className="mt-3 max-w-[56ch] text-[15px] leading-7 text-text-secondary">
                  {campaign.description}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">Raised</div>
                    <div className="mt-2 font-display text-[30px] text-white">{formatUsd(campaign.amountRaised)}</div>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">Goal</div>
                    <div className="mt-2 font-display text-[30px] text-white">{formatUsd(campaign.requestedAmount)}</div>
                  </div>
                  <div className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3">
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">Donors</div>
                    <div className="mt-2 font-display text-[30px] text-white">{campaign.donorCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Linked event</div>
                <div className="mt-2 font-display text-[28px] text-white">{campaign.event?.title}</div>
              </div>
              <Button variant="ghost" className="px-4 py-2 text-[11px]" onClick={() => navigate(`/trending?event=${campaign.eventId}`)}>
                View event
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="mt-5">
              <ReliefCampaignCard campaign={campaign} actionLabel="Live" />
            </div>

            {isOwner ? (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-100">
                <BadgeCheck className="h-3.5 w-3.5 text-cyan-400" />
                Creator view
              </div>
            ) : null}
          </Panel>
        </div>

        <Panel className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Give Support</div>
              <h1 className="mt-3 font-display text-[34px] font-semibold tracking-tightish text-white">
                {campaign.goalReached ? 'Goal reached.' : 'Back this fund.'}
              </h1>
            </div>
          </div>

          <StatusBanner state={statusState} donation={donation} />
          {!statusState && reviewBanner ? (
            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-text-secondary">
              {reviewBanner}
            </div>
          ) : null}

          {isPrivileged && campaign.reviewStatus !== 'not_required' ? (
            <div className="mt-5 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Review packet</div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Impact statement</div>
                  <div className="mt-2 text-sm leading-7 text-text-secondary">
                    {campaign.impactStatement || 'No statement provided.'}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">ID type</div>
                  <div className="mt-2 text-sm text-white">
                    {(campaign.identityDocumentType || '').replaceAll('_', ' ') || 'Not provided'}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Proof of impact</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(campaign.proofOfImpactFiles || []).map((file) => (
                      <a
                        key={file.storagePath}
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-100"
                      >
                        {file.name}
                      </a>
                    ))}
                    {!campaign.proofOfImpactFiles?.length ? (
                      <span className="text-sm text-text-secondary">None uploaded.</span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">License or equivalent</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(campaign.identityFiles || []).map((file) => (
                      <a
                        key={file.storagePath}
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-100"
                      >
                        {file.name}
                      </a>
                    ))}
                    {!campaign.identityFiles?.length ? (
                      <span className="text-sm text-text-secondary">None uploaded.</span>
                    ) : null}
                  </div>
                </div>
                {campaign.reviewNotes ? (
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Review note</div>
                    <div className="mt-2 text-sm leading-7 text-text-secondary">{campaign.reviewNotes}</div>
                  </div>
                ) : null}
                {isReviewer && campaign.reviewStatus === 'pending' ? (
                  <div className="flex flex-wrap gap-3 border-t border-white/8 pt-4">
                    <Button
                      onClick={() => handleReviewDecision('approve')}
                      disabled={reviewPending}
                      className="rounded-[18px] px-5 py-3 text-[11px]"
                    >
                      {reviewPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleReviewDecision('deny')}
                      disabled={reviewPending}
                      className="rounded-[18px] border border-red-400/18 bg-red-400/[0.08] px-5 py-3 text-[11px] text-red-100 hover:bg-red-400/[0.14] hover:text-white"
                    >
                      Deny
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {campaign.status === 'active' ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {RELIEF_PRESET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amount)
                      setCustomAmount('')
                    }}
                    className={`rounded-[18px] border px-4 py-4 font-display text-[24px] transition ${
                      !customAmount && selectedAmount === amount
                        ? 'border-cyan-500/35 bg-cyan-500/[0.08] text-white shadow-glow-cyan'
                        : 'border-white/8 bg-white/[0.03] text-text-secondary hover:text-white'
                    }`}
                  >
                    {formatUsd(amount)}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Custom amount</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                    <input
                      type="number"
                      min="1"
                      max={campaign.remainingAmount}
                      value={customAmount}
                      onChange={(event) => setCustomAmount(event.target.value)}
                      className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] py-3 pl-8 pr-4 text-white outline-none transition focus:border-cyan-500/35"
                      placeholder={`${campaign.remainingAmount}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Name</label>
                  <input
                    value={donorName}
                    onChange={(event) => setDonorName(event.target.value)}
                    className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-cyan-500/35"
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Email</label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(event) => setDonorEmail(event.target.value)}
                    className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-cyan-500/35"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">Remaining</div>
                <div className="mt-2 font-display text-[30px] text-white">{formatUsd(campaign.remainingAmount)}</div>
              </div>
            </>
          ) : null}

          {helper ? <div className="mt-5 text-sm leading-7 text-cyan-100">{helper}</div> : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {campaign.status === 'active' ? (
              <Button
                onClick={handleCheckout}
                disabled={checkoutPending || campaign.goalReached}
                className="rounded-[18px] px-5 py-3 text-[11px]"
              >
                {checkoutPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {checkoutPending ? 'Opening checkout' : `Support ${formatUsd(donationAmount || 0)}`}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" className="rounded-[18px] px-5 py-3 text-[11px]" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </Panel>
      </div>
    </section>
  )
}
