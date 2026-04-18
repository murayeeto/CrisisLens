import { useId } from 'react'

function BrandArc({ className = 'h-9 w-9 sm:h-10 sm:w-10' }) {
  const gradientId = useId().replace(/:/g, '')

  return (
    <svg aria-hidden="true" viewBox="0 0 120 120" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="24" y1="18" x2="95" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff7a18" />
          <stop offset="38%" stopColor="#ff5a1f" />
          <stop offset="62%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="34"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="18"
        strokeDasharray="182 32"
        strokeLinecap="butt"
        transform="rotate(38 60 60)"
      />
    </svg>
  )
}

export function BrandMark({ className = 'h-9 w-9 sm:h-10 sm:w-10' }) {
  return <BrandArc className={className} />
}

export function BrandBadge({ className = 'h-11 w-11 sm:h-12 sm:w-12' }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-white shadow-[0_18px_40px_-26px_rgba(255,255,255,0.95),0_18px_36px_-24px_rgba(2,6,23,0.95)] ring-1 ring-slate-900/8 ${className}`}
    >
      <BrandArc />
    </div>
  )
}
