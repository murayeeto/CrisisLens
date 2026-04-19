import { useCallback, useEffect, useState } from 'react'
import { getEventsFromFirestore } from '../lib/firebaseEvents'
import { migrateEventsToFirestore } from '../lib/migration'
import { getCached, setCached, clearCache } from '../lib/cache'
import { api } from '../lib/api'

export function useEvents() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Check cache first
      const cached = getCached('events')
      if (cached) {
        console.log('[useEvents] Loading from cache')
        setData(Array.isArray(cached) ? cached : [])
        setLoading(false)
        
        // Still load from Firestore in background for fresh data
        try {
          const firestoreEvents = await getEventsFromFirestore()
          setData(firestoreEvents)
          setCached('events', firestoreEvents)
        } catch (err) {
          console.warn('[useEvents] Background Firestore sync failed:', err.message)
          // If Firestore fails due to permissions, try API
          if (err.message.includes('permission')) {
            try {
              const apiEvents = await api.getEvents()
              setData(apiEvents)
              setCached('events', apiEvents)
            } catch (apiErr) {
              console.warn('[useEvents] API fallback also failed:', apiErr.message)
            }
          }
        }
        return
      }

      console.log('[useEvents] Fetching events from Firestore...')
      
      try {
        // Try to get events from Firestore
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
        // If Firestore fails (e.g., permission error), fall back to API
        console.warn('[useEvents] Firestore access failed:', firestoreErr.message)
        console.log('[useEvents] Falling back to API...')
        
        const apiEvents = await api.getEvents()
        if (!Array.isArray(apiEvents) || apiEvents.length === 0) {
          throw new Error('No events from API either')
        }
        
        console.log('[useEvents] Successfully fetched', apiEvents.length, 'events from API')
        setData(apiEvents)
        setCached('events', apiEvents)
      }
    } catch (err) {
      console.error('[useEvents] Failed to fetch events:', err.message)
      setError(err)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, error, refetch: load, clearCache: () => clearCache('events') }
}
