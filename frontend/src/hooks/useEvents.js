import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getCached, setCached, clearCache } from '../lib/cache'

export function useEvents() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Check cache first
      const cached = getCached('events')
      if (cached) {
        console.log('[useEvents] Loading from cache')
        setData(Array.isArray(cached) ? cached : [])
        setLoading(false)
        return
      }

      console.log('[useEvents] Fetching events from API...')
      const response = await api.getEvents()
      console.log('[useEvents] Successfully fetched', Array.isArray(response) ? response.length : 0, 'events')
      const eventData = Array.isArray(response) ? response : []
      setData(eventData)
      
      // Store in cache
      setCached('events', eventData)
    } catch (err) {
      console.error('[useEvents] Failed to fetch events:', err.message)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load, clearCache: () => clearCache('events') }
}
