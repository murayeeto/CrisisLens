import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Clock3, ExternalLink, MapPin, Share2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useEventDetail } from '../../hooks/useEventDetail'
import { formatCoords, formatTimeAgo, makeFallbackImage } from '../../lib/format'
import { ErrorState } from '../ui/ErrorState'
import { Kbd } from '../ui/Kbd'
import { LiveDot } from '../ui/LiveDot'
import { Panel } from '../ui/Panel'
import { Skeleton } from '../ui/Skeleton'
import { Typewriter } from '../ui/Typewriter'
import { Button } from '../ui/Button'
import { ImpactTriad } from './ImpactTriad'
import { SeverityBadge } from './SeverityBadge'
import { SourceList } from './SourceList'
import { WhatToWatch } from './WhatToWatch'

function DetailSkeleton({ onClose }) {
  return (
    <div className="thin-scrollbar h-full overflow-y-auto">
      <div className="sticky top-0 z-10 border-b border-white/8 bg-[rgba(11,16,32,0.88)] px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">Loading event</div>
          <button type="button" onClick={onClose} aria-label="Close event panel" className="rounded-full p-2 text-text-muted hover:bg-white/[0.04] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-5 p-5">
        <Skeleton className="h-[300px] w-full rounded-[24px]" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  )
}

export function EventDetailPanel({ eventId, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useEventDetail(eventId)
  const [saved, setSaved] = useState(false)
  const origin = useMemo(() => {
    if (location.pathname === '/trending') return 'TRENDING'
    if (location.pathname === '/user') return 'PROFILE'
    return 'GLOBE'
  }, [location.pathname])

  useEffect(() => {
    if (!eventId) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [eventId, onClose])

  const shareEvent = async () => {
    if (!eventId) return
    const url = `${window.location.origin}/trending?event=${eventId}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy event link', url)
    }
  }

  const detail = data
  const fallbackImage = detail ? makeFallbackImage(detail.title, detail.severity === 'critical' ? '#EF4444' : '#22D3EE') : ''

  return (
    <AnimatePresence>
      {eventId ? (
        <motion.div className="pointer-events-none fixed inset-x-0 bottom-9 top-16 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-l from-black/10 via-black/5 to-transparent" />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute right-0 top-0 h-full w-full md:max-w-[520px]"
          >
            <div className="absolute left-0 top-0 h-full w-16 -translate-x-full bg-gradient-to-l from-cyan-500/12 to-transparent" />
            <div className="absolute left-0 top-0 h-full w-px bg-cyan-500/50 shadow-[0_0_18px_rgba(34,211,238,0.35)]" />

            <Panel className="thin-scrollbar h-full overflow-hidden rounded-none border-r-0 md:rounded-l-[28px]">
              {loading ? <DetailSkeleton onClose={onClose} /> : null}

              {!loading && error ? (
                <div className="p-5">
                  <ErrorState
                    onRetry={refetch}
                    message="We couldn't hydrate this event from the live detail feed. Try again or keep moving with the cached intelligence."
                    diagnostic={`signal=mock_fallback endpoint=/api/events/${eventId}`}
                  />
                </div>
              ) : null}

              {!loading && !error && detail ? (
                <div className="thin-scrollbar h-full overflow-y-auto">
                  <div className="sticky top-0 z-10 border-b border-white/8 bg-[rgba(11,16,32,0.88)] px-5 py-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                        {origin} › EVENT › {detail.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <Kbd>Esc</Kbd>
                        <button
                          type="button"
                          aria-label="Close event panel"
                          onClick={onClose}
                          className="rounded-full p-2 text-text-muted transition hover:bg-white/[0.04] hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-5">
                    <div className="relative overflow-hidden rounded-[24px]">
                      <img
                        src={detail.previewImage || fallbackImage}
                        alt={detail.title}
                        className="h-[300px] w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = fallbackImage
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,7,13,0.95)] via-black/25 to-transparent" />
                      <div className="absolute left-4 top-4">
                        <SeverityBadge severity={detail.severity} />
                      </div>
                      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
                        <LiveDot color="red" />
                        Live · 3 sources new in last hour
                      </div>
                    </div>

                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                        ◦ {(detail.category || 'intel').toUpperCase()} · {(detail.region || 'unknown').toUpperCase()}
                      </div>
                      <h2 className="mt-3 font-display text-[28px] font-semibold tracking-tightish text-white">{detail.title}</h2>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-text-secondary">
                        <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.12em]">
                          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                          {detail.location} · {formatCoords(detail.lat, detail.lng)}
                        </span>
                        <span className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.12em]">
                          <Clock3 className="h-3.5 w-3.5 text-cyan-400" />
                          {detail.startedAt ? `Started ${formatTimeAgo(detail.startedAt)}` : 'Started recently'} · {detail.updatedAt ? `Updated ${formatTimeAgo(detail.updatedAt)}` : 'Recently updated'}
                        </span>
                      </div>
                    </div>

                    <section>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                        ◦ AI Intelligence Summary
                      </div>
                      <div className="mt-4">
                        {detail.aiSummary ? (
                          <Typewriter text={detail.aiSummary} speed={18} />
                        ) : (
                          <p className="text-[13px] leading-6 text-text-secondary">{detail.description || 'Analysis pending...'}</p>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(detail.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <ImpactTriad impacts={detail.impacts || []} severity={detail.severity} />
                    </section>

                    <section>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                        ◦ What to Watch Next
                      </div>
                      <div className="mt-4">
                        <WhatToWatch items={detail.whatToWatch || []} />
                      </div>
                    </section>

                    <section>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                        ◦ Sources · {(detail.sources || []).length || detail.sourcesCount || 0}
                      </div>
                      <div className="mt-4">
                        <SourceList sources={detail.sources || []} />
                      </div>
                    </section>

                    <section>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">◦ How to Help</div>
                      <div className="mt-4 space-y-2">
                        {(detail.howToHelp || []).map((item) => (
                          <a
                            key={item.label}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="glass-panel glass-panel--interactive flex items-center justify-between rounded-full px-4 py-3 text-sm text-text-secondary hover:text-white"
                          >
                            <span>{item.label}</span>
                            <ExternalLink className="h-4 w-4 text-cyan-400" />
                          </a>
                        ))}
                      </div>
                    </section>

                    <div className="flex flex-wrap gap-2 border-t border-white/8 pt-2">
                      <Button variant="secondary" className="px-4 py-2 text-[11px]" onClick={() => setSaved((current) => !current)}>
                        <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                        {saved ? 'Saved to profile' : 'Save to profile'}
                      </Button>
                      <Button variant="secondary" className="px-4 py-2 text-[11px]" onClick={shareEvent}>
                        <Share2 className="h-3.5 w-3.5" />
                        Share
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-4 py-2 text-[11px]"
                        onClick={() => {
                          navigate('/trending')
                          onClose()
                        }}
                      >
                        Open on trending page
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </Panel>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
