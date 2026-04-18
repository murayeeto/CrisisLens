import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
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
  createdAt: '',
  updatedAt: '',
  savedEvents: [],
  watchlist: [],
  preferences: {
    categories: [],
    regions: [],
    severityThreshold: 'medium',
    emailNotifications: true,
  },
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
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(`Failed to update user document: ${error.message}`)
  }
}

export const addSavedEvent = async (uid, eventId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, {
      savedEvents: arrayUnion(eventId),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(`Failed to save event: ${error.message}`)
  }
}

export const removeSavedEvent = async (uid, eventId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, {
      savedEvents: arrayRemove(eventId),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(`Failed to remove saved event: ${error.message}`)
  }
}

export const addToWatchlist = async (uid, watchItem) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, {
      watchlist: arrayUnion(watchItem),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(`Failed to add watchlist item: ${error.message}`)
  }
}

export const removeFromWatchlist = async (uid, watchItemId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    const userDoc = await getUserDocument(uid)
    const filteredWatchlist = userDoc.watchlist.filter(item => item.id !== watchItemId)
    
    await updateDoc(userRef, {
      watchlist: filteredWatchlist,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(`Failed to remove watchlist item: ${error.message}`)
  }
}

export const updateUserPreferences = async (uid, preferences) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid)
    await updateDoc(userRef, {
      'preferences': preferences,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    throw new Error(`Failed to update preferences: ${error.message}`)
  }
}
