import clsx from 'clsx'

export function Panel({
  as: Component = 'div',
  className,
  children,
  interactive = false,
  spotlight = false,
  active = false,
  onMouseMove,
  ...props
}) {
  const handleMouseMove = (event) => {
    if (spotlight) {
      const rect = event.currentTarget.getBoundingClientRect()
      event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`)
    }

    onMouseMove?.(event)
  }

  return (
    <Component
      className={clsx(
        'glass-panel',
        interactive && 'glass-panel--interactive',
        spotlight && 'spotlight',
        active && 'animated-border',
        className,
      )}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </Component>
  )
}
