import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKiO_m1ybX7slA_bAJ8_pivl7HGol0U4A",
  authDomain: "crisislens-8cb5d.firebaseapp.com",
  projectId: "crisislens-8cb5d",
  storageBucket: "crisislens-8cb5d.firebasestorage.app",
  messagingSenderId: "436605639778",
  appId: "1:436605639778:web:48e6d2ac4a74cb712c053b",
  measurementId: "G-B5TYXKFF9Y"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

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

const analytics = getAnalytics(app)
export default app
