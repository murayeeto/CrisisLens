import { Compass } from 'lucide-react'
import { formatCoords } from '../../lib/format'
import { SeverityBadge } from '../event/SeverityBadge'
import { Panel } from '../ui/Panel'

export function GlobeHUD({ event, pov }) {
  const heading = ((pov?.lng ?? 0) % 360 + 360) % 360

  return (
    <Panel className="w-full max-w-[240px] p-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">◦ Orbital Feed</div>
      <div className="mt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          Hovering — {event ? event.title : 'None'}
        </div>
        <div className="mt-2 text-sm text-text-secondary">
          {event ? (
            <>
              <div className="text-white">{event.location}</div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                {formatCoords(event.lat, event.lng)}
              </div>
            </>
          ) : (
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">0.00° N, 0.00° E</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">{event ? event.category : 'Idle'}</div>
          {event ? <div className="mt-2"><SeverityBadge severity={event.severity} /></div> : null}
        </div>

        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
          <div className="absolute inset-2 rounded-full border border-dashed border-white/10" />
          <div
            className="flex h-8 w-8 items-center justify-center text-cyan-400 transition-transform duration-300 ease-crisp"
            style={{ transform: `rotate(${heading}deg)` }}
          >
            <Compass className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
        Drag · Rotate &nbsp; Scroll · Zoom &nbsp; Click · Inspect
      </div>
    </Panel>
  )
}
