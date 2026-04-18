import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './Button'
import { Panel } from './Panel'

export function ErrorState({
  title = 'ERR · UPSTREAM_UNREACHABLE',
  message = 'The live feed did not return in time. Mock data is standing by.',
  diagnostic = 'signal=timeout t=1200ms endpoint=/api/events',
  onRetry,
}) {
  return (
    <Panel className="border-cyan-500/25 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-400">{title}</div>
          <p className="mt-3 text-sm text-text-secondary">{message}</p>
          <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim">{diagnostic}</div>
          {onRetry ? (
            <Button className="mt-4 px-4 py-2 text-[11px]" variant="secondary" onClick={onRetry}>
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
