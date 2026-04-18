import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

export function Typewriter({ text, speed = 18 }) {
  const reducedMotion = useReducedMotion()
  const [visible, setVisible] = useState(reducedMotion ? text : '')
  const [done, setDone] = useState(reducedMotion)

  useEffect(() => {
    if (reducedMotion) {
      setVisible(text)
      setDone(true)
      return
    }

    setVisible('')
    setDone(false)

    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setVisible(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(timer)
        setDone(true)
      }
    }, speed)

    return () => window.clearInterval(timer)
  }, [reducedMotion, speed, text])

  return (
    <p className="text-[15px] leading-7 text-text-secondary">
      {visible}
      {!done ? <span className="ml-0.5 inline-block h-5 w-[1px] animate-pulse bg-cyan-400 align-middle" /> : null}
    </p>
  )
}
