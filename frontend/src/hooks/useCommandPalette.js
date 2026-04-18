import { useCallback, useEffect, useState } from 'react'

export const COMMAND_PALETTE_OPEN_EVENT = 'crisislens:open-command-palette'
export const COMMAND_PALETTE_CLOSE_EVENT = 'crisislens:close-command-palette'
export const COMMAND_PALETTE_TOGGLE_EVENT = 'crisislens:toggle-command-palette'

export const openCommandPalette = () => {
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT))
}

export const closeCommandPalette = () => {
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_CLOSE_EVENT))
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((current) => !current), [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }

      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const onOpen = () => setIsOpen(true)
    const onClose = () => setIsOpen(false)
    const onToggle = () => setIsOpen((current) => !current)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen)
    window.addEventListener(COMMAND_PALETTE_CLOSE_EVENT, onClose)
    window.addEventListener(COMMAND_PALETTE_TOGGLE_EVENT, onToggle)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen)
      window.removeEventListener(COMMAND_PALETTE_CLOSE_EVENT, onClose)
      window.removeEventListener(COMMAND_PALETTE_TOGGLE_EVENT, onToggle)
    }
  }, [])

  return { isOpen, open, close, toggle }
}
