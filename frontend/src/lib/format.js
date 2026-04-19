const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value)

export const formatCoords = (lat, lng) => {
  const latLabel = lat >= 0 ? 'N' : 'S'
  const lngLabel = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}°${latLabel}, ${Math.abs(lng).toFixed(4)}°${lngLabel}`
}

export const formatTimeAgo = (value, { compact = false } = {}) => {
  if (!value) return 'just now'

  let date
  if (typeof value === 'string') {
    date = new Date(value)
  } else if (value instanceof Date) {
    date = value
  } else if (value && typeof value === 'object' && typeof value.toDate === 'function') {
    // Handle Firestore Timestamp objects
    date = value.toDate()
  } else if (typeof value === 'number') {
    // Handle timestamps in milliseconds
    date = new Date(value)
  } else {
    return 'just now'
  }

  // Ensure we have a valid date
  if (isNaN(date.getTime())) {
    return 'just now'
  }

  const diffMs = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return compact ? 'NOW' : 'just now'
  if (diffMs < hour) {
    const mins = Math.max(1, Math.round(diffMs / minute))
    return compact ? `${mins}M AGO` : `${mins}m ago`
  }
  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour))
    return compact ? `${hours}H AGO` : `${hours}h ago`
  }

  const days = Math.max(1, Math.round(diffMs / day))
  return compact ? `${days}D AGO` : `${days}d ago`
}

export const formatRelativeRange = (start, end) => {
  const started = formatTimeAgo(start)
  const updated = formatTimeAgo(end)
  return `Started ${started} · Updated ${updated}`
}

export const formatJoinedAt = (value) => {
  const date = new Date(value)
  return `Joined ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export const formatCalendar = (value) => {
  const date = new Date(value)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export const getUtcLabel = () => new Date().toISOString().slice(11, 16)

export const makeFallbackImage = (label, accent = '#22D3EE') => {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675' viewBox='0 0 1200 675'>
      <defs>
        <linearGradient id='bg' x1='0' x2='1' y1='0' y2='1'>
          <stop stop-color='#0F1629'/>
          <stop offset='1' stop-color='#05070D'/>
        </linearGradient>
        <linearGradient id='line' x1='0' x2='1'>
          <stop stop-color='${accent}' stop-opacity='0.8'/>
          <stop offset='1' stop-color='#3B82F6' stop-opacity='0.18'/>
        </linearGradient>
      </defs>
      <rect width='1200' height='675' fill='url(%23bg)'/>
      <circle cx='250' cy='180' r='180' fill='${accent}' fill-opacity='0.08'/>
      <circle cx='920' cy='460' r='220' fill='#3B82F6' fill-opacity='0.08'/>
      <g stroke='url(%23line)' stroke-width='1.5' opacity='0.55'>
        <path d='M40 120H1160'/>
        <path d='M40 210H1160'/>
        <path d='M40 300H1160'/>
        <path d='M40 390H1160'/>
        <path d='M40 480H1160'/>
        <path d='M40 570H1160'/>
      </g>
      <text x='70' y='120' fill='${accent}' font-family='monospace' font-size='28' letter-spacing='6'>CRISISLENS</text>
      <text x='70' y='588' fill='white' font-family='Arial, sans-serif' font-size='64' font-weight='700'>${label}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
