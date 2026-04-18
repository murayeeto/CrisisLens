import clsx from 'clsx'

const variants = {
  primary: 'bg-cyan-500 text-void shadow-glow-cyan hover:bg-cyan-400',
  secondary: 'border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]',
  ghost: 'border border-transparent bg-transparent text-text-secondary hover:bg-white/[0.04] hover:text-white',
}

export function Button({ className, variant = 'primary', children, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.12em] transition-all duration-200 ease-crisp focus-visible:outline-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
