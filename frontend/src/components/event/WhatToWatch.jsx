export function WhatToWatch({ items = [] }) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const title = typeof item === 'string' ? item : item?.title
        const description = typeof item === 'string' ? undefined : item?.description
        return (
          <div key={idx} className="flex gap-3 text-[14px] leading-6 text-text-secondary">
            <span className="mt-0.5 font-mono text-cyan-400">▸</span>
            <div>
              <div>{title}</div>
              {description && <div className="text-[12px] opacity-75">{description}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
