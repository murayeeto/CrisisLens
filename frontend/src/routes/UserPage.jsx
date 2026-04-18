import {
  BookmarkCheck,
  CalendarRange,
  ChevronDown,
  MapPinned,
  Radar,
  Settings2,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useUser } from '../hooks/useUser'
import { useEvents } from '../hooks/useEvents'
import { getSeverityConfig, severityOrder } from '../lib/severity'
import { ProfileHeader } from '../components/user/ProfileHeader'
import { SavedEventsGrid } from '../components/user/SavedEventsGrid'
import { EventCard } from '../components/event/EventCard'
import { Panel } from '../components/ui/Panel'
import { Skeleton } from '../components/ui/Skeleton'

const tabs = [
  { id: 'saved', label: 'Saved intel', icon: BookmarkCheck },
  { id: 'watchlists', label: 'AI watchlist', icon: Radar },
  { id: 'settings', label: 'Preferences', icon: Settings2 },
]

const countryLabels = {
  US: 'United States',
  PH: 'Philippines',
  NL: 'Netherlands',
  JP: 'Japan',
  GB: 'United Kingdom',
  ES: 'Spain',
  AR: 'Argentina',
  DE: 'Germany',
}

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

const formatCategoryLabel = (category = 'signal') =>
  category
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const getCountryLabel = (event) => {
  if (countryLabels[event.countryCode]) return countryLabels[event.countryCode]
  const parts = event.location?.split(',') ?? []
  return parts.length ? parts[parts.length - 1].trim() : 'Unknown'
}

const buildReason = (event, preferredCategories, preferredCountries) => {
  const countryLabel = getCountryLabel(event)

  if (preferredCategories.has(event.category) && preferredCountries.has(countryLabel)) {
    return `You keep checking ${formatCategoryLabel(event.category).toLowerCase()} updates in ${countryLabel}.`
  }

  if (preferredCategories.has(event.category)) {
    return `You’ve been following ${formatCategoryLabel(event.category).toLowerCase()} updates.`
  }

  if (preferredCountries.has(countryLabel)) {
    return `You often check signals in ${countryLabel}.`
  }

  if (event.severity === 'critical' || event.severity === 'high') {
    return 'This is a higher-severity signal worth a look.'
  }

  return 'This is picking up momentum in the feed.'
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

export default function UserPage({ onOpenEvent, activeEventId }) {
  const { data: user, loading } = useUser()
  const { data: allEvents } = useEvents()
  const [tab, setTab] = useState('saved')
  const [savedEvents, setSavedEvents] = useState([])
  const [savedLoading, setSavedLoading] = useState(true)
  const [countryFilter, setCountryFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    let active = true

    api
      .getSavedEvents()
      .then((response) => {
        if (!active) return
        setSavedEvents(Array.isArray(response) ? response : [])
        setSavedLoading(false)
      })
      .catch((error) => {
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

  const savedEventIds = useMemo(() => new Set(user?.savedEventIds ?? []), [user?.savedEventIds])

  const savedContextEvents = useMemo(
    () => allEvents.filter((event) => savedEventIds.has(event.id)),
    [allEvents, savedEventIds],
  )

  const preferredCategories = useMemo(
    () => new Set(savedContextEvents.map((event) => event.category)),
    [savedContextEvents],
  )

  const preferredCountries = useMemo(
    () => new Set(savedContextEvents.map((event) => getCountryLabel(event))),
    [savedContextEvents],
  )

  const activityPills = useMemo(() => {
    const pills = []

    savedContextEvents.slice(0, 2).forEach((event) => {
      const label = formatCategoryLabel(event.category)
      if (!pills.includes(label)) pills.push(label)
    })

    savedContextEvents.forEach((event) => {
      const countryLabel = getCountryLabel(event)
      if (!pills.includes(countryLabel) && pills.length < 3) {
        pills.push(countryLabel)
      }
    })

    if (
      savedContextEvents.some((event) => event.severity === 'critical' || event.severity === 'high') &&
      !pills.includes('Higher severity')
    ) {
      pills.push('Higher severity')
    }

    return pills.slice(0, 3)
  }, [savedContextEvents])

  const suggestedEvents = useMemo(() => {
    return allEvents
      .filter((event) => !savedEventIds.has(event.id))
      .map((event) => {
        const countryLabel = getCountryLabel(event)
        const updatedDiff = Date.now() - new Date(event.updatedAt).getTime()
        const freshnessScore = Math.max(0, 2.2 - updatedDiff / (36 * 60 * 60 * 1000))
        const severityScore =
          {
            critical: 3,
            high: 2.4,
            moderate: 1.6,
            low: 0.9,
            info: 0.4,
          }[event.severity] ?? 0

        const relevanceScore =
          (preferredCategories.has(event.category) ? 3.2 : 0) +
          (preferredCountries.has(countryLabel) ? 1.8 : 0) +
          freshnessScore +
          severityScore

        return {
          ...event,
          countryLabel,
          suggestionScore: relevanceScore,
          suggestionReason: buildReason(event, preferredCategories, preferredCountries),
        }
      })
      .sort(
        (a, b) =>
          b.suggestionScore - a.suggestionScore || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }, [allEvents, preferredCategories, preferredCountries, savedEventIds])

  const countryOptions = useMemo(() => {
    const countries = Array.from(new Set(suggestedEvents.map((event) => event.countryLabel))).sort()
    return [{ value: 'all', label: 'All countries' }, ...countries.map((country) => ({ value: country, label: country }))]
  }, [suggestedEvents])

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
        if (Date.now() - new Date(event.updatedAt).getTime() > threshold) return false
      }

      return true
    })
  }, [countryFilter, dateFilter, severityFilter, suggestedEvents])

  const hasActiveFilters = countryFilter !== 'all' || severityFilter !== 'all' || dateFilter !== 'all'

  const watchlistStats = useMemo(
    () => [
      { label: 'Suggestions in view', value: filteredSuggestedEvents.length },
      { label: 'Countries', value: new Set(filteredSuggestedEvents.map((event) => event.countryLabel)).size },
      {
        label: 'High priority',
        value: filteredSuggestedEvents.filter((event) => event.severity === 'critical' || event.severity === 'high').length,
      },
      {
        label: 'Updated 24h',
        value: filteredSuggestedEvents.filter((event) => Date.now() - new Date(event.updatedAt).getTime() < 24 * 60 * 60 * 1000).length,
      },
    ],
    [filteredSuggestedEvents],
  )

  return (
    <section className="relative z-10 mx-auto max-w-[1280px] px-6 py-16 pb-28">
      <div className="max-w-[760px]">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-400">◦ Account overview</div>
        <h1 className="mt-4 font-display text-[42px] font-semibold tracking-snug text-white md:text-[54px]">Account</h1>
        <p className="mt-4 text-lg leading-8 text-text-secondary">
          Save what matters and review AI suggestions in one clean view.
        </p>
      </div>

      <div className="mt-8">
        {loading || !user ? <Skeleton className="h-[260px] w-full rounded-[28px]" /> : <ProfileHeader user={user} />}
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
        <div className="mt-8 space-y-4">
          <Panel className="overflow-hidden p-6 md:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_34%)]" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-[560px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Suggested for you
                </div>
                <h2 className="mt-4 font-display text-[30px] font-semibold tracking-tightish text-white md:text-[36px]">
                  Suggested watchlist
                </h2>
                <p className="mt-3 max-w-[520px] text-[15px] leading-7 text-text-secondary">
                  Built from what you open and save most. It helps you spot related signals faster.
                </p>
                {activityPills.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activityPills.map((pill) => (
                      <span
                        key={pill}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                ) : null}
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
                    icon={ShieldAlert}
                    label="Severity"
                    value={severityFilter}
                    options={severityOptions}
                    onChange={setSeverityFilter}
                  />
                  <FilterSelect
                    icon={CalendarRange}
                    label="Date"
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

            <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {watchlistStats.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/8 bg-black/20 px-4 py-4">
                  <div className="font-display text-[26px] font-medium tracking-tightish text-white">{item.value}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{item.label}</div>
                </div>
              ))}
            </div>
          </Panel>

          {filteredSuggestedEvents.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredSuggestedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  note={event.suggestionReason}
                  active={activeEventId === event.id}
                  onClick={() => onOpenEvent(event.id, 'account')}
                />
              ))}
            </div>
          ) : (
            <Panel className="px-6 py-14 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-500/[0.08] text-cyan-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="mt-4 font-display text-[24px] font-medium text-white">No suggestions match these filters</div>
              <div className="mt-2 text-sm leading-6 text-text-secondary">
                Try a wider date range or clear one filter to bring more signals back in.
              </div>
            </Panel>
          )}
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Panel className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">Coverage regions</div>
            <div className="mt-3 font-display text-[22px] font-medium text-white">23 countries monitored</div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              We focus on North America, Europe, East Asia, and major shipping routes.
            </p>
          </Panel>
          <Panel className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">Alert cadence</div>
            <div className="mt-3 font-display text-[22px] font-medium text-white">Breaking only</div>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Critical and high-severity changes surface first. Everything else stays in the account view.
            </p>
          </Panel>
          <Panel className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-400">Saved views</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {['West Coast', 'Ports', 'Transit'].map((view) => (
                <span
                  key={view}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted"
                >
                  {view}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Saved views let you jump back into the same slice of the feed fast.
            </p>
          </Panel>
        </div>
      ) : null}
    </section>
  )
}
