import { useState, useEffect } from 'react'
import {
  onAuthStateChange,
  getIdToken,
} from '../lib/firebaseAuth'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [idToken, setIdToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('useAuth: initializing auth listener')
    
    // Safety timeout - if not resolved in 5 seconds, stop loading
    const timeoutId = setTimeout(() => {
      console.log('useAuth: timeout reached, stopping loading')
      setLoading(false)
    }, 5000)

    try {
      const unsubscribe = onAuthStateChange(async (authUser) => {
        try {
          console.log('useAuth: auth state changed', authUser)
          clearTimeout(timeoutId)
          setUser(authUser)
          if (authUser) {
            const token = await getIdToken(authUser)
            setIdToken(token)
          } else {
            setIdToken(null)
          }
        } catch (err) {
          console.error('useAuth: error in callback', err)
          setError(err.message)
        } finally {
          setLoading(false)
        }
      })

      return unsubscribe
    } catch (err) {
      console.error('useAuth: error setting up listener', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  return { user, idToken, loading, error }
}
