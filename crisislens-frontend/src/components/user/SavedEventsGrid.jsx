import { Bookmark } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EventCard } from '../event/EventCard'
import { Panel } from '../ui/Panel'

export function SavedEventsGrid({ events = [], onOpenEvent }) {
  const [savedIds, setSavedIds] = useState(events.map((event) => event.id))

  const visibleEvents = useMemo(() => events.filter((event) => savedIds.includes(event.id)), [events, savedIds])

  const toggleSaved = (id) => {
    setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  if (!visibleEvents.length) {
    return (
      <Panel className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
          <Bookmark className="h-5 w-5" />
        </div>
        <div className="mt-4 font-display text-[22px] font-medium text-white">No saved events yet</div>
        <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">⌘K to start exploring.</div>
      </Panel>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visibleEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => onOpenEvent(event.id, 'user')}
          showBookmark
          saved={savedIds.includes(event.id)}
          onToggleSave={toggleSaved}
        />
      ))}
    </div>
  )
}
