export function getReturnPath(state) {
  if (typeof state?.from === 'string' && state.from.trim()) {
    return state.from
  }

  return '/for-you'
}

export function buildReturnPath(location, eventId) {
  const params = new URLSearchParams(location.search)

  if (eventId) {
    params.set('event', eventId)
  }

  const search = params.toString()
  return `${location.pathname}${search ? `?${search}` : ''}`
}
