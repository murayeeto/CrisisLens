import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useCampaigns({ eventId, includeInactive = false } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(Boolean(eventId))
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!eventId) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.getCampaigns({ eventId, includeInactive })
      setData(Array.isArray(response) ? response : [])
    } catch (err) {
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [eventId, includeInactive])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}

export function useCampaign(campaignId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(campaignId))
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!campaignId) {
      setData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.getCampaign(campaignId)
      setData(response)
    } catch (err) {
      setError(err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load, setData }
}

export function useMyCampaigns(token) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!token) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.getMyCampaigns({ token })
      setData(Array.isArray(response) ? response : [])
    } catch (err) {
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}

export function useCampaignReviewQueue(token) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!token) {
      setData([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.getCampaignReviewQueue({ token })
      setData(Array.isArray(response) ? response : [])
    } catch (err) {
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load }
}
