import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useTrending() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getTrending()
      setData(Array.isArray(response) ? response : [])
    } catch (err) {
      console.error('Failed to fetch trending news:', err)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
