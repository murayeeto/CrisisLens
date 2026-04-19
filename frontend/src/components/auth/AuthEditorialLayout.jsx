import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandBadge } from '../layout/BrandBadge'
import { AuthHeroScene } from './AuthHeroScene'

export function AuthEditorialLayout({
  eyebrow,
  title,
  description,
  children,
  kicker,
}) {
  const reducedMotion = useReducedMotion()

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-[-10%] top-[8%] h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[110px]"
          animate={reducedMotion ? undefined : { x: [0, 28, -12, 0], y: [0, -18, 12, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-[-12%] right-[-8%] h-[460px] w-[460px] rounded-full bg-blue-500/10 blur-[120px]"
          animate={reducedMotion ? undefined : { x: [0, -24, 18, 0], y: [0, 16, -14, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative z-10 min-h-screen bg-[linear-gradient(180deg,rgba(7,10,18,0.9),rgba(4,6,13,0.98))] lg:grid lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative flex min-h-[52vh] flex-col overflow-hidden px-6 py-6 sm:px-10 lg:min-h-screen lg:px-14 lg:py-8 xl:px-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_68%_58%,rgba(59,130,246,0.08),transparent_30%),linear-gradient(180deg,rgba(10,14,26,0.38),rgba(5,7,13,0))]" />
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 transition hover:border-cyan-500/25 hover:bg-white/[0.05]">
              <BrandBadge className="h-10 w-10" />
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">CrisisLens</div>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary transition hover:text-white"
            >
              Back to feed
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative z-10 mt-8 max-w-[580px] lg:mt-14">
            {kicker ? (
              <div className="inline-flex rounded-full border border-cyan-500/18 bg-cyan-500/[0.08] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                {kicker}
              </div>
            ) : null}
            {eyebrow ? (
              <div className={`${kicker ? 'mt-5' : ''} font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted`}>
                {eyebrow}
              </div>
            ) : null}
            <h1 className="mt-3 max-w-[11ch] font-display text-[40px] font-semibold leading-[0.96] tracking-snug text-white sm:text-[52px] lg:text-[64px]">
              {title}
            </h1>
            {description ? (
              <p className="mt-6 max-w-[54ch] text-[16px] leading-8 text-text-secondary sm:text-[17px]">{description}</p>
            ) : null}
            <div className="mt-6 sm:mt-8">
              <AuthHeroScene />
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:min-h-screen lg:px-14 xl:px-20">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent lg:inset-x-auto lg:left-0 lg:top-12 lg:h-[calc(100%-6rem)] lg:w-px lg:bg-gradient-to-b lg:from-transparent lg:via-white/14 lg:to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0)),radial-gradient(circle_at_top,rgba(34,211,238,0.05),transparent_34%)]" />
          <div className="relative z-10 w-full max-w-[500px]">{children}</div>
        </div>
      </div>
    </section>
  )
}
