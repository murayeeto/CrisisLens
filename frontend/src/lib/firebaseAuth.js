import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserDocument } from './firebaseFirestore'

export const signup = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    if (displayName) {
      await updateProfile(user, { displayName })
    }
    
    await createUserDocument(user.uid, {
      email,
      displayName,
      role: 'member',
      createdAt: new Date().toISOString(),
      savedEvents: [],
      preferences: {
        countries: [],
        categories: [],
      },
      onboardingCompleted: false,
    })
    
    return user
  } catch (error) {
    throw new Error(error.message)
  }
}

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    throw new Error(error.message)
  }
}

export const logout = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    throw new Error(error.message)
  }
}

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    }, reject)
  })
}

export const getIdToken = async (user) => {
  if (!user) return null
  return await user.getIdToken(true)
}

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({
      prompt: 'select_account',
    })
    
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user

    // Create user document if it doesn't exist
    await createUserDocument(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'member',
      createdAt: new Date().toISOString(),
      savedEvents: [],
      preferences: {
        countries: [],
        categories: [],
      },
      onboardingCompleted: false,
    }).catch(() => {
      // Document may already exist, that's fine
    })

    return user
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in was cancelled')
    }
    throw new Error(error.message)
  }
}
