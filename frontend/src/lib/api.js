import { mock } from './mockData'

const BASE_URL = import.meta.env.VITE_API_BASE ?? ''
const loggedFallbacks = new Set()

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const logFallback = (path, reason) => {
  const key = `${path}:${reason}`
  if (loggedFallbacks.has(key)) return
  loggedFallbacks.add(key)
  console.info(`[CrisisLens mock] ${path} -> ${reason}`)
}

const clone = (value) => structuredClone(value)

async function safeFetch(path, fallback) {
  const fallbackData = typeof fallback === 'function' ? fallback() : fallback

  if (!BASE_URL) {
    logFallback(path, 'VITE_API_BASE missing')
    await wait(400)
    return clone(fallbackData)
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 1200)

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'timeout' : error?.message ?? 'request failed'
    logFallback(path, reason)
    await wait(400)
    return clone(fallbackData)
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const api = {
  getEvents: () => safeFetch('/api/events', mock.events),
  getEvent: (id) => safeFetch(`/api/events/${id}`, mock.eventDetail(id)),
  getTrending: () => safeFetch('/api/news/trending', mock.trending),
  getMe: () => safeFetch('/api/auth/me', mock.user),
  getSavedEvents: () => safeFetch('/api/users/saved-events', mock.savedEvents),
}
