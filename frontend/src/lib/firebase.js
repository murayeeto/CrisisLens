import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAKiO_m1ybX7slA_bAJ8_pivl7HGol0U4A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "crisislens-8cb5d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "crisislens-8cb5d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "crisislens-8cb5d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "436605639778",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:436605639778:web:48e6d2ac4a74cb712c053b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-B5TYXKFF9Y",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Emulators disabled - using production Firebase
// if (import.meta.env.DEV) {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
//   } catch (e) {}
//   
//   try {
//     connectFirestoreEmulator(db, 'localhost', 8080)
//   } catch (e) {}
// }

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app)
      }
    })
    .catch((error) => {
      console.warn('Firebase analytics unavailable in this environment:', error)
    })
}

export default app
