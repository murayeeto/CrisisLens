import clsx from 'clsx'

export function Skeleton({ className }) {
  return (
    <div
      className={clsx('rounded-2xl', className)}
      style={{
        background:
          'linear-gradient(90deg, rgba(148,163,184,0.05) 0%, rgba(148,163,184,0.12) 50%, rgba(148,163,184,0.05) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s infinite',
      }}
    />
  )
}
