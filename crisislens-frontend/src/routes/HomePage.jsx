import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '../hooks/useEvents'
import { getUtcLabel } from '../lib/format'
import { globalStats } from '../lib/mockData'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { GlobeHUD } from '../components/globe/GlobeHUD'
import { GlobeLegend } from '../components/globe/GlobeLegend'
import { Panel } from '../components/ui/Panel'
import { Skeleton } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'

const LazyCrisisGlobe = lazy(() => import('../components/globe/CrisisGlobe'))

function GlobeFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Panel className="flex h-[70%] w-[70%] flex-col items-center justify-center gap-5 rounded-[28px] border-white/8 bg-black/10">
        <svg className="wire-globe h-56 w-56 text-cyan-500/40" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="72" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="100" cy="100" rx="72" ry="28" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="100" cy="100" rx="28" ry="72" stroke="currentColor" strokeWidth="1.5" />
          <path d="M28 100h144" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">Initializing globe…</div>
      </Panel>
    </div>
  )
}

export default function HomePage({ onOpenEvent, activeEventId, isDetailOpen }) {
  const navigate = useNavigate()
  const { data: events, loading, error, refetch } = useEvents()
  const [utcTime, setUtcTime] = useState(getUtcLabel())
  const [activeSeverities, setActiveSeverities] = useState([])
  const [hoveredEvent, setHoveredEvent] = useState(null)
  const [pov, setPov] = useState({ lat: 0, lng: 0, altitude: 2.2 })

  useEffect(() => {
    const interval = window.setInterval(() => setUtcTime(getUtcLabel()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const selectedEvent = useMemo(() => events.find((event) => event.id === activeEventId) ?? null, [activeEventId, events])
  const featuredEvent = useMemo(() => events.find((event) => event.severity === 'critical') ?? events[0], [events])
  const hudEvent = hoveredEvent ?? selectedEvent

  const toggleSeverity = (severity) => {
    setActiveSeverities((current) =>
      current.includes(severity) ? current.filter((item) => item !== severity) : [...current, severity],
    )
  }

  return (
    <section className="relative h-[calc(100vh-64px-36px)] min-h-[720px] overflow-hidden">
      <div className="absolute inset-0">
        <Suspense fallback={<GlobeFallback />}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="crisis-globe h-full w-full"
          >
            {!loading && events.length ? (
              <LazyCrisisGlobe
                events={events}
                activeSeverities={activeSeverities}
                selectedEventId={activeEventId}
                dimmed={isDetailOpen}
                onEventSelect={(event) => onOpenEvent(event.id, 'globe')}
                onHoverChange={setHoveredEvent}
                onViewChange={setPov}
              />
            ) : (
              <GlobeFallback />
            )}
          </motion.div>
        </Suspense>
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto absolute left-4 top-4 max-w-[620px] sm:left-8 sm:top-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-400"
          >
            ◦ Live Intelligence · UTC {utcTime}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.43, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5"
          >
            <div className="mb-4 h-px w-16 bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.45)]" />
            <h1 className="font-display text-[44px] font-bold leading-none tracking-snugger text-white sm:text-[72px]">
              Crisis<span className="text-cyan-400">L</span>ens
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.49, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-[540px] text-[18px] leading-[1.55] text-text-secondary"
          >
            See how a real-world event could move places, people, and markets in one view.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <Button onClick={() => featuredEvent && onOpenEvent(featuredEvent.id, 'globe')}>
              Explore events
              <ArrowUpRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => navigate('/trending')}>
              View trending
            </Button>
          </motion.div>
        </div>

        <div className="pointer-events-auto absolute right-4 top-4 w-[240px] sm:right-8 sm:top-8">
          <GlobeHUD event={hudEvent} pov={pov} />
        </div>

        <div className="pointer-events-auto absolute bottom-28 left-4 right-4 flex justify-center sm:bottom-24">
          <div className="grid w-full max-w-[900px] gap-3 md:grid-cols-4">
            <StatTile label="Active Events" value={globalStats.activeEvents} />
            <StatTile label="Countries" value={globalStats.countries} />
            <StatTile label="Sources" value={globalStats.sources} />
            <StatTile label="Updated <1h" value={globalStats.updatedLastHour} />
          </div>
        </div>

        <div className="pointer-events-auto absolute bottom-16 left-4 sm:bottom-20 sm:left-8">
          <GlobeLegend activeSeverities={activeSeverities} onToggle={toggleSeverity} />
        </div>
      </div>

      {loading ? (
        <div className="absolute inset-x-0 bottom-16 z-10 flex justify-center px-4">
          <div className="grid w-full max-w-[900px] gap-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-[78px] w-full rounded-[20px]" />
            ))}
          </div>
        </div>
      ) : null}

      {!loading && error && !events.length ? (
        <div className="absolute inset-x-0 top-1/2 z-20 mx-auto w-full max-w-[520px] -translate-y-1/2 px-6">
          <ErrorState onRetry={refetch} />
        </div>
      ) : null}
    </section>
  )
}
