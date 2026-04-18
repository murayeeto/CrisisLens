import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useUser() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getMe()
      setData(response)
    } catch (err) {
      console.error('Failed to fetch user:', err)
      // User not logged in or error - set to null
      setData(null)
      setError(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
