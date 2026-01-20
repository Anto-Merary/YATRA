import Hero from './components/Hero'
import './App.css'
import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function App() {
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

  return (
    <div className="App">
      <Hero />
    </div>
  )
}

export default App
