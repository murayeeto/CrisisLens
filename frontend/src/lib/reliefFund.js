export const BASIC_RELIEF_CAP = 500
export const VERIFIED_RELIEF_CAP = 1500
export const RELIEF_PRESET_AMOUNTS = [25, 50, 100, 250]

export function formatUsd(value) {
  const amount = typeof value === 'number' ? value : Number(value || 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

export function buildReliefCampaignId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `relief_${crypto.randomUUID().replaceAll('-', '')}`
  }

  return `relief_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function getReliefTierMeta(capTier) {
  if (capTier === 'verified') {
    return {
      label: 'Verified',
      accent: 'text-cyan-300',
      surface: 'border-cyan-500/20 bg-cyan-500/[0.08]',
    }
  }

  return {
    label: 'Basic',
    accent: 'text-white/80',
    surface: 'border-white/10 bg-white/[0.04]',
  }
}
