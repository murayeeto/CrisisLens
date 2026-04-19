import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getCached, setCached, clearCache } from '../lib/cache'

export function useTrending() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Always load fresh from API (skip cache)
      console.log('[useTrending] Fetching trending news from API...')
      const response = await api.getTrending()
      console.log('[useTrending] Successfully fetched', Array.isArray(response) ? response.length : 0, 'articles')
      const trendingData = Array.isArray(response) ? response : []
      setData(trendingData)
      
      // Store in cache for offline access (but always load fresh from API first)
      setCached('trending', trendingData)
    } catch (err) {
      console.error('[useTrending] Failed to fetch trending news:', err.message)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load, clearCache: () => clearCache('trending') }
}
