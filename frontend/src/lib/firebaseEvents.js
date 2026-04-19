import { db } from './firebase'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore'

const EVENTS_COLLECTION = 'events'

/**
 * Get all events from Firestore
 */
export async function getEventsFromFirestore() {
  try {
    const q = query(collection(db, EVENTS_COLLECTION), orderBy('updatedAt', 'desc'))
    const snapshot = await getDocs(q)
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    return events
  } catch (error) {
    console.error('[firebaseEvents] Error getting events:', error)
    throw error
  }
}

/**
 * Add a single event to Firestore
 */
export async function addEventToFirestore(event) {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...event,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return { id: docRef.id, ...event }
  } catch (error) {
    console.error('[firebaseEvents] Error adding event:', error)
    throw error
  }
}

/**
 * Add multiple events to Firestore in batch, checking for duplicates
 */
export async function addEventsToFirestore(events) {
  try {
    // Get existing event IDs and titles to check for duplicates
    const existingSnapshot = await getDocs(collection(db, EVENTS_COLLECTION))
    const existingIds = new Set(existingSnapshot.docs.map((doc) => doc.data().id))
    const existingTitles = new Set(existingSnapshot.docs.map((doc) => doc.data().title))
    
    const batch = writeBatch(db)
    const eventsRef = collection(db, EVENTS_COLLECTION)
    let addedCount = 0
    let duplicateCount = 0
    
    events.forEach((event) => {
      // Check if event already exists by ID or title
      if (existingIds.has(event.id) || existingTitles.has(event.title)) {
        console.log(`[firebaseEvents] Skipping duplicate event: ${event.title}`)
        duplicateCount++
        return
      }
      
      const docRef = doc(eventsRef)
      batch.set(docRef, {
        ...event,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      addedCount++
    })
    
    if (addedCount > 0) {
      await batch.commit()
      console.log(
        `[firebaseEvents] Successfully added ${addedCount} events (${duplicateCount} duplicates skipped)`
      )
    } else {
      console.log(`[firebaseEvents] No new events to add (${duplicateCount} duplicates skipped)`)
    }
    
    return events.filter((event) => !existingIds.has(event.id) && !existingTitles.has(event.title))
  } catch (error) {
    console.error('[firebaseEvents] Error adding events in batch:', error)
    throw error
  }
}

/**
 * Update an event in Firestore
 */
export async function updateEventInFirestore(eventId, updates) {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId)
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: new Date(),
    })
    return { id: eventId, ...updates }
  } catch (error) {
    console.error('[firebaseEvents] Error updating event:', error)
    throw error
  }
}

/**
 * Delete an event from Firestore
 */
export async function deleteEventFromFirestore(eventId) {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId))
    console.log(`[firebaseEvents] Event ${eventId} deleted`)
  } catch (error) {
    console.error('[firebaseEvents] Error deleting event:', error)
    throw error
  }
}

/**
 * Get events by severity
 */
export async function getEventsBySeverity(severity) {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('severity', '==', severity),
      orderBy('updatedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('[firebaseEvents] Error getting events by severity:', error)
    throw error
  }
}

/**
 * Get events by category
 */
export async function getEventsByCategory(category) {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('category', '==', category),
      orderBy('updatedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('[firebaseEvents] Error getting events by category:', error)
    throw error
  }
}

/**
 * Clear all events from Firestore (use with caution!)
 */
export async function clearAllEventsFromFirestore() {
  try {
    const snapshot = await getDocs(collection(db, EVENTS_COLLECTION))
    const batch = writeBatch(db)
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
    
    await batch.commit()
    console.log('[firebaseEvents] All events cleared from Firestore')
  } catch (error) {
    console.error('[firebaseEvents] Error clearing events:', error)
    throw error
  }
}
