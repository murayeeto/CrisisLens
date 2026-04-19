import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getCached, setCached } from '../lib/cache'

const DETAIL_CACHE_PREFIX = 'event-detail:'

function getCachedEventDetail(id) {
  if (!id) return null

  const detail = getCached(`${DETAIL_CACHE_PREFIX}${id}`)
  if (detail) return detail

  const cachedEvents = getCached('events')
  if (Array.isArray(cachedEvents)) {
    const match = cachedEvents.find((event) => event?.id === id)
    if (match) return match
  }

  return null
}

function cacheEventDetail(event) {
  if (!event?.id) return

  setCached(`${DETAIL_CACHE_PREFIX}${event.id}`, event)

  const cachedEvents = getCached('events')
  if (!Array.isArray(cachedEvents)) return

  const nextEvents = cachedEvents.some((item) => item?.id === event.id)
    ? cachedEvents.map((item) => (item?.id === event.id ? { ...item, ...event } : item))
    : [event, ...cachedEvents]

  setCached('events', nextEvents)
}

export function useEventDetail(id) {
  const [data, setData] = useState(() => getCachedEventDetail(id))
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    const cachedDetail = getCachedEventDetail(id)
    setData(cachedDetail)
    setLoading(true)
    setError(null)
    try {
      const response = await api.getEvent(id)
      setData(response)
      cacheEventDetail(response)
    } catch (err) {
      if (!cachedDetail) {
        setData(null)
      }
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
