import { useState, useEffect } from 'react'
import {
  getUserDocument,
  updateUserDocument,
  addSavedEvent,
  removeSavedEvent,
  updateUserPreferences,
} from '../lib/firebaseFirestore'

export const useFirestore = (uid) => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        const data = await getUserDocument(uid)
        setUserData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [uid])

  const updateUser = async (updates) => {
    if (!uid) throw new Error('No user ID')
    try {
      await updateUserDocument(uid, updates)
      setUserData(prev => ({ ...prev, ...updates }))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const saveEvent = async (eventId) => {
    if (!uid) throw new Error('No user ID')
    try {
      await addSavedEvent(uid, eventId)
      setUserData(prev => ({
        ...prev,
        savedEvents: [...prev.savedEvents, eventId]
      }))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const unsaveEvent = async (eventId) => {
    if (!uid) throw new Error('No user ID')
    try {
      await removeSavedEvent(uid, eventId)
      setUserData(prev => ({
        ...prev,
        savedEvents: prev.savedEvents.filter(id => id !== eventId)
      }))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updatePreferences = async (prefs) => {
    if (!uid) throw new Error('No user ID')
    try {
      await updateUserPreferences(uid, prefs)
      setUserData(prev => ({
        ...prev,
        preferences: prefs
      }))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  return {
    userData,
    loading,
    error,
    updateUser,
    saveEvent,
    unsaveEvent,
    updatePreferences,
  }
}
