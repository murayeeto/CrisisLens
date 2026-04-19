import { severityOrder, getSeverityConfig } from '../../lib/severity'

export function GlobeLegend({ activeSeverities, onToggle }) {
  // When no severities are selected, all events are shown (default behavior)
  // Users can click buttons to filter to specific severities only
  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 rounded-full px-4 py-3">
      {severityOrder.map((severity) => {
        const config = getSeverityConfig(severity)
        // Show as active if: no filters selected (show all) OR this severity is explicitly selected
        const active = activeSeverities.length === 0 || activeSeverities.includes(severity)

        return (
          <button
            key={severity}
            type="button"
            onClick={() => onToggle(severity)}
            className={`inline-flex items-center gap-2 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
              active ? 'text-white' : 'text-text-dim'
            }`}
          >
            <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: config.color, opacity: active ? 1 : 0.35 }} />
            {config.label}
          </button>
        )
      })}
    </div>
  )
}
