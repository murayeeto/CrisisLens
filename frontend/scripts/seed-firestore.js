#!/usr/bin/env node

/**
 * CLI script to populate Firestore with events from the backend API
 * Usage: node scripts/seed-firestore.js
 */

import('firebase/app').then(async ({ initializeApp }) => {
  const { getFirestore } = await import('firebase/firestore')
  const { writeBatch, collection, doc } = await import('firebase/firestore')
  
  // Initialize Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyAKiO_m1ybX7slA_bAJ8_pivl7HGol0U4A",
    authDomain: "crisislens-8cb5d.firebaseapp.com",
    projectId: "crisislens-8cb5d",
    storageBucket: "crisislens-8cb5d.firebasestorage.app",
    messagingSenderId: "436605639778",
    appId: "1:436605639778:web:48e6d2ac4a74cb712c053b",
  }
  
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)
  
  // Fetch events from backend API
  console.log('[seed] Fetching events from backend API...')
  try {
    const response = await fetch('http://localhost:8000/api/events')
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    
    const events = await response.json()
    console.log(`[seed] Retrieved ${events.length} events from API`)
    
    if (events.length === 0) {
      console.warn('[seed] No events received from API')
      process.exit(1)
    }
    
    // Add events to Firestore in batch
    console.log('[seed] Adding events to Firestore...')
    const batch = writeBatch(db)
    const eventsRef = collection(db, 'events')
    
    events.forEach((event) => {
      const docRef = doc(eventsRef, event.id)
      batch.set(docRef, {
        ...event,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })
    
    await batch.commit()
    console.log(`[seed] ✓ Successfully added ${events.length} events to Firestore`)
    console.log('[seed] Seeding complete!')
    process.exit(0)
  } catch (error) {
    console.error('[seed] Error:', error.message)
    process.exit(1)
  }
})
