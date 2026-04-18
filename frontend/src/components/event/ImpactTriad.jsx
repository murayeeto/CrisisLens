import { Users } from 'lucide-react'
import { Panel } from '../ui/Panel'
import { getSeverityConfig } from '../../lib/severity'

export function ImpactTriad({ impacts, severity }) {
  const config = getSeverityConfig(severity)

  const impactsArray = Array.isArray(impacts) ? impacts : []

  return (
    <div className="space-y-3">
      {impactsArray.map((impact, idx) => {
        if (!impact) return null

        return (
          <Panel key={idx} className="overflow-hidden">
            <div className="flex gap-4 border-l-2 p-4" style={{ borderLeftColor: config.color }}>
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: config.tint, color: config.color }}
              >
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{impact.label || 'Impact'}</div>
                <div className="mt-2 text-[15px] font-medium text-white">{impact.value || 'N/A'}</div>
                <p className="mt-2 text-[13px] leading-6 text-text-secondary opacity-75">{impact.severity || 'Significant'}</p>
              </div>
            </div>
          </Panel>
        )
      })}
    </div>
  )
}
