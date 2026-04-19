import { Bookmark } from 'lucide-react'
import { EventCard } from '../event/EventCard'
import { Panel } from '../ui/Panel'

export function SavedEventsGrid({ events = [], onOpenEvent, onToggleSave }) {
  if (!events.length) {
    return (
      <Panel className="flex flex-col items-center justify-center px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400">
          <Bookmark className="h-5 w-5" />
        </div>
        <div className="mt-4 font-display text-[22px] font-medium text-white">Nothing saved yet</div>
      </Panel>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => onOpenEvent(event.id, 'account')}
          showBookmark
          saved
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  )
}
