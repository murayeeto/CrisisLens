/**
 * Migration utility to populate Firebase with current events from the API
 * This script should be run once to seed the database
 */

import { api } from './api'
import { addEventsToFirestore, getEventsFromFirestore } from './firebaseEvents'

/**
 * Migrate events from API to Firestore
 */
export async function migrateEventsToFirestore() {
  console.log('[migration] Starting event migration to Firestore...')
  
  try {
    // Check if events already exist in Firestore
    const existingEvents = await getEventsFromFirestore()
    if (existingEvents.length > 0) {
      console.log(`[migration] Firestore already has ${existingEvents.length} events. Migration skipped.`)
      return { skipped: true, count: existingEvents.length }
    }

    // Fetch events from API
    console.log('[migration] Fetching events from API...')
    const apiEvents = await api.getEvents()
    
    if (!Array.isArray(apiEvents) || apiEvents.length === 0) {
      console.warn('[migration] No events received from API')
      return { success: false, error: 'No events from API' }
    }

    console.log(`[migration] Fetched ${apiEvents.length} events from API`)
    
    // Add events to Firestore
    await addEventsToFirestore(apiEvents)
    
    console.log(`[migration] Successfully migrated ${apiEvents.length} events to Firestore`)
    return { success: true, count: apiEvents.length }
  } catch (error) {
    console.error('[migration] Failed to migrate events:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync events: get from API and update in Firestore
 * Call this periodically to keep events in sync
 */
export async function syncEventsWithAPI() {
  console.log('[migration] Starting event sync with API...')
  
  try {
    // Fetch fresh events from API
    const apiEvents = await api.getEvents()
    
    if (!Array.isArray(apiEvents) || apiEvents.length === 0) {
      console.warn('[migration] No events received from API')
      return { success: false, error: 'No events from API' }
    }

    // For now, we'll just log the sync
    // In the future, you might want to implement smart merging/updating logic
    console.log(`[migration] API returned ${apiEvents.length} events`)
    return { success: true, count: apiEvents.length }
  } catch (error) {
    console.error('[migration] Failed to sync events:', error)
    return { success: false, error: error.message }
  }
}
