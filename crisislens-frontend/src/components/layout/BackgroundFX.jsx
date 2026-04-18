import { motion, useReducedMotion } from 'framer-motion'

export function BackgroundFX() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-void" />
      <div className="dot-grid absolute inset-0" />
      <motion.div
        className="absolute left-[-10%] top-[-12%] h-[720px] w-[720px] rounded-full bg-cyan-500/20 blur-[120px]"
        animate={
          reducedMotion
            ? undefined
            : {
                x: [0, 60, -30, 0],
                y: [0, 40, -50, 0],
              }
        }
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-[-18%] right-[-8%] h-[720px] w-[720px] rounded-full bg-blue-500/15 blur-[120px]"
        animate={
          reducedMotion
            ? undefined
            : {
                x: [0, -50, 35, 0],
                y: [0, -35, 25, 0],
              }
        }
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
      />
      <div className="grain-overlay absolute inset-0" />
      <div className="scanlines absolute inset-0 hidden md:block" />
    </div>
  )
}
