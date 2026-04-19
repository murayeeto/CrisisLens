import {
  Bookmark,
  BookmarkCheck,
  CalendarRange,
  ChevronDown,
  Clock3,
  MapPin,
  MapPinned,
  Radar,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { EventCard } from '../components/event/EventCard'
import { SeverityBadge } from '../components/event/SeverityBadge'
import { SavedEventsGrid } from '../components/user/SavedEventsGrid'
import { Panel } from '../components/ui/Panel'
import { Skeleton } from '../components/ui/Skeleton'
import { useEvents } from '../hooks/useEvents'
import { api } from '../lib/api'
import { formatTimeAgo, makeFallbackImage } from '../lib/format'
import { getEventCountryLabel, getPreferenceCategoryLabel, normalizeEventCategory } from '../lib/preferences'
import { getSeverityConfig, severityOrder } from '../lib/severity'
import { useAuthSession } from '../providers/AuthSessionProvider'

const tabs = [
  { id: 'watchlists', label: 'For You', icon: Radar },
  { id: 'saved', label: 'Saved', icon: BookmarkCheck },
]

const dateOptions = [
  { value: 'all', label: 'Any time' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '72h', label: 'Last 3 days' },
]

const dateThresholds = {
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '72h': 72 * 60 * 60 * 1000,
}

function buildCountMap(values = []) {
  const counts = new Map()

  values.forEach((value) => {
    if (!value || value === 'Unknown') return
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return counts
}

function buildSuggestionReason({
  explicitCountryMatch,
  explicitCategoryMatch,
  learnedCountryStrength,
  learnedCategoryStrength,
  countryLabel,
  categoryKey,
  severity,
}) {
  const categoryLabel = getPreferenceCategoryLabel(categoryKey)

  if (explicitCountryMatch && explicitCategoryMatch) {
    return `Matches ${countryLabel} and ${categoryLabel}.`
  }

  if (explicitCategoryMatch) {
    return `Matches ${categoryLabel}.`
  }

  if (explicitCountryMatch) {
    return `Matches ${countryLabel}.`
  }

  if (learnedCountryStrength && learnedCategoryStrength) {
    return null
  }

  if (learnedCategoryStrength) {
    return `Similar to saved ${categoryLabel}.`
  }

  if (learnedCountryStrength) {
    return `Similar to saved stories from ${countryLabel}.`
  }

  if (severity === 'critical' || severity === 'high') {
    return 'Critical update.'
  }

  return 'Worth a look.'
}

function buildMatchPills({
  explicitCountryMatch,
  explicitCategoryMatch,
  learnedCountryStrength,
  learnedCategoryStrength,
  countryLabel,
  categoryKey,
  severity,
}) {
  const pills = []

  if (explicitCountryMatch) {
    pills.push({ label: countryLabel, tone: 'match' })
  }

  if (explicitCategoryMatch) {
    pills.push({ label: getPreferenceCategoryLabel(categoryKey), tone: 'match' })
  }

  if (!explicitCountryMatch && learnedCountryStrength) {
    pills.push({ label: `Saved ${countryLabel}`, tone: 'saved' })
  }

  if (!explicitCategoryMatch && learnedCategoryStrength) {
    pills.push({ label: `Saved ${getPreferenceCategoryLabel(categoryKey)}`, tone: 'saved' })
  }

  if (!pills.length && (severity === 'critical' || severity === 'high')) {
    pills.push({ label: 'Critical', tone: 'critical' })
  }

  if (!pills.length) {
    pills.push({ label: 'Live', tone: 'neutral' })
  }

  return pills.slice(0, 3)
}

function getToneClass(tone = 'neutral') {
  if (tone === 'match') {
    return 'border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-100'
  }

  if (tone === 'saved') {
    return 'border-blue-500/20 bg-blue-500/[0.08] text-blue-100'
  }

  if (tone === 'critical') {
    return 'border-red-500/20 bg-red-500/[0.08] text-red-100'
  }

  return 'border-white/10 bg-white/[0.04] text-text-secondary'
}

function FilterSelect({ icon: Icon, label, value, options, onChange }) {
  return (
    <div className="glass-panel flex items-center gap-3 rounded-[20px] px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.04] text-cyan-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">{label}</div>
        <div className="relative mt-1">
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full appearance-none bg-transparent pr-6 text-sm text-white outline-none"
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-panel text-white">
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
        </div>
      </div>
    </div>
  )
}

function FocusRow({ label, items, emptyLabel }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">{label}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span
              key={`${label}-${item.label}`}
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${getToneClass(item.tone)}`}
            >
              {item.label}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-dashed border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {emptyLabel}
          </span>
        )}
      </div>
    </div>
  )
}

function FeaturedStoryCard({ event, active, saved, onOpenEvent, onToggleSave }) {
  const fallbackImage = makeFallbackImage(event.title, event.severity === 'critical' ? '#EF4444' : '#22D3EE')

  return (
    <Panel
      interactive
      spotlight
      active={active}
      onClick={() => onOpenEvent(event.id, 'for-you')}
      className="group w-full cursor-pointer overflow-hidden p-0 text-left"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpenEvent(event.id, 'for-you')
        }
      }}
    >
      <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[280px] overflow-hidden">
          <img
            src={event.previewImage}
            alt={event.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-crisp group-hover:scale-[1.02]"
            onError={(eventTarget) => {
              eventTarget.currentTarget.src = fallbackImage
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute left-5 top-5">
            <SeverityBadge severity={event.severity} />
          </div>
          <div className="absolute right-5 top-5 flex items-center gap-2">
            <button
              type="button"
              aria-label={saved ? 'Remove bookmark' : 'Save event'}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation()
                onToggleSave?.(event.id)
              }}
              className="glass-panel glass-panel--interactive flex h-9 w-9 items-center justify-center rounded-full"
            >
              <Bookmark className={`h-4 w-4 ${saved ? 'fill-cyan-400 text-cyan-400' : 'text-text-secondary'}`} />
            </button>
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/90">
              {formatTimeAgo(event.updatedAt ?? event.publishedAt, { compact: true })}
            </span>
          </div>
          <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
            {event.matchPills.map((pill) => (
              <span
                key={`${event.id}-${pill.label}`}
                className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${getToneClass(pill.tone)}`}
              >
                {pill.label}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-7">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">Top match</div>
          <h3 className="mt-3 font-display text-[28px] font-semibold tracking-tightish text-white md:text-[34px]">
            {event.title}
          </h3>
          {event.personalizationNote ? (
            <p className="mt-3 text-sm leading-6 text-cyan-100/85">{event.personalizationNote}</p>
          ) : null}
          <p className="mt-4 text-[14px] leading-7 text-text-secondary">{event.previewText}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {formatTimeAgo(event.updatedAt ?? event.publishedAt)}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function StorySection({ title, items, onOpenEvent, activeEventId, savedEventIds, onToggleSave }) {
  if (!items.length) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[24px] font-medium tracking-tightish text-white">{title}</h3>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          {items.length}
        </span>
      </div>

      <div className="thin-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3">
        {items.map((event) => (
          <div
            key={event.id}
            className="w-[86vw] min-w-[280px] max-w-[360px] shrink-0 snap-start sm:w-[340px] xl:w-[360px]"
          >
            <EventCard
              event={event}
              note={event.personalizationNote}
              highlights={event.matchPills}
              active={activeEventId === event.id}
              showBookmark
              saved={savedEventIds.has(event.id)}
              onToggleSave={onToggleSave}
              onClick={() => onOpenEvent(event.id, 'for-you')}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function UserPage({ onOpenEvent, activeEventId }) {
  const { profile, idToken, saveEvent: saveUserEvent, unsaveEvent } = useAuthSession()
  const { data: allEvents, loading: eventsLoading } = useEvents(profile?.language ?? 'en')
  const [tab, setTab] = useState('watchlists')
  const [savedEvents, setSavedEvents] = useState([])
  const [savedLoading, setSavedLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    let active = true

    if (!idToken) {
      setSavedEvents([])
      setSavedLoading(false)
      return () => {
        active = false
      }
    }

    setSavedLoading(true)

    api
      .getSavedEvents({ token: idToken })
      .then((response) => {
        if (!active) return
        setSavedEvents(Array.isArray(response) ? response : [])
      })
      .catch((error) => {
        console.error('Failed to fetch saved events:', error)
        if (active) {
          setSavedEvents([])
        }
      })
      .finally(() => {
        if (active) {
          setSavedLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [idToken, profile?.savedEvents])

  const explicitCategories = useMemo(
    () => new Set((profile?.preferences?.categories ?? []).map((category) => category)),
    [profile?.preferences?.categories],
  )
  const explicitCountries = useMemo(
    () => new Set(profile?.preferences?.countries ?? []),
    [profile?.preferences?.countries],
  )
  const learnedCategoryCounts = useMemo(
    () => buildCountMap(savedEvents.map((event) => normalizeEventCategory(event.category))),
    [savedEvents],
  )
  const learnedCountryCounts = useMemo(
    () => buildCountMap(savedEvents.map((event) => getEventCountryLabel(event))),
    [savedEvents],
  )
  const savedEventIds = useMemo(() => new Set(profile?.savedEvents ?? []), [profile?.savedEvents])

  const suggestedEvents = useMemo(() => {
    return allEvents
      .filter((event) => !savedEventIds.has(event.id))
      .map((event) => {
        const categoryKey = normalizeEventCategory(event.category)
        const countryLabel = getEventCountryLabel(event)
        const updatedAtMs = new Date(event.updatedAt || event.startedAt || Date.now()).getTime()
        const safeUpdatedAtMs = Number.isFinite(updatedAtMs) ? updatedAtMs : Date.now()
        const freshnessScore = Math.max(0, 3.2 - (Date.now() - safeUpdatedAtMs) / (30 * 60 * 60 * 1000))
        const severityScore =
          {
            critical: 4.2,
            high: 3.2,
            medium: 2.2,
            low: 1.2,
            info: 0.8,
          }[event.severity] ?? 1

        const explicitCategoryMatch = explicitCategories.has(categoryKey)
        const explicitCountryMatch = explicitCountries.has(countryLabel)
        const learnedCategoryStrength = learnedCategoryCounts.get(categoryKey) ?? 0
        const learnedCountryStrength = learnedCountryCounts.get(countryLabel) ?? 0
        const matchBucket =
          explicitCategoryMatch || explicitCountryMatch
            ? 'preferences'
            : learnedCategoryStrength || learnedCountryStrength
              ? 'saved'
              : event.severity === 'critical' || event.severity === 'high'
                ? 'critical'
                : 'live'

        return {
          ...event,
          categoryKey,
          countryLabel,
          updatedAtMs: safeUpdatedAtMs,
          explicitCategoryMatch,
          explicitCountryMatch,
          learnedCategoryStrength,
          learnedCountryStrength,
          matchBucket,
          isFresh: Date.now() - safeUpdatedAtMs < 24 * 60 * 60 * 1000,
          suggestionScore:
            (explicitCategoryMatch ? 12 : 0) +
            (explicitCountryMatch ? 9 : 0) +
            learnedCategoryStrength * 4.5 +
            learnedCountryStrength * 3.25 +
            freshnessScore +
            severityScore +
            (matchBucket === 'critical' ? 1.5 : 0),
          matchPills: buildMatchPills({
            explicitCountryMatch,
            explicitCategoryMatch,
            learnedCountryStrength,
            learnedCategoryStrength,
            countryLabel,
            categoryKey,
            severity: event.severity,
          }),
          personalizationNote: buildSuggestionReason({
            explicitCountryMatch,
            explicitCategoryMatch,
            learnedCountryStrength,
            learnedCategoryStrength,
            countryLabel,
            categoryKey,
            severity: event.severity,
          }),
        }
      })
      .sort((a, b) => b.suggestionScore - a.suggestionScore || b.updatedAtMs - a.updatedAtMs)
  }, [allEvents, explicitCategories, explicitCountries, learnedCategoryCounts, learnedCountryCounts, savedEventIds])

  const countryOptions = useMemo(() => {
    const countries = Array.from(
      new Set([
        ...suggestedEvents.map((event) => event.countryLabel),
        ...(profile?.preferences?.countries ?? []),
      ]),
    ).filter(Boolean)

    return [{ value: 'all', label: 'All countries' }, ...countries.sort().map((country) => ({ value: country, label: country }))]
  }, [profile?.preferences?.countries, suggestedEvents])

  const severityOptions = useMemo(
    () => [
      { value: 'all', label: 'All severities' },
      ...severityOrder.map((severity) => ({
        value: severity,
        label: getSeverityConfig(severity).label,
      })),
    ],
    [],
  )

  const filteredSuggestedEvents = useMemo(() => {
    return suggestedEvents.filter((event) => {
      if (countryFilter !== 'all' && event.countryLabel !== countryFilter) return false
      if (severityFilter !== 'all' && event.severity !== severityFilter) return false

      if (dateFilter !== 'all') {
        const threshold = dateThresholds[dateFilter]
        if (Date.now() - event.updatedAtMs > threshold) return false
      }

      return true
    })
  }, [countryFilter, dateFilter, severityFilter, suggestedEvents])

  const followingItems = useMemo(() => {
    const countryItems = (profile?.preferences?.countries ?? []).slice(0, 3).map((country) => ({
      label: country,
      tone: 'match',
    }))
    const topicItems = (profile?.preferences?.categories ?? []).slice(0, 3).map((category) => ({
      label: getPreferenceCategoryLabel(category),
      tone: 'match',
    }))

    return [...countryItems, ...topicItems].slice(0, 6)
  }, [profile?.preferences?.categories, profile?.preferences?.countries])

  const forYouLayout = useMemo(() => {
    const topMatch = filteredSuggestedEvents[0] ?? null
    const usedIds = new Set(topMatch ? [topMatch.id] : [])

    const pick = (predicate, limit = Number.POSITIVE_INFINITY) => {
      const items = []

      for (const event of filteredSuggestedEvents) {
        if (usedIds.has(event.id) || !predicate(event)) continue
        items.push(event)
        usedIds.add(event.id)

        if (Number.isFinite(limit) && items.length >= limit) {
          break
        }
      }

      return items
    }

    const preferenceMatches = pick((event) => event.matchBucket === 'preferences')
    const savedMatches = pick((event) => event.matchBucket === 'saved')
    const criticalMatches = pick((event) => event.matchBucket === 'critical')
    const liveMatches = pick(() => true)
    const sections = []

    if (preferenceMatches.length) {
      sections.push({ id: 'preferences', title: 'Matches your preferences', items: preferenceMatches })
    }

    if (savedMatches.length) {
      sections.push({ id: 'saved', title: 'Based on what you save', items: savedMatches })
    }

    if (criticalMatches.length) {
      sections.push({ id: 'critical', title: 'Critical right now', items: criticalMatches })
    }

    if (liveMatches.length) {
      sections.push({
        id: 'live',
        title: sections.length ? 'More worth a look' : 'Live right now',
        items: liveMatches,
      })
    }

    return { topMatch, sections }
  }, [filteredSuggestedEvents])

  const hasActiveFilters = countryFilter !== 'all' || severityFilter !== 'all' || dateFilter !== 'all'

  const handleRemoveSavedEvent = async (eventId) => {
    try {
      await unsaveEvent(eventId)
      setSavedEvents((current) => current.filter((event) => event.id !== eventId))
    } catch (error) {
      console.error('Failed to remove saved event:', error)
    }
  }

  const handleSaveSuggestedEvent = async (eventId) => {
    try {
      await saveUserEvent(eventId)
    } catch (error) {
      console.error('Failed to save suggested event:', error)
    }
  }

  return (
    <section className="relative z-10 mx-auto max-w-[1280px] px-6 py-16 pb-28">
      <div className="max-w-[780px]">
        <h1 className="font-display text-[42px] font-semibold tracking-snug text-white md:text-[54px]">For You</h1>
      </div>

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

      {tab === 'watchlists' ? (
        <div className="mt-8 space-y-4">
          <Panel className="overflow-hidden p-6 md:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_34%)]" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-[620px]">
                <h2 className="font-display text-[30px] font-semibold tracking-tightish text-white md:text-[36px]">For You Settings</h2>

                <div className="mt-5">
                  <FocusRow label="Following" items={followingItems} emptyLabel="Pick countries or topics" />
                </div>
              </div>

              <div className="w-full xl:max-w-[700px]">
                <div className="grid gap-3 md:grid-cols-3">
                  <FilterSelect
                    icon={MapPinned}
                    label="Country"
                    value={countryFilter}
                    options={countryOptions}
                    onChange={setCountryFilter}
                  />
                  <FilterSelect
                    icon={Sparkles}
                    label="Severity"
                    value={severityFilter}
                    options={severityOptions}
                    onChange={setSeverityFilter}
                  />
                  <FilterSelect
                    icon={CalendarRange}
                    label="Time"
                    value={dateFilter}
                    options={dateOptions}
                    onChange={setDateFilter}
                  />
                </div>

                {hasActiveFilters ? (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setCountryFilter('all')
                        setSeverityFilter('all')
                        setDateFilter('all')
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary transition hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear filters
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

          </Panel>

          {eventsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[360px] w-full rounded-[28px]" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-[360px] w-full rounded-[24px]" />
                ))}
              </div>
            </div>
          ) : filteredSuggestedEvents.length ? (
            <div className="space-y-4">
              {forYouLayout.topMatch ? (
                <FeaturedStoryCard
                  event={forYouLayout.topMatch}
                  active={activeEventId === forYouLayout.topMatch.id}
                  saved={savedEventIds.has(forYouLayout.topMatch.id)}
                  onOpenEvent={onOpenEvent}
                  onToggleSave={handleSaveSuggestedEvent}
                />
              ) : null}

              {forYouLayout.sections.map((section) => (
                <StorySection
                  key={section.id}
                  title={section.title}
                  items={section.items}
                  onOpenEvent={onOpenEvent}
                  activeEventId={activeEventId}
                  savedEventIds={savedEventIds}
                  onToggleSave={handleSaveSuggestedEvent}
                />
              ))}
            </div>
          ) : (
            <Panel className="px-6 py-14 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/[0.08] text-cyan-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="mt-4 font-display text-[24px] font-medium text-white">No matches</div>
              <div className="mt-2 text-sm leading-6 text-text-secondary">Try fewer filters.</div>
            </Panel>
          )}
        </div>
      ) : null}

      {tab === 'saved' ? (
        <div className="mt-8 space-y-4">
          <Panel className="overflow-hidden p-6 md:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.1),transparent_30%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display text-[30px] font-semibold tracking-tightish text-white md:text-[36px]">Saved</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Saved', value: savedEvents.length },
                  { label: 'Critical', value: savedEvents.filter((event) => event.severity === 'critical').length },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                    <div className="font-display text-[26px] font-medium tracking-tightish text-white">{item.value}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {savedLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-[360px] w-full rounded-[24px]" />
              ))}
            </div>
          ) : (
            <SavedEventsGrid events={savedEvents} onOpenEvent={onOpenEvent} onToggleSave={handleRemoveSavedEvent} />
          )}
        </div>
      ) : null}
    </section>
  )
}
