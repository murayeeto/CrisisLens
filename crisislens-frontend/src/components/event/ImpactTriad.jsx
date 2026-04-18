import { Building2, TrendingUp, Users } from 'lucide-react'
import { Panel } from '../ui/Panel'
import { getSeverityConfig } from '../../lib/severity'

const cards = [
  { key: 'people', label: 'Impact on People', icon: Users },
  { key: 'infrastructure', label: 'Infrastructure', icon: Building2 },
  { key: 'markets', label: 'Markets', icon: TrendingUp },
]

export function ImpactTriad({ impacts, severity }) {
  const config = getSeverityConfig(severity)

  return (
    <div className="space-y-3">
      {cards.map(({ key, label, icon: Icon }) => {
        const item = impacts?.[key]
        if (!item) return null

        return (
          <Panel key={key} className="overflow-hidden">
            <div className="flex gap-4 border-l-2 p-4" style={{ borderLeftColor: config.color }}>
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: config.tint, color: config.color }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{label}</div>
                <div className="mt-2 text-[15px] font-medium text-white">{item.headline}</div>
                <p className="mt-2 text-[13px] leading-6 text-text-secondary">{item.detail}</p>
              </div>
            </div>
          </Panel>
        )
      })}
    </div>
  )
}
