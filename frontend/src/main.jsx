import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import './index.css'
import App from './App'
import { AuthSessionProvider } from './providers/AuthSessionProvider'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthSessionProvider>
      <App />
    </AuthSessionProvider>
  </React.StrictMode>,
)

// Development utilities - loaded after React renders
if (import.meta.env.DEV) {
  ;(async () => {
    const { migrateEventsToFirestore, syncEventsWithAPI } = await import('./lib/migration.js')
    const { getEventsFromFirestore, clearAllEventsFromFirestore } = await import('./lib/firebaseEvents.js')
    
    window.__crisisLensDev = {
      migrateEvents: migrateEventsToFirestore,
      syncEvents: syncEventsWithAPI,
      getFirestoreEvents: getEventsFromFirestore,
      clearFirestoreEvents: clearAllEventsFromFirestore,
      help: () => {
        console.log(`
CrisisLens Development Tools:
  __crisisLensDev.migrateEvents()       - Migrate events from API to Firestore
  __crisisLensDev.syncEvents()          - Sync events with API
  __crisisLensDev.getFirestoreEvents()  - Get all events from Firestore
  __crisisLensDev.clearFirestoreEvents()- Clear all events from Firestore (WARNING: destructive)
        `)
      }
    }
    
    console.log('CrisisLens Dev Tools loaded. Run __crisisLensDev.help() for usage.')
  })()
}
