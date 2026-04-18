import { formatJoinedAt, makeFallbackImage } from '../../lib/format'
import { LiveDot } from '../ui/LiveDot'
import { Panel } from '../ui/Panel'
import { StatTile } from '../ui/StatTile'

export function ProfileHeader({ user }) {
  const values = user.activity
  const width = 280
  const height = 48
  const padding = 6
  const max = Math.max(...values)
  const min = Math.min(...values)
  const points = values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  const area = `M ${padding},${height - padding} L ${points.replace(/ /g, ' L ')} L ${width - padding},${height - padding} Z`

  return (
    <Panel className="p-8">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center">
          <div className="relative">
            <div className="rounded-full border-2 border-cyan-500/60 p-1 shadow-glow-cyan">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = makeFallbackImage(user.name)
                }}
              />
            </div>
            <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border border-panel bg-void">
              <LiveDot color="green" />
            </span>
          </div>

          <div>
            <div className="font-display text-[24px] font-medium tracking-tightish text-white">{user.name}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
              <span>{user.handle}</span>
              <span>{user.email}</span>
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                {user.role}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{formatJoinedAt(user.joinedAt)}</span>
            </div>
            <div className="mt-6">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">◦ Analyst activity · 14 days</div>
              <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full max-w-[280px] overflow-visible">
                <defs>
                  <linearGradient id="spark-line" x1="0" x2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#spark-fill)" />
                <polyline points={points} fill="none" stroke="url(#spark-line)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid flex-none gap-3 sm:grid-cols-3">
          <StatTile className="min-w-[150px]" label="Saved Events" value={user.stats.savedEvents} compact />
          <StatTile className="min-w-[150px]" label="Events Seen" value={user.stats.eventsSeen} compact />
          <StatTile className="min-w-[150px]" label="Watchlists" value={user.stats.watchlists} compact />
        </div>
      </div>
    </Panel>
  )
}
