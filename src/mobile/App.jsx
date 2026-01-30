import Hero from './components/Hero'
import './App.css'
import { useEffect, useMemo, useState } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Dock from '../components/Dock'
import { motion } from 'framer-motion'
import { Home, List } from 'lucide-react'

function App() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Smooth scrolling (mobile) + GSAP integration
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) return

    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      smoothTouch: true,
      touchMultiplier: 1.2,
      wheelMultiplier: 1.0,
      normalizeWheel: true,
    })

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    const onTick = (time) => {
      // GSAP's ticker time is in seconds, Lenis expects ms
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    // Ensure ScrollTrigger uses latest measurements
    window.setTimeout(() => ScrollTrigger.refresh(), 0)

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(onTick)
      lenis.destroy()
    }
  }, [])

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
