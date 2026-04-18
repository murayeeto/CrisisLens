import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { openCommandPalette } from '../../hooks/useCommandPalette'
import { Kbd } from '../ui/Kbd'
import { BrandMark } from './BrandBadge'

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
        <Link to="/" aria-label="CrisisLens home" className="mr-2 flex shrink-0 rounded-full p-1 transition hover:bg-white/[0.03]">
          <BrandMark className="h-10 w-10 sm:h-11 sm:w-11" />
          <span className="sr-only">CrisisLens</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="inline-flex items-center rounded-full px-4 py-1.5 text-[13px] font-medium uppercase tracking-[0.14em] text-text-muted transition-colors duration-150 hover:bg-white/[0.04] hover:text-white"
            >
              {link.label}
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
