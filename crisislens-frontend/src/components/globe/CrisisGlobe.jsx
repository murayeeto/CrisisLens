import Globe from 'react-globe.gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { formatTimeAgo } from '../../lib/format'
import { severityColorRGBA, severityRadius } from '../../lib/severity'

const linkedPairs = [
  ['evt_wildfire_ca_2026_0418', 'evt_heatwave_es_2026_0418'],
  ['evt_typhoon_ph_2026_0417', 'evt_port_nl_2026_0418'],
  ['evt_quake_jp_2026_0418', 'evt_transit_uk_2026_0418'],
  ['evt_port_nl_2026_0418', 'evt_transit_uk_2026_0418'],
  ['evt_typhoon_ph_2026_0417', 'evt_quake_jp_2026_0418'],
]

export default function CrisisGlobe({
  events,
  activeSeverities,
  selectedEventId,
  dimmed,
  onEventSelect,
  onHoverChange,
  onViewChange,
}) {
  const reducedMotion = useReducedMotion()
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const resumeRotateRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [tooltip, setTooltip] = useState(null)

  const globeEvents = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        isDimmed: activeSeverities.length > 0 && !activeSeverities.includes(event.severity),
      })),
    [activeSeverities, events],
  )

  const ringEvents = useMemo(() => globeEvents.filter((event) => !event.isDimmed), [globeEvents])

  const arcs = useMemo(() => {
    return linkedPairs
      .map(([startId, endId]) => {
        const start = events.find((event) => event.id === startId)
        const end = events.find((event) => event.id === endId)
        if (!start || !end) return null
        return {
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng,
        }
      })
      .filter(Boolean)
  }, [events])

  const stopAutoRotate = useCallback(() => {
    window.clearTimeout(resumeRotateRef.current)
    const controls = globeRef.current?.controls?.()
    if (controls) controls.autoRotate = false
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })

    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    let controls
    const handleStart = () => stopAutoRotate()

    const frame = requestAnimationFrame(() => {
      controls = globeRef.current?.controls?.()
      if (!controls) return
      controls.autoRotate = !reducedMotion && !selectedEventId
      controls.autoRotateSpeed = 0.35
      controls.enablePan = false
      controls.addEventListener('start', handleStart)
    })

    return () => {
      cancelAnimationFrame(frame)
      controls?.removeEventListener('start', handleStart)
    }
  }, [reducedMotion, selectedEventId, stopAutoRotate])

  useEffect(() => {
    if (!globeRef.current) return

    const pointOfView = globeRef.current.pointOfView
    const controls = globeRef.current.controls?.()

    if (selectedEventId) {
      const event = events.find((item) => item.id === selectedEventId)
      if (!event) return
      stopAutoRotate()
      pointOfView({ lat: event.lat, lng: event.lng, altitude: 1.4 }, 1000)
      onHoverChange?.(event)
      return
    }

    pointOfView({ altitude: size.w < 768 ? 2.6 : 2.2 }, 800)
    if (!reducedMotion && controls) {
      resumeRotateRef.current = window.setTimeout(() => {
        controls.autoRotate = true
      }, 3000)
    }

    return () => window.clearTimeout(resumeRotateRef.current)
  }, [events, onHoverChange, reducedMotion, selectedEventId, size.w, stopAutoRotate])

  useEffect(() => {
    const interval = window.setInterval(() => {
      const view = globeRef.current?.pointOfView?.()
      if (view) onViewChange?.(view)
    }, 220)

    return () => window.clearInterval(interval)
  }, [onViewChange])

  const updateTooltipPosition = useCallback((mouseEvent, event) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({
      event,
      x: mouseEvent.clientX - rect.left + 14,
      y: mouseEvent.clientY - rect.top + 14,
    })
  }, [])

  const handlePinClick = useCallback(
    (event) => {
      stopAutoRotate()
      globeRef.current?.pointOfView({ lat: event.lat, lng: event.lng, altitude: 1.4 }, 1000)
      window.setTimeout(() => onEventSelect?.(event), 200)
    },
    [onEventSelect, stopAutoRotate],
  )

  return (
    <div ref={containerRef} className={`relative flex h-full w-full items-center justify-center transition duration-300 ${dimmed ? 'brightness-[0.62]' : 'brightness-100'}`}>
      {size.w > 0 && size.h > 0 ? (
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/earth-night.jpg"
          bumpImageUrl="/earth-topology.png"
          showAtmosphere
          atmosphereColor="#22D3EE"
          atmosphereAltitude={0.18}
          htmlElementsData={globeEvents}
          htmlLat={(d) => d.lat}
          htmlLng={(d) => d.lng}
          htmlAltitude={0.01}
          htmlElement={(d) => {
            const el = document.createElement('div')
            el.className = `crisis-pin crisis-pin--${d.severity}`
            el.style.pointerEvents = 'auto'
            el.style.opacity = d.isDimmed ? '0.25' : '1'
            el.style.transform = `translate(-50%, -50%) scale(${d.id === selectedEventId ? 1.15 : 1})`
            el.innerHTML = `
              <div class="crisis-pin__halo"></div>
              <div class="crisis-pin__ring"></div>
              <div class="crisis-pin__core"></div>
            `
            el.onclick = () => handlePinClick(d)
            el.onmouseenter = (event) => {
              onHoverChange?.(d)
              updateTooltipPosition(event, d)
            }
            el.onmousemove = (event) => updateTooltipPosition(event, d)
            el.onmouseleave = () => {
              setTooltip(null)
              onHoverChange?.(null)
            }
            return el
          }}
          ringsData={ringEvents}
          ringLat={(d) => d.lat}
          ringLng={(d) => d.lng}
          ringColor={(d) => () => severityColorRGBA(d.severity)}
          ringMaxRadius={(d) => severityRadius(d.severity)}
          ringPropagationSpeed={1.5}
          ringRepeatPeriod={1200}
          arcsData={arcs}
          arcColor={() => ['rgba(34,211,238,0.15)', 'rgba(34,211,238,0.55)']}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2200}
          arcStroke={0.35}
          arcAltitudeAutoScale={0.45}
        />
      ) : null}

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-20 max-w-[240px] rounded-2xl border border-white/10 bg-[rgba(11,16,32,0.82)] px-3 py-2 backdrop-blur-xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-white">
            {tooltip.event.location.split(',')[0]} · {tooltip.event.category}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            {tooltip.event.severity} · {formatTimeAgo(tooltip.event.startedAt)}
          </div>
        </div>
      ) : null}

      <ul className="sr-only">
        {events.map((event) => (
          <li key={event.id}>
            {event.title} at {event.location}
          </li>
        ))}
      </ul>
    </div>
  )
}
