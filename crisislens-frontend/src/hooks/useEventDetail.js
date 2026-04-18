import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useEventDetail(id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.getEvent(id)
      setData(response)
    } catch (err) {
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
