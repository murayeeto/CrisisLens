import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { openCommandPalette } from '../../hooks/useCommandPalette'
import { useAuthSession } from '../../providers/AuthSessionProvider'
import { Kbd } from '../ui/Kbd'
import { BrandMark } from './BrandBadge'

const links = [
  { to: '/', label: 'Home' },
  { to: '/trending', label: 'Trending' },
  { to: '/for-you', label: 'For You' },
]

function getAccountInitials(profile) {
  const displayName = profile?.displayName?.trim()

  if (displayName) {
    const parts = displayName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
    }
    return (parts[0]?.[0] ?? 'C').toUpperCase()
  }

  const fallback = profile?.email?.trim()?.[0] ?? 'C'
  return fallback.toUpperCase()
}

export function Navbar() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const desktopAccountMenuRef = useRef(null)
  const mobileAccountMenuRef = useRef(null)
  const { isAuthenticated, profile } = useAuthSession()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handlePointerDown = (event) => {
      const clickedDesktopMenu = desktopAccountMenuRef.current?.contains(event.target)
      const clickedMobileMenu = mobileAccountMenuRef.current?.contains(event.target)

      if (!clickedDesktopMenu && !clickedMobileMenu) {
        setAccountOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const initials = getAccountInitials(profile)
  const accountActive = location.pathname === '/account'

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 px-3 sm:px-6"
      animate={{
        backgroundColor: scrolled ? 'rgba(5, 7, 13, 0.88)' : 'rgba(5, 7, 13, 0.72)',
      }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 border-b border-white/6 bg-transparent">
        <Link to="/" aria-label="CrisisLens home" className="mr-2 flex shrink-0 rounded-full p-1 transition hover:bg-white/[0.03]">
          <BrandMark className="h-10 w-10 sm:h-11 sm:w-11" />
          <span className="sr-only">CrisisLens</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-150 hover:bg-white/[0.04] hover:text-white ${
                  isActive ? 'bg-white/[0.05] text-white' : 'text-text-muted'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <div className="relative" ref={desktopAccountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((current) => !current)}
                aria-label="Open account menu"
                className={`inline-flex h-11 items-center justify-center gap-1 rounded-full bg-transparent p-0 ${
                  accountActive ? 'text-cyan-300' : 'text-text-secondary'
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/[0.12] font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-300">
                  {initials}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {accountOpen ? (
                <div className="absolute left-0 top-[calc(100%+10px)] w-[200px] rounded-[22px] border border-white/10 bg-[rgba(9,12,20,0.96)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <Link
                    to="/account"
                    onClick={() => setAccountOpen(false)}
                    className="flex w-full items-center justify-center rounded-[16px] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.06]"
                  >
                    View Account
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative md:hidden" ref={mobileAccountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((current) => !current)}
                aria-label="Open account menu"
                className={`inline-flex h-11 items-center justify-center gap-1 rounded-full bg-transparent p-0 ${
                  accountActive ? 'text-cyan-300' : 'text-text-secondary'
                }`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/[0.12] font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-300">
                  {initials}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {accountOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] w-[220px] rounded-[22px] border border-white/10 bg-[rgba(9,12,20,0.96)] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  <Link
                    to="/account"
                    onClick={() => setAccountOpen(false)}
                    className="flex w-full items-center justify-center rounded-[16px] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white transition hover:bg-white/[0.06]"
                  >
                    View Account
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              to="/login"
              className="glass-panel glass-panel--interactive hidden rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-300 md:inline-flex"
            >
              Sign in
            </Link>
          )}

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
