import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Globe2, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCommandPalette } from '../../hooks/useCommandPalette'
import { useEvents } from '../../hooks/useEvents'
import { useTrending } from '../../hooks/useTrending'
import { Kbd } from '../ui/Kbd'
import { Panel } from '../ui/Panel'

export function CommandPalette() {
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef(null)
  const { isOpen, close } = useCommandPalette()
  const { data: events } = useEvents()
  const { data: trending } = useTrending()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filter = (value) =>
      !term ||
      value
        .toLowerCase()
        .includes(term)

    const eventItems = events
      .filter((event) => filter(`${event.title} ${event.location} ${event.category}`))
      .slice(0, 4)
      .map((event) => ({
        key: event.id,
        group: 'EVENTS',
        title: event.title,
        meta: event.location,
        icon: Globe2,
        action: () => {
          if (location.pathname !== '/') navigate('/')
          close()
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('crisislens:open-event', {
                detail: { id: event.id, origin: 'command-palette' },
              }),
            )
          }, location.pathname === '/' ? 0 : 160)
        },
      }))

    const trendingItems = trending
      .filter((item) => filter(`${item.title} ${item.location} ${item.outlet}`))
      .slice(0, 3)
      .map((item) => ({
        key: item.id,
        group: 'TRENDING',
        title: item.title,
        meta: `${item.outlet} · ${item.location}`,
        icon: FileText,
        action: () => {
          navigate('/trending')
          close()
          if (item.eventId) {
            window.setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('crisislens:open-event', {
                  detail: { id: item.eventId, origin: 'command-palette' },
                }),
              )
            }, 180)
          }
        },
      }))

    return [
      { name: 'EVENTS', items: eventItems },
      { name: 'TRENDING', items: trendingItems },
    ].filter((group) => group.items.length > 0)
  }, [close, events, location.pathname, navigate, query, trending])

  const flatResults = useMemo(() => groups.flatMap((group) => group.items), [groups])

  useEffect(() => {
    if (!isOpen) return
    inputRef.current?.focus()
    setActiveIndex(0)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) => (flatResults.length ? (current + 1) % flatResults.length : 0))
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => (flatResults.length ? (current - 1 + flatResults.length) % flatResults.length : 0))
      }

      if (event.key === 'Enter') {
        const item = flatResults[activeIndex]
        if (item) {
          event.preventDefault()
          item.action()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, flatResults, isOpen])

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[560px]"
            onClick={(event) => event.stopPropagation()}
          >
            <Panel className="p-4">
              <div className="flex items-center gap-3 border-b border-white/8 px-2 pb-3">
                <Search className="h-4 w-4 text-text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search incidents, places, sources..."
                  className="w-full border-0 bg-transparent text-[15px] text-white outline-none placeholder:text-text-dim"
                />
              </div>

              <div className="max-h-[420px] overflow-y-auto py-2 thin-scrollbar">
                {groups.map((group) => (
                  <div key={group.name} className="px-2 pb-2 pt-3">
                    <div className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-dim">
                      {group.name}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const index = flatResults.findIndex((result) => result.key === item.key)
                        const Icon = item.icon
                        const active = activeIndex === index

                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={item.action}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                              active ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-cyan-400">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-white">{item.title}</div>
                              <div className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                                {item.meta}
                              </div>
                            </div>
                            <span className="opacity-0 transition group-hover:opacity-100">
                              <Kbd>↵</Kbd>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-white/8 px-2 pt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim">
                <span>↑↓ navigate &nbsp; ↵ open &nbsp; esc close</span>
                <span>· {flatResults.length} results</span>
              </div>
            </Panel>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
