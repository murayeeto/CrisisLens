import { getSeverityConfig } from '../../lib/severity'

export function SeverityBadge({ severity }) {
  const config = getSeverityConfig(severity)
  const isCritical = severity === 'critical'

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]"
      style={{
        backgroundColor: isCritical ? config.color : config.tint,
        borderColor: config.border,
        color: isCritical ? '#F8FAFC' : config.color,
      }}
    >
      <span
        className="inline-flex h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: isCritical ? '#F8FAFC' : config.color }}
      />
      {config.label}
    </span>
  )
}
