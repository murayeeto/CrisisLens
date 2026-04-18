import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { openCommandPalette } from '../../hooks/useCommandPalette'
import { Kbd } from '../ui/Kbd'

function LogoMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 text-cyan-500">
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10.5" r="6.5" />
        <path d="M5.8 10.5h12.4M12 4a11.4 11.4 0 0 1 0 13M12 4a11.4 11.4 0 0 0 0 13" />
        <path d="M15.8 16.2 12 22l-3.8-5.8" />
      </g>
    </svg>
  )
}

const links = [
  { to: '/', label: 'Home' },
  { to: '/trending', label: 'Trending' },
  { to: '/account', label: 'Account' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 px-3 sm:px-6"
      animate={{
        backgroundColor: scrolled ? 'rgba(5, 7, 13, 0.88)' : 'rgba(5, 7, 13, 0.72)',
      }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 border-b border-white/6 bg-transparent">
        <Link to="/" className="mr-1 flex min-w-0 items-center gap-3 rounded-full px-3 py-2 transition hover:bg-white/[0.03]">
          <LogoMark />
          <div className="min-w-0">
            <div className="truncate font-display text-[15px] font-semibold tracking-tightish text-white">CrisisLens</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {({ isActive }) => (
                <span
                  className={clsx(
                    'relative inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-medium uppercase tracking-[0.14em] transition-all duration-200',
                    isActive ? 'animated-border bg-white/5 text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.22)]' : 'text-text-muted hover:bg-white/[0.03] hover:text-white',
                  )}
                >
                  {link.label}
                  {isActive ? (
                    <span className="absolute bottom-[5px] left-1/2 h-px w-[60%] -translate-x-1/2 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  ) : null}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            className="glass-panel glass-panel--interactive hidden items-center gap-3 rounded-full px-4 py-2 md:flex"
          >
            <Search className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-secondary">Search incidents, locations, sources</span>
            <span className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>

          <button
            type="button"
            onClick={openCommandPalette}
            className="glass-panel glass-panel--interactive inline-flex rounded-full px-3 py-2 md:hidden"
            aria-label="Open command palette"
          >
            <Search className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </motion.header>
  )
}
