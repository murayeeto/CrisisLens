import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, Clock3, Languages, MapPin, Share2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildReturnPath } from '../../lib/authRouting'
import { api } from '../../lib/api'
import { useAuthSession } from '../../providers/AuthSessionProvider'
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
import { EventReliefFundSection } from '../relief/EventReliefFundSection'

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
  const [shareLabel, setShareLabel] = useState('Share')
  const [savePending, setSavePending] = useState(false)
  const [translationPending, setTranslationPending] = useState(false)
  const [translatedSummaries, setTranslatedSummaries] = useState(null)
  const { isAuthenticated, isEventSaved, saveEvent, unsaveEvent } = useAuthSession()
  const { profile } = useAuthSession()
  const origin = useMemo(() => {
    if (location.pathname === '/trending') return 'TRENDING'
    if (
      location.pathname === '/for-you' ||
      location.pathname === '/account' ||
      location.pathname === '/desk' ||
      location.pathname === '/user'
    ) {
      return 'ACCOUNT'
    }
    return 'GLOBE'
  }, [location.pathname])
  const saved = useMemo(() => (eventId ? isEventSaved(eventId) : false), [eventId, isEventSaved])

  const handleClose = useCallback(() => {
    const search = new URLSearchParams(location.search)
    if (search.has('event')) {
      search.delete('event')
      navigate(
        {
          pathname: location.pathname,
          search: search.toString() ? `?${search.toString()}` : '',
        },
        { replace: true },
      )
    }
    onClose()
  }, [location.pathname, location.search, navigate, onClose])

  useEffect(() => {
    if (!eventId) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') handleClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [eventId, handleClose])

  useEffect(() => {
    setShareLabel('Share')
    setTranslatedSummaries(null)
  }, [eventId])

  const shareEvent = async () => {
    if (!eventId) return
    const url = new URL('/trending', window.location.origin)
    url.searchParams.set('event', eventId)
    const shareUrl = url.toString()

    try {
      if (navigator.share) {
        await navigator.share({
          title: detail?.title ?? 'CrisisLens event',
          text: detail?.previewText ?? 'Tracked event from CrisisLens',
          url: shareUrl,
        })
        setShareLabel('Shared')
        window.setTimeout(() => setShareLabel('Share'), 1800)
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
        setShareLabel('Link copied')
        window.setTimeout(() => setShareLabel('Share'), 1800)
        return
      }

      throw new Error('Clipboard unavailable')
    } catch (error) {
      if (error?.name === 'AbortError') {
        setShareLabel('Share')
        return
      }

      window.prompt('Copy event link', shareUrl)
      setShareLabel('Copy link')
      window.setTimeout(() => setShareLabel('Share'), 1800)
    }
  }

  const detail = data
  const showingCachedSnapshot = Boolean(detail && error)
  const fallbackImage = detail ? makeFallbackImage(detail.title, detail.severity === 'critical' ? '#EF4444' : '#22D3EE') : ''

  const toggleSave = useCallback(async () => {
    if (!eventId) return

    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { from: buildReturnPath(location, eventId) },
      })
      return
    }

    setSavePending(true)

    try {
      if (saved) {
        await unsaveEvent(eventId)
      } else {
        await saveEvent(eventId)
      }
    } catch (saveError) {
      console.error('Failed to update saved state:', saveError)
    } finally {
      setSavePending(false)
    }
  }, [eventId, isAuthenticated, location, navigate, saveEvent, saved, unsaveEvent])

  const handleTranslate = useCallback(async () => {
    if (!eventId || !profile?.language || profile.language === 'en') return
    
    setTranslationPending(true)
    try {
      const translated = await api.translateEvent(eventId, profile.language)
      
      setTranslatedSummaries({
        title: translated.title,
        aiSummary: translated.aiSummary,
        impactAnalysis: translated.impactAnalysis,
        watchGuidance: translated.watchGuidance,
        howToHelp: translated.howToHelp,
      })
    } catch (error) {
      console.error('[EventDetailPanel] Translation error:', error)
    } finally {
      setTranslationPending(false)
    }
  }, [eventId, profile?.language])

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
              {loading && !detail ? <DetailSkeleton onClose={handleClose} /> : null}

              {!loading && error && !detail ? (
                <div className="p-5">
                  <ErrorState
                    onRetry={refetch}
                    message="We couldn't hydrate this event from the live detail feed. Try again or keep moving with the cached intelligence."
                    diagnostic={`signal=mock_fallback endpoint=/api/events/${eventId}`}
                  />
                </div>
              ) : null}

              {detail ? (
                <div className="thin-scrollbar h-full overflow-y-auto">
                  <div className="sticky top-0 z-10 border-b border-white/8 bg-[rgba(11,16,32,0.88)] px-5 py-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                        {origin} › EVENT › {translatedSummaries?.title || detail.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <Kbd>Esc</Kbd>
                        <button
                          type="button"
                          aria-label="Close event panel"
                          onClick={handleClose}
                          className="rounded-full p-2 text-text-muted transition hover:bg-white/[0.04] hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-5">
                    {showingCachedSnapshot ? (
                      <Panel className="border-amber-500/20 bg-amber-500/[0.06] p-4">
                        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber-300">
                          Warn · Cached Snapshot Active
                        </div>
                        <p className="mt-2 text-sm text-text-secondary">
                          Live detail refresh missed this event, so you&apos;re seeing the last cached intelligence snapshot.
                        </p>
                        <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim">
                          {`signal=cache_fallback endpoint=/api/events/${eventId}`}
                        </div>
                        <Button className="mt-4 px-4 py-2 text-[11px]" variant="secondary" onClick={refetch}>
                          <Clock3 className="h-3.5 w-3.5" />
                          Retry live detail
                        </Button>
                      </Panel>
                    ) : null}

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
                        3 sources new in last hour
                      </div>
                    </div>

                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                        ◦ {(detail.category || 'intel').toUpperCase()} · {(detail.region || 'unknown').toUpperCase()}
                      </div>
                      <h2 className="mt-3 font-display text-[28px] font-semibold tracking-tightish text-white">{translatedSummaries?.title || detail.title}</h2>
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
                        {detail.aiSummary || translatedSummaries?.aiSummary ? (
                          <Typewriter text={translatedSummaries?.aiSummary || detail.aiSummary} speed={18} />
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
                      <ImpactTriad 
                        impacts={
                          detail.affectedGroups?.map((group) => ({
                            label: group,
                            value: 'Affected population',
                            severity: 'May experience direct impact'
                          })) || []
                        } 
                        severity={detail.severity} 
                      />
                    </section>

                    <section>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                        ◦ What to Watch Next
                      </div>
                      <div className="mt-4">
                        <WhatToWatch items={translatedSummaries?.watchGuidance || detail.watchGuidance ? [translatedSummaries?.watchGuidance || detail.watchGuidance] : []} />
                      </div>
                    </section>

                    {(translatedSummaries?.impactAnalysis || detail.impactAnalysis) && (
                      <section>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">
                          ◦ Impact Analysis
                        </div>
                        <div className="mt-4">
                          <p className="text-[13px] leading-6 text-text-secondary">{translatedSummaries?.impactAnalysis || detail.impactAnalysis}</p>
                        </div>
                      </section>
                    )}

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
                      <div className="mt-4">
                        {translatedSummaries?.howToHelp || detail.howToHelp ? (
                          <p className="text-[13px] leading-6 text-text-secondary">{translatedSummaries?.howToHelp || detail.howToHelp}</p>
                        ) : (
                          <p className="text-[13px] leading-6 text-text-secondary/50 italic">No assistance guidance available</p>
                        )}
                      </div>
                    </section>

                    <EventReliefFundSection event={detail} />

                    <div className="flex flex-wrap gap-2 border-t border-white/8 pt-2">
                      <Button variant="secondary" className="px-4 py-2 text-[11px]" onClick={toggleSave} disabled={savePending}>
                        <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-cyan-400 text-cyan-400' : ''}`} />
                        {savePending ? 'Updating account' : saved ? 'Saved to account' : 'Save to account'}
                      </Button>
                      <Button variant="secondary" className="px-4 py-2 text-[11px]" onClick={shareEvent}>
                        <Share2 className="h-3.5 w-3.5" />
                        {shareLabel}
                      </Button>
                      {profile?.language && profile.language !== 'en' && (
                        <Button 
                          variant="secondary" 
                          className="px-4 py-2 text-[11px]" 
                          onClick={handleTranslate}
                          disabled={translationPending}
                        >
                          <Languages className="h-3.5 w-3.5" />
                          {translationPending ? 'Translating...' : 'Translate'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="px-4 py-2 text-[11px]"
                        onClick={() => {
                          navigate(`/trending?event=${eventId}`)
                          handleClose()
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
