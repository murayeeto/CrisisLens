import { normalizeSeverity, severityAliases, severityConfig } from './severity'

const knownSeverityValues = new Set([
  ...Object.keys(severityConfig),
  ...Object.keys(severityAliases),
])

function normalizeTag(tag) {
  if (typeof tag !== 'string') return tag

  const value = tag.trim().toLowerCase()
  if (!knownSeverityValues.has(value)) return tag

  return normalizeSeverity(value)
}

function resolveSeverity(event) {
  if (!event || typeof event !== 'object') return 'info'

  return (
    event.severity ??
    event.aiAnalysis?.severity ??
    event.ai_analysis?.severity ??
    event.analysis?.severity ??
    'info'
  )
}

export function normalizeEvent(event) {
  if (!event || typeof event !== 'object') return event

  return {
    ...event,
    severity: normalizeSeverity(resolveSeverity(event)),
    tags: Array.isArray(event.tags) ? event.tags.map(normalizeTag) : event.tags,
  }
}

export function normalizeEvents(events) {
  if (!Array.isArray(events)) return []
  return events.map(normalizeEvent).filter(Boolean)
}
