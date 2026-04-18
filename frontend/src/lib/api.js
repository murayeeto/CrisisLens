const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'
const API_TIMEOUT = 45000 // 45 seconds for real API calls (needs time for geocoding + AI analysis)

async function fetch_api(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => {
    controller.abort()
  }, API_TIMEOUT)

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
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
  getEvents: () => fetch_api('/api/events'),
  getEvent: (id) => fetch_api(`/api/events/${id}`),
  getTrending: () => fetch_api('/api/news/trending'),
  getMe: () => fetch_api('/api/auth/me'),
  getSavedEvents: () => fetch_api('/api/users/saved-events'),
  saveEvent: (eventId) => fetch_api(`/api/users/me/saved-events/${eventId}`, { method: 'POST' }),
  unsaveEvent: (eventId) => fetch_api(`/api/users/me/saved-events/${eventId}`, { method: 'DELETE' }),
}
