import { motion, useReducedMotion } from 'framer-motion'
import { Activity, BarChart3, Building2, Users } from 'lucide-react'

const impactCards = [
  {
    label: 'People',
    value: 'Communities exposed',
    icon: Users,
    className: 'auth-impact-card--people',
    delay: 0,
  },
  {
    label: 'Infrastructure',
    value: 'Networks under stress',
    icon: Building2,
    className: 'auth-impact-card--infra',
    delay: 0.45,
  },
  {
    label: 'Markets',
    value: 'Ripple effects building',
    icon: BarChart3,
    className: 'auth-impact-card--markets',
    delay: 0.95,
  },
]

export function AuthHeroScene() {
  const reducedMotion = useReducedMotion()

  return (
    <div className="auth-impact-scene" aria-hidden="true">
      <div className="auth-impact-scene__header">
        <span className="auth-impact-scene__eyebrow">Impact model</span>
        <span className="auth-impact-scene__pulse">
          <Activity className="h-3.5 w-3.5" />
          Tracing consequences
        </span>
      </div>

      <div className="auth-impact-scene__body">
        <motion.div
          className="auth-impact-globe-wrap"
          animate={
            reducedMotion
              ? undefined
              : {
                  y: [0, -10, 0],
                  rotateX: [56, 58, 56],
                  rotateZ: [-9, -5, -9],
                }
          }
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="auth-impact-globe-shadow" />

          <motion.div
            className="auth-impact-globe"
            animate={reducedMotion ? undefined : { rotateY: [0, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            <div className="auth-impact-globe__core" />
            <div className="auth-impact-globe__gloss" />

            {[18, 34, 50, 66, 82].map((size) => (
              <span
                key={`lat-${size}`}
                className="auth-impact-globe__latitude"
                style={{ width: `${size}%`, height: `${size}%` }}
              />
            ))}

            {[0, 30, 60, 90, 120, 150].map((rotation) => (
              <span
                key={`lon-${rotation}`}
                className="auth-impact-globe__longitude"
                style={{ transform: `translate(-50%, -50%) rotateY(${rotation}deg)` }}
              />
            ))}

            <motion.span
              className="auth-impact-globe__hotspot"
              animate={reducedMotion ? undefined : { scale: [1, 1.16, 1], opacity: [0.88, 1, 0.88] }}
              transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="auth-impact-globe__hotspot-dot" />
              <span className="auth-impact-globe__hotspot-ring auth-impact-globe__hotspot-ring--one" />
              <span className="auth-impact-globe__hotspot-ring auth-impact-globe__hotspot-ring--two" />
            </motion.span>

            <motion.div
              className="auth-impact-globe__orbit auth-impact-globe__orbit--outer"
              animate={reducedMotion ? undefined : { rotate: [0, 360] }}
              transition={{ duration: 21, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="auth-impact-globe__orbit auth-impact-globe__orbit--inner"
              animate={reducedMotion ? undefined : { rotate: [360, 0] }}
              transition={{ duration: 17, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        </motion.div>

        <div className="auth-impact-links">
          <span className="auth-impact-links__line auth-impact-links__line--one" />
          <span className="auth-impact-links__line auth-impact-links__line--two" />
          <span className="auth-impact-links__line auth-impact-links__line--three" />
        </div>

        <div className="auth-impact-cards">
          {impactCards.map((item) => {
            const Icon = item.icon

            return (
              <motion.div
                key={item.label}
                className={`auth-impact-card ${item.className}`}
                animate={reducedMotion ? undefined : { y: [0, -8, 0] }}
                transition={{
                  duration: 6,
                  delay: item.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className="auth-impact-card__icon">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="auth-impact-card__label">{item.label}</div>
                  <div className="auth-impact-card__value">{item.value}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
