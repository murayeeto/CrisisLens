import clsx from 'clsx'

const colors = {
  red: 'bg-sev-crit',
  green: 'bg-emerald-400',
  cyan: 'bg-cyan-500',
}

export function LiveDot({ color = 'red', className }) {
  return (
    <span className={clsx('relative inline-flex h-2 w-2 items-center justify-center', className)}>
      <span className={clsx('absolute inline-flex h-2 w-2 rounded-full opacity-40 animate-ping', colors[color])} />
      <span className={clsx('relative inline-flex h-2 w-2 rounded-full', colors[color])} />
    </span>
  )
}
