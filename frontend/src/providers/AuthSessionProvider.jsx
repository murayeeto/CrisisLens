import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { getIdToken, login, logout, onAuthStateChange, signup, signInWithGoogle } from '../lib/firebaseAuth'
import {
  addSavedEvent as addSavedEventDocument,
  getUserDocument,
  removeSavedEvent as removeSavedEventDocument,
  updateUserDocument,
} from '../lib/firebaseFirestore'

const AuthSessionContext = createContext(null)

function uniqueIds(values = []) {
  return Array.from(new Set(values))
}

function normalizePreferences(preferences = {}) {
  return {
    countries: uniqueIds(Array.isArray(preferences.countries) ? preferences.countries.filter(Boolean) : []),
    categories: uniqueIds(Array.isArray(preferences.categories) ? preferences.categories.filter(Boolean) : []),
  }
}

function toIsoString(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000).toISOString()
  if (typeof value?.isoformat === 'function') return value.isoformat()
  return null
}

function normalizeProfile(profile, authUser) {
  if (!authUser && !profile) return null

  const preferences = normalizePreferences(profile?.preferences)
  const createdAt = toIsoString(profile?.createdAt) ?? new Date().toISOString()
  const updatedAt = toIsoString(profile?.updatedAt)

  return {
    id: profile?.id ?? profile?.uid ?? authUser?.uid ?? '',
    uid: profile?.uid ?? authUser?.uid ?? '',
    email: profile?.email ?? authUser?.email ?? '',
    displayName: profile?.displayName ?? authUser?.displayName ?? '',
    createdAt,
    updatedAt,
    savedEvents: uniqueIds(Array.isArray(profile?.savedEvents) ? profile.savedEvents.filter(Boolean) : []),
    role: profile?.role ?? 'member',
    preferences,
    language: profile?.language ?? 'en',
    onboardingCompleted: Boolean(profile?.onboardingCompleted),
  }
}

export function AuthSessionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [idToken, setIdToken] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState(null)
  const profileRef = useRef(null)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  const loadProfile = useCallback(async (token, authUser) => {
    if (!token || !authUser) {
      setProfile(null)
      return null
    }

    setProfileLoading(true)
    try {
      const firestoreProfile = await getUserDocument(authUser.uid).catch((firestoreError) => {
        console.warn('Failed to read Firestore user profile:', firestoreError)
        return null
      })

      if (firestoreProfile) {
        const normalizedProfile = normalizeProfile(firestoreProfile, authUser)
        setProfile(normalizedProfile)
        setError(null)
        return normalizedProfile
      }

      const nextProfile = await api.getMe({ token })
      const normalizedProfile = normalizeProfile(nextProfile, authUser)
      setProfile(normalizedProfile)
      return normalizedProfile
    } catch (err) {
      const fallbackProfile = normalizeProfile(
        {
          id: authUser.uid,
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          preferences: profileRef.current?.preferences,
          savedEvents: profileRef.current?.savedEvents,
          onboardingCompleted: profileRef.current?.onboardingCompleted,
          role: profileRef.current?.role,
          createdAt: profileRef.current?.createdAt,
          updatedAt: profileRef.current?.updatedAt,
        },
        authUser,
      )

      if (fallbackProfile) {
        setProfile(fallbackProfile)
        setError(err)
        return fallbackProfile
      }

      if (err?.status === 401) {
        setProfile(null)
        return null
      }

      setError(err)
      throw err
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const hydrateSession = useCallback(
    async (authUser) => {
      if (!authUser) {
        setUser(null)
        setIdToken(null)
        setProfile(null)
        return { user: null, token: null, profile: null }
      }

      const token = await getIdToken(authUser)
      setUser(authUser)
      setIdToken(token)
      const nextProfile = await loadProfile(token, authUser)
      return { user: authUser, token, profile: nextProfile }
    },
    [loadProfile],
  )

  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChange(async (authUser) => {
      if (!active) return

      setError(null)

      if (!authUser) {
        setUser(null)
        setIdToken(null)
        setProfile(null)
        setAuthLoading(false)
        return
      }

      try {
        await hydrateSession(authUser)
      } catch (err) {
        console.error('Failed to hydrate auth session:', err)
      } finally {
        if (active) {
          setAuthLoading(false)
        }
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [hydrateSession])

  const signIn = useCallback(
    async ({ email, password }) => {
      setError(null)
      setAuthLoading(true)
      try {
        return await login(email, password)
      } catch (error) {
        setAuthLoading(false)
        throw error
      }
    },
    [],
  )

  const signUp = useCallback(
    async ({ email, password, displayName }) => {
      setError(null)
      setAuthLoading(true)
      try {
        return await signup(email, password, displayName)
      } catch (error) {
        setAuthLoading(false)
        throw error
      }
    },
    [],
  )

  const signInGoogle = useCallback(async () => {
    setError(null)
    setAuthLoading(true)
    try {
      return await signInWithGoogle()
    } catch (error) {
      setAuthLoading(false)
      throw error
    }
  }, [])

  const signOutUser = useCallback(async () => {
    await logout()
    setUser(null)
    setIdToken(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!idToken || !user) {
      setProfile(null)
      return null
    }

    return loadProfile(idToken, user)
  }, [idToken, loadProfile, user])

  const updateAccount = useCallback(
    async (payload) => {
      if (!idToken || !user?.uid) {
        const authError = new Error('AUTH_REQUIRED')
        authError.code = 'auth-required'
        throw authError
      }

      try {
        const nextProfile = await api.updateMe(payload, { token: idToken })
        const normalizedProfile = normalizeProfile(nextProfile, user)
        setProfile(normalizedProfile)
        return normalizedProfile
      } catch (error) {
        const existingProfile = await getUserDocument(user.uid).catch(() => null)
        const fallbackUpdates = {
          email: user.email ?? existingProfile?.email ?? '',
          displayName:
            typeof payload?.displayName === 'string'
              ? payload.displayName.trim()
              : user.displayName ?? existingProfile?.displayName ?? '',
          preferences:
            payload?.preferences !== undefined
              ? normalizePreferences(payload.preferences)
              : normalizePreferences(existingProfile?.preferences),
          onboardingCompleted:
            payload?.onboardingCompleted !== undefined
              ? Boolean(payload.onboardingCompleted)
              : Boolean(existingProfile?.onboardingCompleted),
          role: existingProfile?.role ?? profile?.role ?? 'member',
          createdAt: toIsoString(existingProfile?.createdAt) ?? profile?.createdAt ?? new Date().toISOString(),
        }

        await updateUserDocument(user.uid, fallbackUpdates)
        const nextProfile = normalizeProfile(
          {
            ...(existingProfile ?? {}),
            ...fallbackUpdates,
            uid: user.uid,
            id: user.uid,
          },
          user,
        )
        setProfile(nextProfile)
        setError(error)
        return nextProfile
      }
    },
    [idToken, profile?.createdAt, profile?.role, user],
  )

  const saveUserEvent = useCallback(
    async (eventId) => {
      if (!idToken || !user?.uid) {
        const authError = new Error('AUTH_REQUIRED')
        authError.code = 'auth-required'
        throw authError
      }

      try {
        await api.saveEvent(eventId, { token: idToken })
      } catch (error) {
        await addSavedEventDocument(user.uid, eventId)
        setError(error)
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              savedEvents: uniqueIds([...(current.savedEvents || []), eventId]),
            }
          : current,
      )
    },
    [idToken, user?.uid],
  )

  const unsaveUserEvent = useCallback(
    async (eventId) => {
      if (!idToken || !user?.uid) {
        const authError = new Error('AUTH_REQUIRED')
        authError.code = 'auth-required'
        throw authError
      }

      try {
        await api.unsaveEvent(eventId, { token: idToken })
      } catch (error) {
        await removeSavedEventDocument(user.uid, eventId)
        setError(error)
      }

      setProfile((current) =>
        current
          ? {
              ...current,
              savedEvents: (current.savedEvents || []).filter((savedId) => savedId !== eventId),
            }
          : current,
      )
    },
    [idToken, user?.uid],
  )

  const value = useMemo(
    () => ({
      user,
      idToken,
      profile,
      error,
      loading: authLoading || profileLoading,
      authLoading,
      profileLoading,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signInGoogle,
      signOut: signOutUser,
      refreshProfile,
      updateAccount,
      saveEvent: saveUserEvent,
      unsaveEvent: unsaveUserEvent,
      isEventSaved: (eventId) => Boolean(profile?.savedEvents?.includes(eventId)),
    }),
    [
      user,
      idToken,
      profile,
      error,
      authLoading,
      profileLoading,
      signIn,
      signUp,
      signInGoogle,
      signOutUser,
      refreshProfile,
      updateAccount,
      saveUserEvent,
      unsaveUserEvent,
    ],
  )

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext)

  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider')
  }

  return context
}
