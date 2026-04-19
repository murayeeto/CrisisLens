import { ArrowUpRight, BadgeCheck, ShieldAlert, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatTimeAgo } from '../../lib/format'
import { formatUsd, getReliefTierMeta } from '../../lib/reliefFund'
import { Panel } from '../ui/Panel'

export function ReliefCampaignCard({ campaign, compact = false, actionLabel = 'Open' }) {
  const navigate = useNavigate()
  const tierMeta = getReliefTierMeta(campaign.capTier)
  const progress = Math.min(
    100,
    campaign.requestedAmountCents ? (campaign.amountRaisedCents / campaign.requestedAmountCents) * 100 : 0,
  )
  const statusLabel =
    campaign.status === 'pending_review'
      ? 'Pending review'
      : campaign.status === 'denied'
        ? 'Denied'
        : campaign.status === 'closed'
          ? 'Closed'
          : null

  return (
    <Panel
      as="button"
      type="button"
      interactive
      spotlight
      onClick={() => navigate(`/relief/${campaign.id}`)}
      className={`w-full overflow-hidden text-left ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">
            {campaign.type}
          </div>
          <h3 className={`mt-2 font-display text-white ${compact ? 'text-[20px]' : 'text-[24px]'}`}>
            {campaign.title}
          </h3>
        </div>
        <div className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${tierMeta.surface} ${tierMeta.accent}`}>
          {tierMeta.label}
        </div>
      </div>

      <p className={`mt-3 text-text-secondary ${compact ? 'line-clamp-2 text-[13px] leading-6' : 'text-[14px] leading-6'}`}>
        {campaign.description}
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-[26px] font-semibold tracking-tightish text-white">
            {formatUsd(campaign.amountRaised)}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">
            {formatUsd(campaign.requestedAmount)}
          </div>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            <Users className="h-3.5 w-3.5" />
            {campaign.donorCount}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
            {formatTimeAgo(campaign.updatedAt, { compact: true })}
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.96),rgba(59,130,246,0.72))]"
          style={{ width: `${Math.max(progress, 4)}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-[11px]">
        <div className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] text-text-muted">
          {campaign.hasProof ? <BadgeCheck className="h-3.5 w-3.5 text-cyan-400" /> : <ShieldAlert className="h-3.5 w-3.5 text-white/60" />}
          {statusLabel || (campaign.hasProof ? 'Proof attached' : 'Basic cap')}
        </div>
        <div className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] text-cyan-300">
          {actionLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Panel>
  )
}
