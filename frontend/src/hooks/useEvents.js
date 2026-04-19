import { useCallback, useEffect, useState } from 'react'
import { getEventsFromFirestore } from '../lib/firebaseEvents'
import { migrateEventsToFirestore } from '../lib/migration'
import { getCached, setCached, clearCache } from '../lib/cache'
import { api } from '../lib/api'

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
        const apiEvents = await api.getEvents({ language })
        if (!Array.isArray(apiEvents) || apiEvents.length === 0) {
          throw new Error('No events from API')
        }
        
        console.log('[useEvents] Successfully fetched', apiEvents.length, 'translated events from API')
        setData(apiEvents)
        setCached('events', apiEvents)
      } else {
        // For English (default), load from Firestore first for performance
        console.log('[useEvents] Fetching events from Firestore...')
        
        try {
          let firestoreEvents = await getEventsFromFirestore()
          
          // If Firestore is empty, run migration from API
          if (firestoreEvents.length === 0) {
            console.log('[useEvents] Firestore is empty, running migration...')
            const migrationResult = await migrateEventsToFirestore()
            
            if (migrationResult.success || migrationResult.skipped) {
              firestoreEvents = await getEventsFromFirestore()
            } else {
              throw new Error('Migration failed and no events in Firestore')
            }
          }
          
          console.log('[useEvents] Successfully fetched', firestoreEvents.length, 'events from Firestore')
          console.log('[useEvents] Events with lat/lng:', firestoreEvents.filter(e => e.lat && e.lng).length)
          console.log('[useEvents] Sample events:', firestoreEvents.slice(0, 3).map(e => ({ id: e.id, title: e.title, lat: e.lat, lng: e.lng })))
          setData(firestoreEvents)
          
          // Cache for offline access
          setCached('events', firestoreEvents)
        } catch (firestoreErr) {
          // If Firestore fails, fall back to API
          console.warn('[useEvents] Firestore access failed:', firestoreErr.message)
          console.log('[useEvents] Falling back to API')
          
          const apiEvents = await api.getEvents({ language })
          if (!Array.isArray(apiEvents) || apiEvents.length === 0) {
            throw new Error('No events from API either')
          }
          
          console.log('[useEvents] Successfully fetched', apiEvents.length, 'events from API')
          setData(apiEvents)
          setCached('events', apiEvents)
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
