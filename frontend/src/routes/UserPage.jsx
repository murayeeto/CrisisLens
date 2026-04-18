import { BookmarkCheck, Radar, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useUser } from '../hooks/useUser'
import { useEvents } from '../hooks/useEvents'
import { ProfileHeader } from '../components/user/ProfileHeader'
import { SavedEventsGrid } from '../components/user/SavedEventsGrid'
import { Panel } from '../components/ui/Panel'
import { Skeleton } from '../components/ui/Skeleton'
import { EventCard } from '../components/event/EventCard'

const tabs = [
  { id: 'saved', label: 'Saved events', icon: BookmarkCheck },
  { id: 'watchlists', label: 'Watchlists', icon: Radar },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

export default function UserPage({ onOpenEvent }) {
  const { data: user, loading } = useUser()
  const { data: allEvents } = useEvents()
  const [tab, setTab] = useState('saved')
  const [savedEvents, setSavedEvents] = useState([])
  const [savedLoading, setSavedLoading] = useState(true)

  useEffect(() => {
    let active = true

    api.getSavedEventsForCurrentUser().then((response) => {
      if (!active) return
      setSavedEvents(Array.isArray(response) ? response : [])
      setSavedLoading(false)
    }).catch((error) => {
      console.error('Failed to fetch saved events:', error)
      if (active) {
        setSavedEvents([])
        setSavedLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <section className="relative z-10 mx-auto max-w-[1280px] px-6 py-16 pb-28">
      {loading || !user ? <Skeleton className="h-[260px] w-full rounded-[28px]" /> : <ProfileHeader user={user} />}

      <div className="mt-8 flex flex-wrap gap-2">
        {tabs.map((item) => {
          const Icon = item.icon
          const active = item.id === tab

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
                active ? 'border-cyan-500/35 text-cyan-400 shadow-glow-cyan' : 'text-text-muted hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>

      {tab === 'saved' ? (
        <div className="mt-8">
          {savedLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[360px] w-full rounded-[24px]" />
              ))}
            </div>
          ) : (
            <SavedEventsGrid events={savedEvents} onOpenEvent={onOpenEvent} />
          )}
        </div>
      ) : null}

      {tab === 'watchlists' ? (
        <Panel className="mt-8 px-6 py-14 text-center">
          <div className="font-display text-[24px] font-medium text-white">Watchlists are coming soon</div>
          <p className="mt-3 max-w-[520px] mx-auto text-sm leading-6 text-text-secondary">
            Create custom watchlists to monitor specific event patterns and regions.
          </p>
        </Panel>
      ) : null}

      {tab === 'settings' ? (
        <Panel className="mt-8 px-6 py-14 text-center">
          <div className="font-display text-[24px] font-medium text-white">Settings are coming soon</div>
          <div className="mt-3 max-w-[520px] mx-auto text-sm leading-6 text-text-secondary">
            We kept the polish on the intelligence workflows first. Notification routing, shared watchlists, and analyst preferences are next in line.
          </div>
        </Panel>
      ) : null}
    </section>
  )
}
