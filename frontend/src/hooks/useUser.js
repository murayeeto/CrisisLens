import { useAuthSession } from '../providers/AuthSessionProvider'

export function useUser() {
  const { profile, loading, error, refreshProfile } = useAuthSession()

  return {
    data: profile,
    loading,
    error,
    refetch: refreshProfile,
  }
}
