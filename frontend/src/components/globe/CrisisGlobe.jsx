import Globe from 'react-globe.gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import { formatTimeAgo } from '../../lib/format'
import { severityColorRGBA, severityRadius } from '../../lib/severity'

const linkedPairs = [
  ['evt_wildfire_ca_2026_0418', 'evt_heatwave_es_2026_0418'],
  ['evt_typhoon_ph_2026_0417', 'evt_port_nl_2026_0418'],
  ['evt_quake_jp_2026_0418', 'evt_transit_uk_2026_0418'],
  ['evt_port_nl_2026_0418', 'evt_transit_uk_2026_0418'],
  ['evt_typhoon_ph_2026_0417', 'evt_quake_jp_2026_0418'],
]

const dayNightShader = {
  vertexShader: `
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vWorldPosition = worldPosition.xyz;
      vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    #define PI 3.141592653589793

    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform vec2 sunPosition;

    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    float toRad(in float value) {
      return value * PI / 180.0;
    }

    float luminance(in vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    vec3 polarToCartesian(in vec2 coords) {
      float theta = toRad(90.0 - coords.x);
      float phi = toRad(90.0 - coords.y);

      return vec3(
        sin(phi) * cos(theta),
        cos(phi),
        sin(phi) * sin(theta)
      );
    }

    void main() {
      vec3 normal = normalize(vWorldNormal);
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      vec3 sunDirection = normalize(polarToCartesian(sunPosition));
      float intensity = dot(normal, sunDirection);

      vec3 dayColor = texture2D(dayTexture, vUv).rgb;
      vec3 nightLights = texture2D(nightTexture, vUv).rgb;

      float landMask = smoothstep(0.10, 0.22, luminance(dayColor) + dayColor.g * 0.10 - dayColor.b * 0.05);
      float daylight = smoothstep(-0.10, 0.14, intensity);
      float twilight = 1.0 - smoothstep(0.015, 0.16, abs(intensity));
      float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.6);

      vec3 oceanNight = vec3(0.006, 0.014, 0.036);
      vec3 landNight = dayColor * vec3(0.10, 0.11, 0.13) + vec3(0.012, 0.018, 0.028);
      vec3 baseNight = mix(oceanNight, landNight, landMask);

      vec3 cityGlow = pow(nightLights, vec3(1.22)) * 1.05;
      float cityPresence = smoothstep(0.05, 0.26, luminance(cityGlow));
      baseNight += cityGlow * mix(0.20, 0.90, cityPresence) * (0.50 + landMask * 0.40);

      vec3 twilightGlow = mix(vec3(0.04, 0.12, 0.18), vec3(0.13, 0.18, 0.20), landMask) * twilight;
      vec3 rimGlow = vec3(0.08, 0.22, 0.34) * rim * (0.16 + (1.0 - daylight) * 0.42);

      vec3 color = mix(baseNight, dayColor, daylight);
      color += twilightGlow * 0.16;
      color += rimGlow;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

const normalizeLongitude = (lng) => {
  let value = lng
  while (value > 180) value -= 360
  while (value < -180) value += 360
  return value
}

const getSunPosition = (date = new Date()) => {
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - yearStart) / 86400000)
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3600000

  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (utcHours - 12) / 24)
  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma))

  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)

  const subsolarLongitude = normalizeLongitude((12 - utcHours) * 15 - equationOfTime / 4)

  return [subsolarLongitude, (declination * 180) / Math.PI]
}

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
  const globeMaterialRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [globeMaterial, setGlobeMaterial] = useState(null)

  useEffect(() => {
    return () => {
      // Cleanup tooltip on unmount
      if (tooltipElementRef.current && tooltipElementRef.current.parentNode) {
        tooltipElementRef.current.parentNode.removeChild(tooltipElementRef.current)
      }
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const visibleEvents = useMemo(
    () => (activeSeverities.length ? events.filter((event) => activeSeverities.includes(event.severity)) : events),
    [activeSeverities, events],
  )

  const arcs = useMemo(() => {
    return linkedPairs
      .map(([startId, endId]) => {
        const start = visibleEvents.find((event) => event.id === startId)
        const end = visibleEvents.find((event) => event.id === endId)
        if (!start || !end) return null
        return {
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng,
        }
      })
      .filter(Boolean)
  }, [visibleEvents])

  const isPointVisible = useCallback((lat, lng) => {
    if (!globeRef.current) return true
    
    // Get current camera position
    const pov = globeRef.current.pointOfView?.()
    if (!pov) return true

    // Convert lat/lng to radians
    const pointLat = (lat * Math.PI) / 180
    const pointLng = (lng * Math.PI) / 180
    const camLat = (pov.lat * Math.PI) / 180
    const camLng = (pov.lng * Math.PI) / 180

    // Convert to 3D cartesian coordinates (points on unit sphere)
    const pointX = Math.cos(pointLat) * Math.cos(pointLng)
    const pointY = Math.sin(pointLat)
    const pointZ = Math.cos(pointLat) * Math.sin(pointLng)

    const camX = Math.cos(camLat) * Math.cos(camLng)
    const camY = Math.sin(camLat)
    const camZ = Math.cos(camLat) * Math.sin(camLng)

    // Dot product: positive means point is on visible side (front-facing)
    // Return true if point is on front hemisphere
    const dotProduct = pointX * camX + pointY * camY + pointZ * camZ

    return dotProduct > 0
  }, [])

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
    let active = true
    const textureLoader = new THREE.TextureLoader()

    Promise.all([textureLoader.loadAsync('/earth-day.jpg'), textureLoader.loadAsync('/earth-night.jpg')])
      .then(([dayTexture, nightTexture]) => {
        if (!active) {
          dayTexture.dispose()
          nightTexture.dispose()
          return
        }

        dayTexture.colorSpace = THREE.SRGBColorSpace
        nightTexture.colorSpace = THREE.SRGBColorSpace
        dayTexture.anisotropy = Math.max(globeRef.current?.renderer?.()?.capabilities.getMaxAnisotropy?.() ?? 8, 1)
        nightTexture.anisotropy = dayTexture.anisotropy

        const material = new THREE.ShaderMaterial({
          uniforms: {
            dayTexture: { value: dayTexture },
            nightTexture: { value: nightTexture },
            sunPosition: { value: new THREE.Vector2() },
          },
          vertexShader: dayNightShader.vertexShader,
          fragmentShader: dayNightShader.fragmentShader,
        })

        globeMaterialRef.current = material
        setGlobeMaterial(material)
      })
      .catch((error) => {
        console.error('Failed to initialize globe day/night textures:', error)
      })

    return () => {
      active = false
      const material = globeMaterialRef.current
      if (material) {
        material.uniforms.dayTexture.value?.dispose?.()
        material.uniforms.nightTexture.value?.dispose?.()
        material.dispose()
        globeMaterialRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!globeMaterialRef.current) return

    const updateSunPosition = () => {
      const [lng, lat] = getSunPosition(new Date())
      globeMaterialRef.current?.uniforms.sunPosition.value.set(lng, lat)
    }

    updateSunPosition()
    const interval = window.setInterval(updateSunPosition, 60000)
    return () => window.clearInterval(interval)
  }, [globeMaterial])

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
      pointOfView({ lat: event.lat, lng: event.lng, altitude: size.w < 768 ? 1.12 : 0.92 }, 1000)
      onHoverChange?.(event)
      return
    }

    pointOfView({ altitude: size.w < 768 ? 2.22 : 1.82 }, 800)
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
      if (view) {
        onViewChange?.(view)
        
        // Update pin visibility based on current camera position
        // Query the entire document since pins are rendered inside the Globe canvas container
        visibleEvents.forEach((event) => {
          const elements = document.querySelectorAll(`[data-event-id="${event.id}"]`)
          elements.forEach((element) => {
            if (isPointVisible(event.lat, event.lng)) {
              element.style.visibility = 'visible'
            } else {
              element.style.visibility = 'hidden'
            }
          })
        })
      }
    }, 140)

    return () => window.clearInterval(interval)
  }, [onViewChange, visibleEvents, isPointVisible])

  const debounceTimerRef = useRef(null)
  const tooltipElementRef = useRef(null)

  const handlePinClick = useCallback(
    (event) => {
      stopAutoRotate()
      globeRef.current?.pointOfView({ lat: event.lat, lng: event.lng, altitude: size.w < 768 ? 1.12 : 0.92 }, 1000)
      window.setTimeout(() => onEventSelect?.(event), 200)
    },
    [onEventSelect, size.w, stopAutoRotate],
  )

  // Show tooltip directly in DOM without React state updates
  const showTooltip = useCallback((event, mouseEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    if (!rect) return

    let tooltip = tooltipElementRef.current
    if (!tooltip) {
      tooltip = document.createElement('div')
      tooltip.style.pointerEvents = 'none'
      tooltip.style.position = 'absolute'
      tooltip.style.zIndex = '20'
      tooltip.style.maxWidth = '240px'
      tooltip.style.borderRadius = '1rem'
      tooltip.style.border = '1px solid rgba(255,255,255,0.1)'
      tooltip.style.backgroundColor = 'rgba(11,16,32,0.82)'
      tooltip.style.padding = '0.75rem'
      tooltip.style.backdropFilter = 'blur(20px)'
      tooltip.style.fontFamily = 'ui-monospace'
      tooltip.style.fontSize = '11px'
      tooltip.style.textTransform = 'uppercase'
      tooltip.style.letterSpacing = '0.14em'
      containerRef.current.appendChild(tooltip)
      tooltipElementRef.current = tooltip
    }

    tooltip.innerHTML = `
      <div style="color: rgb(34, 211, 238); margin-bottom: 0.5rem;">
        ${event.location.split(',')[0]} · ${event.category}
      </div>
      <div style="color: rgb(148, 163, 184); font-size: 11px;">
        ${event.severity} · ${formatTimeAgo(event.startedAt)}
      </div>
    `
    
    const x = mouseEvent.clientX - rect.left + 14
    const y = mouseEvent.clientY - rect.top + 14
    tooltip.style.left = `${x}px`
    tooltip.style.top = `${y}px`
    tooltip.style.display = 'block'
  }, [])

  const hideTooltip = useCallback(() => {
    if (tooltipElementRef.current) {
      tooltipElementRef.current.style.display = 'none'
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative flex h-full w-full items-center justify-center transition duration-300 ${dimmed ? 'brightness-[0.62]' : 'brightness-100'}`}>
      {size.w > 0 && size.h > 0 ? (
        <Globe
          ref={globeRef}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/earth-day.jpg"
          bumpImageUrl="/earth-topology.png"
          globeMaterial={globeMaterial ?? undefined}
          showAtmosphere
          atmosphereColor="#22D3EE"
          atmosphereAltitude={0.18}
          htmlElementsData={visibleEvents}
          htmlLat={(d) => d.lat}
          htmlLng={(d) => d.lng}
          htmlAltitude={0.01}
          htmlElement={(d) => {
            const el = document.createElement('div')
            el.className = `crisis-pin crisis-pin--${d.severity}`
            el.setAttribute('data-event-id', d.id)
            el.style.pointerEvents = 'auto'
            el.style.cursor = 'pointer'
            el.style.zIndex = '10'
            el.style.transform = `translate(-50%, -50%) scale(${d.id === selectedEventId ? 1.22 : 1})`
            
            el.innerHTML = `
              <div class="crisis-pin__halo"></div>
              <div class="crisis-pin__ring"></div>
              <div class="crisis-pin__core"></div>
            `
            
            // Click handler
            const handleClick = (event) => {
              event.preventDefault()
              event.stopPropagation()
              handlePinClick(d)
            }
            
            // Hover handlers - these don't trigger React re-renders
            const handleMouseEnter = (event) => {
              showTooltip(d, event)
              onHoverChange?.(d)
            }
            
            const handleMouseMove = (event) => {
              showTooltip(d, event)
            }
            
            const handleMouseLeave = () => {
              hideTooltip()
              onHoverChange?.(null)
            }
            
            el.addEventListener('click', handleClick, true)
            el.addEventListener('touchend', handleClick, true)
            el.addEventListener('mouseenter', handleMouseEnter, false)
            el.addEventListener('mousemove', handleMouseMove, false)
            el.addEventListener('mouseleave', handleMouseLeave, false)
            
            return el
          }}
          ringsData={visibleEvents}
          ringLat={(d) => d.lat}
          ringLng={(d) => d.lng}
          ringColor={(d) => severityColorRGBA(d.severity)}
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
