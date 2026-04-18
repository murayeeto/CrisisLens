import { useMemo } from 'react'
import { useEvents } from '../../hooks/useEvents'
import { severityColor } from '../../lib/severity'

export function TickerBar() {
  const { data: events } = useEvents()

  const tickerItems = useMemo(() => {
    const resolved = events.length ? events : []
    const items = resolved.map((event) => ({
      id: event.id,
      label: `${event.location.split(',')[0]} — ${event.category} — ${event.severity}`,
      severity: event.severity,
    }))

    return [...items, ...items]
  }, [events])

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/8 bg-[rgba(11,16,32,0.72)] backdrop-blur-xl">
      <div className="overflow-hidden">
        <div className="ticker-track flex min-w-max items-center gap-8 px-6 py-2">
          {tickerItems.map((item, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('crisislens:open-event', {
                    detail: { id: item.id, origin: 'ticker' },
                  }),
                )
              }
              className="flex items-center gap-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.16em] text-text-secondary transition hover:text-white"
            >
              <span
                className="inline-flex h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: severityColor(item.severity) }}
              />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
