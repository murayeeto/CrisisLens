import { formatJoinedAt } from '../../lib/format'
import { LiveDot } from '../ui/LiveDot'
import { Panel } from '../ui/Panel'
import { StatTile } from '../ui/StatTile'

export function ProfileHeader({ user }) {
  return (
    <Panel className="p-8">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center">
          <div className="relative">
            <div className="rounded-full border-2 border-cyan-500/60 p-1 shadow-glow-cyan">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.32),rgba(15,23,42,0.9))] font-display text-[32px] font-semibold text-white">
                {user.initials}
              </div>
            </div>
            <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border border-panel bg-void">
              <LiveDot color="green" />
            </span>
          </div>

          <div>
            <div className="mt-2 font-display text-[28px] font-medium tracking-tightish text-white">{user.name}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
              <span>{user.email}</span>
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                {user.role}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">{formatJoinedAt(user.joinedAt)}</span>
            </div>
          </div>
        </div>

        <div className="grid flex-none gap-3 sm:grid-cols-3">
          {user.metrics.map((metric) => (
            <StatTile key={metric.label} className="min-w-[150px]" label={metric.label} value={metric.value} compact />
          ))}
        </div>
      </div>
    </Panel>
  )
}
