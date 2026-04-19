import { Bookmark, FileText, MapPin, Sparkles } from 'lucide-react'
import { formatTimeAgo, makeFallbackImage } from '../../lib/format'
import { SeverityBadge } from './SeverityBadge'
import { Panel } from '../ui/Panel'

export function EventCard({
  event,
  onClick,
  showBookmark = false,
  saved = false,
  onToggleSave,
  active = false,
  note,
}) {
  const fallbackImage = makeFallbackImage(event.title, event.severity === 'critical' ? '#EF4444' : '#22D3EE')

  return (
    <Panel
      as="button"
      type="button"
      interactive
      spotlight
      active={active}
      onClick={onClick}
      className="group w-full overflow-hidden p-0 text-left"
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
        <img
          src={event.previewImage}
          alt={event.title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-crisp group-hover:scale-[1.02]"
          onError={(eventTarget) => {
            eventTarget.currentTarget.src = fallbackImage
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute left-4 top-4">
          <SeverityBadge severity={event.severity} />
        </div>
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {showBookmark ? (
            <button
              type="button"
              aria-label={saved ? 'Remove bookmark' : 'Save event'}
              onClick={(evt) => {
                evt.stopPropagation()
                onToggleSave?.(event.id)
              }}
              className="glass-panel glass-panel--interactive flex h-9 w-9 items-center justify-center rounded-full"
            >
              <Bookmark className={`h-4 w-4 ${saved ? 'fill-cyan-400 text-cyan-400' : 'text-text-secondary'}`} />
            </button>
          ) : null}
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/90">
            {formatTimeAgo(event.updatedAt ?? event.publishedAt, { compact: true })}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
          {(event.category || 'intel').replace('-', ' ')}
        </div>
        {event.aiSummary && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/15 bg-cyan-500/[0.08] px-2.5 py-1 text-[11px] text-cyan-100/90">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="line-clamp-2">{event.aiSummary}</span>
          </div>
        )}
        {event.affectedGroups && event.affectedGroups.length > 0 && !event.aiSummary && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-cyan-500/15 bg-cyan-500/[0.08] px-2.5 py-1 text-[11px] text-cyan-100/90">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span className="line-clamp-2">Affects: {event.affectedGroups.join(', ')}</span>
          </div>
        )}
        <h3 className="mt-2 line-clamp-2 font-display text-[17px] font-medium tracking-tightish text-white">{event.title}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-text-secondary">{event.previewText}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {event.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {event.sourcesCount} sources
          </span>
        </div>
      </div>
    </Panel>
  )
}
