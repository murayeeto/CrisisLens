import { Filter, X } from 'lucide-react'
import { useMemo } from 'react'
import { useEvents } from '../../hooks/useEvents'
import { getSeverityConfig, severityColor } from '../../lib/severity'

export function TickerBar({ activeSeverities = [], onSelectSeverity, onClearSeverityFilter }) {
  const { data: events } = useEvents()

  const tickerItems = useMemo(() => {
    const resolved =
      activeSeverities.length > 0
        ? events.filter((event) => activeSeverities.includes(event.severity))
        : events

    const items = resolved.map((event) => ({
      id: event.id,
      label: `${event.location.split(',')[0]} — ${event.category.replace('-', ' ')}`,
      severityLabel: getSeverityConfig(event.severity).label,
      severity: event.severity,
    }))

    return [...items, ...items]
  }, [activeSeverities, events])

  const filterSummary = useMemo(() => {
    if (!activeSeverities.length) return null
    return activeSeverities.map((severity) => getSeverityConfig(severity).label.toUpperCase()).join(' · ')
  }, [activeSeverities])

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 overflow-hidden border-t border-white/8 bg-[rgba(11,16,32,0.72)] backdrop-blur-xl">
      {filterSummary ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3">
          <button
            type="button"
            onClick={onClearSeverityFilter}
            className="pointer-events-auto glass-panel glass-panel--interactive inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary"
          >
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            {filterSummary}
            <X className="h-3 w-3 text-text-dim" />
          </button>
        </div>
      ) : null}
      <div className="overflow-hidden">
        <div className="ticker-track flex min-w-max items-center gap-8 px-6 py-2">
          {tickerItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('crisislens:open-event', {
                      detail: { id: item.id, origin: 'ticker' },
                    }),
                  )
                }
                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary transition hover:text-white"
              >
                <span
                  className="inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: severityColor(item.severity) }}
                />
                {item.label}
              </button>
              <button
                type="button"
                onClick={() => onSelectSeverity?.(item.severity)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted transition hover:border-cyan-500/30 hover:text-cyan-400"
              >
                {item.severityLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
