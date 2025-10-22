"use client"

import { useEffect, useRef, useCallback } from "react"
import createGlobe from "cobe"
import { useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

const MOVEMENT_DAMPING = 1400

export function Globe({ className }) {
  const { theme } = useTheme()
  const phiRef = useRef(0) // Store phi in a ref to persist across renders
  const widthRef = useRef(0)
  const canvasRef = useRef(null)
  const pointerInteracting = useRef(null)
  const pointerInteractionMovement = useRef(0)
  const globeRef = useRef(null)

  const r = useMotionValue(0)
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  })

  const hslToRgbArray = useCallback((hsl) => {
    const el = document.createElement("div")
    el.style.color = hsl
    document.body.appendChild(el)
    const rgb = getComputedStyle(el).color
    document.body.removeChild(el)
    const [r, g, b] = rgb.match(/\d+/g).map((x) => parseInt(x) / 255)
    return [r, g, b]
  }, [])

  const initGlobe = useCallback(() => {
    if (!canvasRef.current) return

    widthRef.current = canvasRef.current.offsetWidth
    const rootStyles = getComputedStyle(document.documentElement)
    const primaryColor = hslToRgbArray(`hsl(${rootStyles.getPropertyValue("--primary")})`)
    const isDark = theme === 'dark'

    if (globeRef.current) {
      globeRef.current.destroy()
    }

    const globe = createGlobe(canvasRef.current, {
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      devicePixelRatio: 2,
      phi: 0,
      theta: 0.3,
      // Theme-based configuration
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 1.2 : 0.4,
      mapSamples: 16000,
      mapBrightness: isDark ? 1.1 : 1.2,
      // Colors based on theme
      baseColor: isDark 
        ? hslToRgbArray(`hsl(${rootStyles.getPropertyValue("--muted-foreground")})`)
        : [1, 1, 1], // White for light mode
      glowColor: isDark 
        ? [1, 1, 1]
        : [1, 1, 1], // White glow for light mode
        markerColor: isDark 
        ? primaryColor
        : primaryColor,
      markers: [
        { location: [14.5995, 120.9842], size: 0.03 },
        { location: [19.076, 72.8777], size: 0.1 },
        { location: [23.8103, 90.4125], size: 0.05 },
        { location: [30.0444, 31.2357], size: 0.07 },
        { location: [39.9042, 116.4074], size: 0.08 },
        { location: [-23.5505, -46.6333], size: 0.1 },
        { location: [19.4326, -99.1332], size: 0.1 },
        { location: [40.7128, -74.006], size: 0.1 },
        { location: [34.6937, 135.5022], size: 0.05 },
        { location: [41.0082, 28.9784], size: 0.06 },
      ],
      onRender: (state) => {
        if (!pointerInteracting.current) phiRef.current += 0.005 // Use ref instead of variable
        state.phi = phiRef.current + rs.get()
        state.width = widthRef.current * 2
        state.height = widthRef.current * 2
      },
    })

    globeRef.current = globe
    setTimeout(() => (canvasRef.current.style.opacity = "1"), 0)
  }, [theme, rs, hslToRgbArray]) // Include all dependencies

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) widthRef.current = canvasRef.current.offsetWidth
      initGlobe()
    }

    window.addEventListener("resize", onResize)
    initGlobe()

    return () => {
      if (globeRef.current) globeRef.current.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [initGlobe]) // Now we can safely include initGlobe

  const updatePointerInteraction = (value) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      r.set(r.get() + delta / MOVEMENT_DAMPING)
    }
  }

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        )}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX
          updatePointerInteraction(e.clientX)
        }}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  )
}