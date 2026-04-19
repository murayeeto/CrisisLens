import {
  doc,
  getDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const USERS_COLLECTION = 'users'
const USER_SCHEMA = {
  uid: '',
  email: '',
  displayName: '',
  role: 'member',
  createdAt: '',
  updatedAt: '',
  savedEvents: [],
  preferences: {
    countries: [],
    categories: [],
  },
  onboardingCompleted: false,
}

export const createUserDocument = async (uid, userData) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    const userExists = await getDoc(userRef)
    
    if (!userExists.exists()) {
      await setDoc(userRef, {
        ...USER_SCHEMA,
        uid,
        ...userData,
        updatedAt: serverTimestamp(),
      })
    }
    return userRef
  } catch (error) {
    throw new Error(`Failed to create user document: ${error.message}`)
  }
}

export const getUserDocument = async (uid) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return userSnap.data()
    }
    return null
  } catch (error) {
    throw new Error(`Failed to fetch user document: ${error.message}`)
  }
}

export const updateUserDocument = async (uid, updates) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await setDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    throw new Error(`Failed to update user document: ${error.message}`)
  }
}

export const addSavedEvent = async (uid, eventId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await setDoc(userRef, {
      savedEvents: arrayUnion(eventId),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    throw new Error(`Failed to save event: ${error.message}`)
  }
}

export const removeSavedEvent = async (uid, eventId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await setDoc(userRef, {
      savedEvents: arrayRemove(eventId),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    throw new Error(`Failed to remove saved event: ${error.message}`)
  }
}

export const updateUserPreferences = async (uid, preferences) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await setDoc(userRef, {
      'preferences': preferences,
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    throw new Error(`Failed to update preferences: ${error.message}`)
  }
}
