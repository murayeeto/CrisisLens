import { ArrowRight, HeartHandshake, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCampaigns } from '../../hooks/useCampaigns'
import { useAuthSession } from '../../providers/AuthSessionProvider'
import { ReliefCampaignCard } from './ReliefCampaignCard'
import { Button } from '../ui/Button'

export function EventReliefFundSection({ event }) {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthSession()
  const { data: campaigns, loading } = useCampaigns({ eventId: event?.id })
  const hasCampaigns = campaigns.length > 0

  const openNeedSupportFlow = () => {
    const destination = `/relief/new?event=${event.id}`
    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { from: destination },
      })
      return
    }
    navigate(destination, {
      state: {
        eventSnapshot: event,
      },
    })
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
          ◦ Relief Fund
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-[12px] text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          Checking active support
        </div>
      ) : null}

      {!loading && hasCampaigns ? (
        <div className="mt-4 space-y-3">
          {campaigns.map((campaign) => (
            <ReliefCampaignCard
              key={campaign.id}
              campaign={campaign}
              compact
              actionLabel={campaigns.length > 1 ? 'Choose' : 'Support'}
            />
          ))}
        </div>
      ) : null}

      {!loading && !hasCampaigns ? (
        <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/[0.08] text-cyan-300">
            <HeartHandshake className="h-4 w-4" />
          </div>
          <div className="mt-3 font-display text-[20px] text-white">No live fund for this event.</div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" className="px-4 py-2 text-[11px]" onClick={openNeedSupportFlow}>
          Need support
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        {campaigns.length === 1 ? (
          <Button
            variant="ghost"
            className="px-4 py-2 text-[11px]"
            onClick={() => navigate(`/relief/${campaigns[0].id}`)}
          >
            Give support
          </Button>
        ) : null}
        {!loading && !hasCampaigns ? (
          <Button
            variant="ghost"
            disabled
            className="border border-white/8 bg-white/[0.02] px-4 py-2 text-[11px] text-text-dim"
          >
            No fund live
          </Button>
        ) : null}
      </div>
    </section>
  )
}
