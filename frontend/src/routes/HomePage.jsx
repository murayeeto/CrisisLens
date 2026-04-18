import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useEvents } from '../hooks/useEvents'
import { getUtcLabel } from '../lib/format'
import { getSeverityConfig } from '../lib/severity'
import { ErrorState } from '../components/ui/ErrorState'
import { GlobeHUD } from '../components/globe/GlobeHUD'
import { GlobeLegend } from '../components/globe/GlobeLegend'
import { Panel } from '../components/ui/Panel'
import { Skeleton } from '../components/ui/Skeleton'

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

export default function HomePage({
  onOpenEvent,
  activeEventId,
  isDetailOpen,
  activeSeverities,
  onToggleSeverity,
}) {
  const { data: events, loading, error, refetch } = useEvents()
  const [utcTime, setUtcTime] = useState(getUtcLabel())
  const [hoveredEvent, setHoveredEvent] = useState(null)
  const [pov, setPov] = useState({ lat: 0, lng: 0, altitude: 2.2 })

  useEffect(() => {
    const interval = window.setInterval(() => setUtcTime(getUtcLabel()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const selectedEvent = useMemo(() => events.find((event) => event.id === activeEventId) ?? null, [activeEventId, events])
  const hudEvent = hoveredEvent ?? selectedEvent
  const visibleEvents = useMemo(
    () => (activeSeverities.length ? events.filter((event) => activeSeverities.includes(event.severity)) : events),
    [activeSeverities, events],
  )
  const updatedNowCount = useMemo(
    () => visibleEvents.filter((event) => Date.now() - new Date(event.updatedAt).getTime() < 60 * 60 * 1000).length,
    [visibleEvents],
  )
  const filterLabel = useMemo(
    () =>
      activeSeverities.length
        ? activeSeverities.map((severity) => getSeverityConfig(severity).label.toUpperCase()).join(' · ')
        : 'GLOBAL FEED',
    [activeSeverities],
  )
  const stats = useMemo(
    () => [
      { label: 'Active Events', value: visibleEvents.length },
      { label: 'Critical', value: visibleEvents.filter((event) => event.severity === 'critical').length },
      { label: 'High', value: visibleEvents.filter((event) => event.severity === 'high').length },
      { label: 'Updated Now', value: updatedNowCount },
    ],
    [updatedNowCount, visibleEvents],
  )

  return (
    <section className="relative h-[calc(100vh-64px-36px)] min-h-[720px] overflow-hidden">
      <div className="absolute inset-0">
        <Suspense fallback={<GlobeFallback />}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.38, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
        <div className="pointer-events-auto absolute left-4 top-6 w-[min(92vw,340px)] sm:left-8 sm:top-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Panel className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">Feed Snapshot</div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">UTC {utcTime}</div>
                </div>
                <div className="text-right font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">{filterLabel}</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="font-display text-[24px] font-medium tracking-tightish text-white">{item.value}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{item.label}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>
        </div>

        <div className="pointer-events-auto absolute right-4 top-6 w-[240px] sm:right-8 sm:top-8">
          <GlobeHUD event={hudEvent} pov={pov} />
        </div>

        <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 sm:bottom-8 sm:left-8 sm:translate-x-0">
          <GlobeLegend activeSeverities={activeSeverities} onToggle={onToggleSeverity} />
        </div>
      </div>

      {loading ? (
        <div className="absolute left-4 top-6 z-10 w-[min(92vw,340px)] sm:left-8 sm:top-8">
          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-[76px] w-full rounded-[18px]" />
              ))}
            </div>
          </Panel>
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
