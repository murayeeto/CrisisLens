export const severityConfig = {
  critical: {
    label: 'Critical',
    short: 'M.CRITICAL',
    color: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.65)',
    tint: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.32)',
    shadow: 'shadow-glow-red',
    radius: 6,
  },
  high: {
    label: 'High',
    short: 'H.HIGH',
    color: '#F97316',
    glow: 'rgba(249, 115, 22, 0.6)',
    tint: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.3)',
    shadow: 'shadow-panel',
    radius: 4,
  },
  moderate: {
    label: 'Moderate',
    short: 'M.MODERATE',
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.55)',
    tint: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.28)',
    shadow: 'shadow-panel',
    radius: 3,
  },
  low: {
    label: 'Low',
    short: 'L.LOW',
    color: '#22D3EE',
    glow: 'rgba(34, 211, 238, 0.55)',
    tint: 'rgba(34, 211, 238, 0.12)',
    border: 'rgba(34, 211, 238, 0.3)',
    shadow: 'shadow-panel',
    radius: 2,
  },
  info: {
    label: 'Info',
    short: 'I.INFO',
    color: '#64748B',
    glow: 'rgba(100, 116, 139, 0.45)',
    tint: 'rgba(100, 116, 139, 0.14)',
    border: 'rgba(100, 116, 139, 0.28)',
    shadow: 'shadow-panel',
    radius: 2,
  },
}

export const severityOrder = ['critical', 'high', 'moderate', 'low', 'info']

export const getSeverityConfig = (severity) => severityConfig[severity] ?? severityConfig.info

export const severityColor = (severity) => getSeverityConfig(severity).color

export const severityColorRGBA = (severity) => {
  const { color } = getSeverityConfig(severity)
  if (severity === 'critical') return `rgba(239, 68, 68, 0.65)`
  if (severity === 'high') return `rgba(249, 115, 22, 0.55)`
  if (severity === 'moderate') return `rgba(245, 158, 11, 0.5)`
  if (severity === 'low') return `rgba(34, 211, 238, 0.5)`
  return `rgba(100, 116, 139, 0.42)`
}

export const severityRadius = (severity) => getSeverityConfig(severity).radius
