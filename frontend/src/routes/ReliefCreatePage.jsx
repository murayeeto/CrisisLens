import { Loader2, UploadCloud } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Panel } from '../components/ui/Panel'
import { useEventDetail } from '../hooks/useEventDetail'
import { api } from '../lib/api'
import { uploadCampaignProofFiles } from '../lib/firebaseStorage'
import { BASIC_RELIEF_CAP, VERIFIED_RELIEF_CAP, buildReliefCampaignId, formatUsd } from '../lib/reliefFund'
import { useAuthSession } from '../providers/AuthSessionProvider'

function InputLabel({ children, aside }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm font-medium text-white">{children}</label>
      {aside ? <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">{aside}</span> : null}
    </div>
  )
}

export default function ReliefCreatePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, idToken, isAuthenticated, loading } = useAuthSession()
  const eventId = searchParams.get('event')
  const campaignId = useMemo(() => buildReliefCampaignId(), [])
  const { data: event, loading: eventLoading } = useEventDetail(eventId)
  const [form, setForm] = useState({
    type: 'personal',
    title: '',
    description: '',
    requestedAmount: '300',
  })
  const [proofFiles, setProofFiles] = useState([])
  const [identityFiles, setIdentityFiles] = useState([])
  const [helper, setHelper] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [impactStatement, setImpactStatement] = useState('')
  const [identityDocumentType, setIdentityDocumentType] = useState('driver_license')

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  const requestedAmount = Number(form.requestedAmount || 0)
  const requiresProof = requestedAmount > BASIC_RELIEF_CAP
  const activeEvent = event || location.state?.eventSnapshot || null
  const eventTitle = activeEvent?.title || (eventLoading ? 'Loading event' : 'Selected event')
  const eventLocation = [activeEvent?.location, activeEvent?.region, activeEvent?.country].filter(Boolean).join(' • ')

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (eventSubmission) => {
    eventSubmission.preventDefault()
    setHelper('')

    if (!eventId) {
      setHelper('Pick an event first.')
      return
    }

    if (requestedAmount <= 0) {
      setHelper('Set a goal.')
      return
    }

    if (requestedAmount > VERIFIED_RELIEF_CAP) {
      setHelper(`Keep it at ${formatUsd(VERIFIED_RELIEF_CAP)} or less.`)
      return
    }

    setSubmitting(true)

    try {
      let uploadedProofFiles = []
      let uploadedIdentityFiles = []

      if (requiresProof) {
        if (!impactStatement.trim()) {
          setHelper('Add an impact statement for review.')
          setSubmitting(false)
          return
        }
        if (!proofFiles.length) {
          setHelper('Upload proof of impact.')
          setSubmitting(false)
          return
        }
        if (!identityFiles.length) {
          setHelper('Upload a license or equivalent ID.')
          setSubmitting(false)
          return
        }

        uploadedProofFiles = await uploadCampaignProofFiles({
          uid: user.uid || profile?.uid,
          campaignId,
          files: proofFiles,
          bucket: 'impact',
        })
        uploadedIdentityFiles = await uploadCampaignProofFiles({
          uid: user.uid || profile?.uid,
          campaignId,
          files: identityFiles,
          bucket: 'identity',
        })
      }

      const campaign = await api.createCampaign(
        {
          campaignId,
          eventId,
          event: activeEvent,
          type: form.type,
          title: form.title,
          description: form.description,
          requestedAmount,
          impactStatement,
          identityDocumentType,
          proofOfImpactFiles: uploadedProofFiles,
          identityFiles: uploadedIdentityFiles,
        },
        { token: idToken },
      )

      navigate(`/relief/${campaign.id}`, { replace: true })
    } catch (error) {
      setHelper(error?.body?.error || error.message || 'Could not open the fund yet.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="relative z-10 mx-auto max-w-[1100px] px-6 py-16 pb-28">
      <Panel className="overflow-hidden p-0">
        <div className="relative min-h-[280px] overflow-hidden border-b border-white/8">
          {activeEvent?.previewImage ? (
            <img src={activeEvent.previewImage} alt={eventTitle} className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.2),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.16),transparent_32%),linear-gradient(135deg,rgba(5,7,13,0.98),rgba(7,18,27,0.92))]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,13,0.08),rgba(5,7,13,0.9))]" />

          <div className="relative flex min-h-[280px] flex-col justify-end p-6 sm:p-8">
            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">
              Need Support
            </div>
            <div className="mt-4 max-w-[18ch] font-display text-[34px] font-semibold tracking-tightish text-white sm:text-[42px]">
              {eventTitle}
            </div>
            {eventLocation ? (
              <div className="mt-3 max-w-[52ch] text-[13px] uppercase tracking-[0.14em] text-text-secondary">
                {eventLocation}
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Relief Fund</div>
              <h1 className="mt-3 font-display text-[32px] font-semibold tracking-tightish text-white sm:text-[38px]">
                Request support.
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <InputLabel>Who needs support?</InputLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {['personal', 'family'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange('type', type)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      form.type === type
                        ? 'border-cyan-500/35 bg-cyan-500/[0.08] shadow-glow-cyan'
                        : 'border-white/8 bg-white/[0.03] text-text-secondary hover:text-white'
                    }`}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em]">
                      {type === 'personal' ? "I'm impacted" : 'My family is impacted'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <div className="space-y-2">
                  <InputLabel>Title</InputLabel>
                  <input
                    value={form.title}
                    onChange={(currentEvent) => handleChange('title', currentEvent.target.value)}
                    maxLength={90}
                    required
                    className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-cyan-500/35"
                    placeholder="Stay, transport, essentials"
                  />
                </div>

                <div className="space-y-2">
                  <InputLabel aside="280 max">Short note</InputLabel>
                  <textarea
                    value={form.description}
                    onChange={(currentEvent) => handleChange('description', currentEvent.target.value)}
                    maxLength={280}
                    required
                    rows={4}
                    className="w-full resize-none rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-cyan-500/35"
                    placeholder="What do you need right now?"
                  />
                </div>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-5">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Goal</div>
                <div className="mt-4 relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                  <input
                    type="number"
                    min="1"
                    max={VERIFIED_RELIEF_CAP}
                    value={form.requestedAmount}
                    onChange={(currentEvent) => handleChange('requestedAmount', currentEvent.target.value)}
                    required
                    className="w-full rounded-[18px] border border-white/10 bg-black/20 py-3 pl-8 pr-4 text-white outline-none transition focus:border-cyan-500/35"
                  />
                </div>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
                  Up to {formatUsd(requiresProof ? VERIFIED_RELIEF_CAP : BASIC_RELIEF_CAP)}
                </div>
                <div className="mt-6 h-px bg-white/8" />
                <div className="mt-6 text-sm leading-7 text-text-secondary">
                  {requiresProof ? 'Proof and ID will be reviewed before this goes live.' : 'This can go live as soon as you submit.'}
                </div>
              </div>
            </div>

            <div className={`rounded-[22px] border p-4 ${requiresProof ? 'border-cyan-500/20 bg-cyan-500/[0.06]' : 'border-white/8 bg-white/[0.03]'}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">Review packet</div>
                  <div className="mt-2 text-sm text-text-secondary">
                    {requiresProof ? 'Required for review above $500.' : 'Not needed up to $500.'}
                  </div>
                </div>
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-cyan-300">
                  <UploadCloud className="h-4 w-4" />
                </div>
              </div>

              {requiresProof ? (
                <div className="mt-5 space-y-5">
                  <div className="space-y-2">
                    <InputLabel aside="Required">Impact statement</InputLabel>
                    <textarea
                      value={impactStatement}
                      onChange={(currentEvent) => setImpactStatement(currentEvent.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-white outline-none transition focus:border-cyan-500/35"
                      placeholder="Explain how this event directly affected you or your family."
                    />
                  </div>

                  <div className="space-y-2">
                    <InputLabel aside="Required">Proof of impact</InputLabel>
                    <label className="flex cursor-pointer items-center justify-center rounded-[18px] border border-dashed border-white/12 bg-black/15 px-4 py-5 text-center text-sm text-text-secondary transition hover:border-cyan-500/25 hover:text-white">
                      <input
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={(currentEvent) => setProofFiles(Array.from(currentEvent.target.files || []))}
                      />
                      Upload proof
                    </label>
                    {proofFiles.length ? (
                      <div className="flex flex-wrap gap-2">
                        {proofFiles.map((file) => (
                          <div
                            key={`${file.name}-${file.size}`}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80"
                          >
                            {file.name}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <InputLabel aside="Required">ID type</InputLabel>
                    <select
                      value={identityDocumentType}
                      onChange={(currentEvent) => setIdentityDocumentType(currentEvent.target.value)}
                      className="w-full rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-white outline-none transition focus:border-cyan-500/35"
                    >
                      <option value="driver_license">Driver license</option>
                      <option value="state_id">State ID</option>
                      <option value="passport">Passport</option>
                      <option value="government_id">Government ID</option>
                      <option value="other">Other equivalent</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <InputLabel aside="Required">License or equivalent</InputLabel>
                    <label className="flex cursor-pointer items-center justify-center rounded-[18px] border border-dashed border-white/12 bg-black/15 px-4 py-5 text-center text-sm text-text-secondary transition hover:border-cyan-500/25 hover:text-white">
                      <input
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={(currentEvent) => setIdentityFiles(Array.from(currentEvent.target.files || []))}
                      />
                      Upload ID
                    </label>
                    {identityFiles.length ? (
                      <div className="flex flex-wrap gap-2">
                        {identityFiles.map((file) => (
                          <div
                            key={`${file.name}-${file.size}`}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80"
                          >
                            {file.name}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-text-secondary">
                    After you submit, this request stays pending until a reviewer accepts or denies it.
                  </div>
                </div>
              ) : null}
            </div>

            {helper ? <div className="text-sm leading-7 text-cyan-100">{helper}</div> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting || eventLoading} className="rounded-[18px] px-5 py-3 text-[11px]">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? 'Sending' : requiresProof ? 'Submit request' : 'Open support'}
              </Button>
              <Button type="button" variant="ghost" className="rounded-[18px] px-5 py-3 text-[11px]" onClick={() => navigate(-1)}>
                Back
              </Button>
            </div>
          </form>
        </div>
      </Panel>
    </section>
  )
}
