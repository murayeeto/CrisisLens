import { useCallback, useEffect, useState } from 'react'
import { getEventsFromFirestore } from '../lib/firebaseEvents'
import { migrateEventsToFirestore } from '../lib/migration'
import { setCached, clearCache } from '../lib/cache'
import { api } from '../lib/api'
import { normalizeEvents } from '../lib/eventNormalization'

const parsedTargetCount = Number.parseInt(import.meta.env.VITE_EVENT_TARGET_COUNT ?? '200', 10)
const MIN_EVENT_COUNT = Number.isFinite(parsedTargetCount) && parsedTargetCount > 0 ? parsedTargetCount : 200

async function fetchApiEvents(language) {
  const apiEvents = await api.getEvents({ language, limit: MIN_EVENT_COUNT })
  const normalizedEvents = normalizeEvents(apiEvents)

  if (normalizedEvents.length === 0) {
    throw new Error('No events from API')
  }

  return normalizedEvents
}

async function fetchFirestoreEvents() {
  return normalizeEvents(await getEventsFromFirestore())
}

export function useEvents(language = 'en') {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // If user has selected a non-English language, fetch from API to get translations
      if (language && language !== 'en') {
        console.log('[useEvents] Language preference set to:', language, '- fetching from API for translation')
        const apiEvents = await fetchApiEvents(language)

        console.log('[useEvents] Successfully fetched', apiEvents.length, 'translated events from API')
        setData(apiEvents)
        setCached('events', apiEvents)
      } else {
        try {
          console.log('[useEvents] Fetching live events from API...')
          const apiEvents = await fetchApiEvents(language)
          console.log('[useEvents] Successfully fetched', apiEvents.length, 'events from API')
          setData(apiEvents)
          setCached('events', apiEvents)
        } catch (apiErr) {
          console.warn('[useEvents] API access failed:', apiErr.message)
          console.log('[useEvents] Falling back to Firestore...')

          let firestoreEvents = await fetchFirestoreEvents()

          if (firestoreEvents.length === 0) {
            console.log('[useEvents] Firestore is empty, running migration...')
            const migrationResult = await migrateEventsToFirestore(MIN_EVENT_COUNT)

            if (migrationResult.success || migrationResult.skipped) {
              firestoreEvents = await fetchFirestoreEvents()
            } else {
              throw new Error('Migration failed and no events in Firestore')
            }
          }

          if (firestoreEvents.length === 0) {
            throw new Error('No events available from API or Firestore')
          }

          console.log('[useEvents] Successfully fetched', firestoreEvents.length, 'events from Firestore')
          console.log('[useEvents] Events with lat/lng:', firestoreEvents.filter((event) => event.lat && event.lng).length)
          console.log(
            '[useEvents] Sample events:',
            firestoreEvents.slice(0, 3).map((event) => ({
              id: event.id,
              title: event.title,
              severity: event.severity,
              lat: event.lat,
              lng: event.lng,
            })),
          )
          setData(firestoreEvents)
          setCached('events', firestoreEvents)
        }
      }
    } catch (err) {
      console.error('[useEvents] Failed to fetch events:', err.message)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [language])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load, clearCache: () => clearCache('events') }
}
