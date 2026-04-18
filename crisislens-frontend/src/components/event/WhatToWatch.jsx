export function WhatToWatch({ items = [] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex gap-3 text-[14px] leading-6 text-text-secondary">
          <span className="mt-0.5 font-mono text-cyan-400">▸</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  )
}
