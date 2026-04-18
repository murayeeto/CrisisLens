import clsx from 'clsx'

export function Kbd({ children, className }) {
  return (
    <span
      className={clsx(
        'inline-flex min-w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
