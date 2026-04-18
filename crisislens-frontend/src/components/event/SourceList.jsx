import { ExternalLink } from 'lucide-react'
import { formatTimeAgo } from '../../lib/format'

const faviconFallback = (label) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'>
      <rect width='48' height='48' rx='10' fill='#0F1629'/>
      <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='18' fill='#22D3EE' font-family='Arial'>${label
        .slice(0, 1)
        .toUpperCase()}</text>
    </svg>
  `)}`

export function SourceList({ sources = [] }) {
  return (
    <div className="space-y-2">
      {sources.map((source) => (
        <a
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-3 transition hover:border-cyan-500/30 hover:bg-white/[0.03]"
        >
          <img
            src={source.favicon}
            alt=""
            className="mt-0.5 h-6 w-6 rounded-sm border border-white/8 bg-panel-2 object-cover"
            onError={(event) => {
              event.currentTarget.src = faviconFallback(source.outlet)
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
              {source.outlet} · {formatTimeAgo(source.publishedAt)}
            </div>
            <div className="mt-1 flex items-start gap-2 text-[14px] leading-6 text-white transition group-hover:text-cyan-400">
              <span className="min-w-0 flex-1">{source.title}</span>
              <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
