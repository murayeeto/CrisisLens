import { useEffect, useState } from 'react'
import { Panel } from './Panel'
import { formatNumber } from '../../lib/format'

export function StatTile({ label, value, className, compact = false }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const start = performance.now()
    const duration = 900

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 4
      setDisplayValue(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <Panel className={className ? className : ''}>
      <div className={compact ? 'px-4 py-3' : 'px-5 py-4'}>
        <div className="font-display text-[24px] font-medium tracking-tightish text-white">
          {formatNumber(displayValue)}
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{label}</div>
      </div>
    </Panel>
  )
}
