"use client"

import { useEffect, useRef, useCallback } from "react"
import createGlobe from "cobe"
import { useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

const MOVEMENT_DAMPING = 1400

export function Globe({ className }) {
  const { theme } = useTheme()
  const phiRef = useRef(0)
  const canvasRef = useRef(null)
  const globeRef = useRef(null)
  const pointerStartX = useRef(null)
  const r = useMotionValue(0)
  const rs = useSpring(r, { mass: 1, damping: 30, stiffness: 100 })

  const hslToRgbArray = useCallback((hsl) => {
    const el = document.createElement("div")
    el.style.color = hsl
    document.body.appendChild(el)
    const rgb = getComputedStyle(el).color
    document.body.removeChild(el)
    return rgb.match(/\d+/g).map((x) => parseInt(x) / 255)
  }, [])

  const initGlobe = useCallback(() => {
    if (!canvasRef.current) return

    const width = canvasRef.current.offsetWidth * 2
    const rootStyles = getComputedStyle(document.documentElement)
    const primaryColor = hslToRgbArray(`hsl(${rootStyles.getPropertyValue("--primary")})`)
    const isDark = theme === "dark"

    if (globeRef.current) return // ✅ Prevent unnecessary re-init

    const globe = createGlobe(canvasRef.current, {
      width,
      height: width,
      devicePixelRatio: 2,
      phi: 0,
      theta: 0.3,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 1.2 : 0.4,
      mapSamples: 16000,
      mapBrightness: isDark ? 1.1 : 1.2,
      baseColor: isDark
        ? hslToRgbArray(`hsl(${rootStyles.getPropertyValue("--muted-foreground")})`)
        : [1, 1, 1],
      glowColor: [1, 1, 1],
      markerColor: primaryColor,
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
        phiRef.current += 0.005
        state.phi = phiRef.current + rs.get()
      },
    })

    globeRef.current = globe
    setTimeout(() => (canvasRef.current.style.opacity = "1"), 0)
  }, [theme, rs, hslToRgbArray])

  useEffect(() => {
    let resizeTimeout

    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (!canvasRef.current || !globeRef.current) return
        const width = canvasRef.current.offsetWidth * 2
        globeRef.current.width = width
        globeRef.current.height = width
      }, 250) // 🧠 Throttle to avoid flickering
    }

    window.addEventListener("resize", handleResize, { passive: true })
    initGlobe()

    return () => {
      clearTimeout(resizeTimeout)
      if (globeRef.current) globeRef.current.destroy()
      globeRef.current = null
      window.removeEventListener("resize", handleResize)
    }
  }, [initGlobe])

  const handlePointerDown = (e) => {
    pointerStartX.current = e.clientX || e.touches?.[0]?.clientX
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
  }

  const handlePointerMove = (e) => {
    if (pointerStartX.current == null) return
    const clientX = e.clientX || e.touches?.[0]?.clientX
    const delta = clientX - pointerStartX.current
    r.set(r.get() + delta / MOVEMENT_DAMPING)
    pointerStartX.current = clientX
  }

  const handlePointerUp = () => {
    pointerStartX.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = "grab"
  }

  return (
    <div className={cn("absolute inset-0 mx-auto aspect-square w-full max-w-[600px]", className)}>
      <canvas
        ref={canvasRef}
        className="size-full opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerUp}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerUp}
      />
    </div>
  )
}
