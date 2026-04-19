import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useEvents } from '../hooks/useEvents'
import { useTrending } from '../hooks/useTrending'
import { useAuthSession } from '../providers/AuthSessionProvider'
import { EventCard } from '../components/event/EventCard'
import { Panel } from '../components/ui/Panel'
import { Skeleton } from '../components/ui/Skeleton'

const filters = ['All', 'Wildfires', 'Storms', 'Markets', 'Transit', 'Protests', 'Other']

const matchesFilter = (event, filter) => {
  if (filter === 'All') return true
  if (filter === 'Wildfires') return event.category === 'wildfire'
  if (filter === 'Storms') return event.category === 'storm' || event.category === 'weather'
  if (filter === 'Markets') return event.category === 'market' || event.category === 'port'
  if (filter === 'Transit') return event.category === 'transit'
  if (filter === 'Protests') return event.category === 'protest'
  return !['wildfire', 'storm', 'weather', 'market', 'port', 'transit', 'protest'].includes(event.category)
}

export default function TrendingPage({ onOpenEvent, activeEventId }) {
  const { profile } = useAuthSession()
  const { data: trending, loading: trendingLoading } = useTrending()
  const { data: events, loading: eventsLoading } = useEvents(profile?.language ?? 'en')
  const [activeFilter, setActiveFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState('Latest')

  const cards = useMemo(() => {
    // Primary: Use events from Firestore
    // Fallback: Link trending articles with events by ID
    const eventMap = new Map(events.map((event) => [event.id, event]))
    
    let allCards = []
    
    // Add all Firestore events
    allCards = events.map((event) => ({
      ...event,
      publishedAt: event.updatedAt || event.createdAt,
    }))
    
    // Then add any trending articles that don't have a linked event
    const eventIds = new Set(events.map(e => e.id))
    trending.forEach((item) => {
      if (item.eventId && !eventIds.has(item.eventId)) {
        const linked = eventMap.get(item.eventId)
        if (linked) {
          allCards.push({
            ...linked,
            title: item.title,
            previewText: item.previewText,
            publishedAt: item.publishedAt,
            outlet: item.outlet,
          })
        }
      }
    })

    return allCards
      .filter((event) => matchesFilter(event, activeFilter))
      .filter((event) => {
        const term = query.trim().toLowerCase()
        if (!term) return true
        return `${event.title} ${event.location} ${event.category}`.toLowerCase().includes(term)
      })
      .sort((a, b) => {
        if (sortMode === 'Severity') {
          const order = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 }
          return order[a.severity] - order[b.severity]
        }
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      })
  }, [activeFilter, events, query, sortMode, trending, eventsLoading, trendingLoading])

  return (
    <section className="relative z-10 mx-auto max-w-[1280px] px-6 py-16 pb-28">
      <div className="max-w-[840px]">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-400">◦ Trending · Updated 2 min ago</div>
        <h1 className="mt-5 font-display text-[44px] font-semibold tracking-snug text-white md:text-[56px]">Trending now</h1>
        <p className="mt-4 text-lg text-text-secondary">
          What&apos;s moving people, places, and markets right now.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`glass-panel whitespace-nowrap rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                activeFilter === filter ? 'border-cyan-500/35 text-cyan-400 shadow-glow-cyan' : 'text-text-muted hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setSortMode((current) => (current === 'Latest' ? 'Severity' : 'Latest'))}
            className="glass-panel glass-panel--interactive rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
          >
            Sort · {sortMode}
          </button>
          <div className="glass-panel flex items-center gap-3 rounded-full px-4 py-2">
            <Search className="h-4 w-4 text-text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-[180px] border-0 bg-transparent text-sm text-white outline-none placeholder:text-text-dim"
            />
          </div>
        </div>
      </div>

      {eventsLoading || trendingLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Panel key={index} className="overflow-hidden p-0">
              <Skeleton className="h-[220px] w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Panel>
          ))}
        </div>
      ) : null}

      {!eventsLoading && !trendingLoading && cards.length ? (
        <motion.div
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {cards.map((event) => (
            <motion.div
              key={`${event.id}-${event.publishedAt}`}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <EventCard
                event={event}
                active={activeEventId === event.id}
                onClick={() => onOpenEvent(event.id, 'trending')}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : null}

      {!eventsLoading && !trendingLoading && !cards.length ? (
        <Panel className="mt-8 px-6 py-14 text-center">
          <div className="font-display text-[24px] font-medium text-white">No live matches for this filter</div>
          <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
            Adjust category or search terms to widen the feed.
          </div>
        </Panel>
      ) : null}
    </section>
  )
}
