const BASE_URL = import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const API_TIMEOUT = 45000 // 45 seconds for real API calls (needs time for geocoding + AI analysis)

async function fetch_api(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, API_TIMEOUT)

  try {
    const { token, headers: customHeaders, ...requestOptions } = options
    const response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...customHeaders,
      },
      ...requestOptions,
    })

    if (!response.ok) {
      let errorBody = null
      try {
        errorBody = await response.json()
      } catch (_error) {
        errorBody = null
      }

      const error = new Error(errorBody?.error || `HTTP ${response.status}: ${response.statusText}`)
      error.status = response.status
      error.body = errorBody
      throw error
    }

    return await response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`[CrisisLens API] Timeout (${API_TIMEOUT}ms): ${path}`, error)
      throw new Error(`Request timeout after ${API_TIMEOUT}ms`)
    }
    console.error(`[CrisisLens API] Error: ${path}`, error)
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const api = {
  getEvents: ({ language, limit } = {}) => {
    const params = new URLSearchParams()
    if (language) params.set('language', language)
    if (limit) params.set('limit', String(limit))
    const search = params.toString()
    return fetch_api(`/api/events${search ? `?${search}` : ''}`)
  },
  getEvent: (id) => fetch_api(`/api/events/${id}`),
  translateEvent: (id, language) =>
    fetch_api(`/api/events/${id}/translate`, {
      method: 'POST',
      body: JSON.stringify({ language }),
    }),
  getTrending: () => fetch_api('/api/news/trending'),
  getCampaigns: ({ eventId, includeInactive } = {}) => {
    const params = new URLSearchParams()
    if (eventId) params.set('eventId', eventId)
    if (includeInactive) params.set('includeInactive', 'true')
    const search = params.toString()
    return fetch_api(`/api/campaigns${search ? `?${search}` : ''}`)
  },
  getCampaign: (campaignId) => fetch_api(`/api/campaigns/${campaignId}`),
  getMyCampaigns: ({ token } = {}) => fetch_api('/api/campaigns/me', { token }),
  getCampaignReviewQueue: ({ token } = {}) => fetch_api('/api/campaigns/review-queue', { token }),
  createCampaign: (payload, { token } = {}) =>
    fetch_api('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),
  updateCampaign: (campaignId, payload, { token } = {}) =>
    fetch_api(`/api/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      token,
    }),
  reviewCampaign: (campaignId, payload, { token } = {}) =>
    fetch_api(`/api/campaigns/${campaignId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),
  createCampaignCheckoutSession: (campaignId, payload) =>
    fetch_api(`/api/campaigns/${campaignId}/checkout-session`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDonationSession: (sessionId) => fetch_api(`/api/donations/session/${sessionId}`),
  getMe: ({ token } = {}) => fetch_api('/api/users/me', { token }),
  updateMe: (payload, { token } = {}) =>
    fetch_api('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
      token,
    }),
  getSavedEvents: ({ token } = {}) => fetch_api('/api/users/me/saved-events', { token }),
  saveEvent: (eventId, { token } = {}) =>
    fetch_api(`/api/users/me/saved-events/${eventId}`, { method: 'POST', token }),
  unsaveEvent: (eventId, { token } = {}) =>
    fetch_api(`/api/users/me/saved-events/${eventId}`, { method: 'DELETE', token }),
}
