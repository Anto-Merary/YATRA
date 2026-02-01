import Hero from './components/Hero'
import './App.css'
import { useEffect, useMemo, useState } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Dock from '../components/Dock'
import { motion } from 'framer-motion'
import { Home, List } from 'lucide-react'
import { useDeviceCapability } from './hooks/useDeviceCapability'

function App() {
  const [isMobile, setIsMobile] = useState(false)
  const deviceCapability = useDeviceCapability()

  useEffect(() => {
    // Smooth scrolling (mobile) + GSAP integration
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Skip Lenis on low-end devices or if user prefers reduced motion
    if (reduceMotion || deviceCapability.isLowEnd) {
      gsap.registerPlugin(ScrollTrigger)
      // Still need to refresh ScrollTrigger for GSAP animations
      window.setTimeout(() => ScrollTrigger.refresh(), 0)
      return
    }

    gsap.registerPlugin(ScrollTrigger)

    // Adaptive Lenis settings based on device capability
    const lenis = new Lenis({
      // Shorter duration on mid-range devices for more responsive feel
      duration: deviceCapability.isMidRange ? 0.9 : 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Disable smooth touch on mid-range to reduce jank
      smoothTouch: deviceCapability.isHighEnd,
      // Lower touch multiplier for better control
      touchMultiplier: deviceCapability.isHighEnd ? 1.2 : 0.9,
      wheelMultiplier: 1.0,
      normalizeWheel: true,
      // Sync touch events for better performance
      syncTouch: true,
      syncTouchLerp: deviceCapability.isHighEnd ? 0.1 : 0.075,
    })

    // Throttle ScrollTrigger updates on mid-range devices
    let lastScrollTime = 0
    const scrollThrottle = deviceCapability.isMidRange ? 16 : 0
    
    const onScroll = () => {
      const now = performance.now()
      if (scrollThrottle > 0 && now - lastScrollTime < scrollThrottle) return
      lastScrollTime = now
      ScrollTrigger.update()
    }
    lenis.on('scroll', onScroll)

    const onTick = (time) => {
      // GSAP's ticker time is in seconds, Lenis expects ms
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    // Disable lag smoothing for more responsive animations
    gsap.ticker.lagSmoothing(0)

    // Ensure ScrollTrigger uses latest measurements
    window.setTimeout(() => ScrollTrigger.refresh(), 0)

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [deviceCapability.isLowEnd, deviceCapability.isMidRange, deviceCapability.isHighEnd])

  // Show dock for phone-sized viewports (iPad mini+ should not use mobile layout)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(Math.min(window.innerWidth, window.innerHeight) <= 743)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const dockItems = useMemo(() => {
    return [
      {
        icon: <Home className="dock-svg" />,
        label: 'Home',
        onClick: () => window.location.assign('/'),
      },
      {
        icon: <List className="dock-svg" />,
        label: 'Events',
        onClick: () => window.location.assign('/events'),
      },
    ]
  }, [])

  return (
    <div className="App">
      <Hero />

      {isMobile && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mobile-dock-wrapper"
        >
          <div className="mobile-dock-inner">
            <Dock
              items={dockItems}
              className="mobile-dock"
              baseItemSize={44}
              magnification={56}
              distance={150}
              panelHeight={64}
              dockHeight={80}
              spring={{ mass: 0.1, stiffness: 200, damping: 15 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default App
