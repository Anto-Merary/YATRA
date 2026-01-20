import './Hero.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import heroBg from '../assets/herobg.jpg'
import yatraText from '../assets/yatratxt.png'
import torriGate from '../assets/torrigate.png'
import yearText from '../assets/2026txt.png'
import videoSrc from '../assets/video.mp4'
import purpleBg from '../assets/purple.jpeg'
import eventImage from '../assets/event.jpeg'
import performanceImage from '../assets/performance.JPG'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function GlitchText({ koreanText, englishText, className, delay = 0, shouldStart = false, variant = 'glitch' }) {
  const [isGlitching, setIsGlitching] = useState(false)
  const [showEnglish, setShowEnglish] = useState(false)

  useEffect(() => {
    let glitchTimer = 0
    let transitionTimer = 0

    // When the section leaves view, reset so the effect can replay next time.
    if (!shouldStart) {
      setIsGlitching(false)
      setShowEnglish(false)
      return () => {
        if (glitchTimer) clearTimeout(glitchTimer)
        if (transitionTimer) clearTimeout(transitionTimer)
      }
    }

    if (variant === 'glitch') {
      // Start glitch effect after delay
      glitchTimer = window.setTimeout(() => {
        setIsGlitching(true)
      }, 1000 + delay)

      // Transition to English after glitch
      transitionTimer = window.setTimeout(() => {
        setShowEnglish(true)
        setIsGlitching(false)
      }, 2500 + delay)
    } else {
      // Blur-only crossfade (no glitch)
      transitionTimer = window.setTimeout(() => {
        setShowEnglish(true)
        setIsGlitching(false)
      }, 900 + delay)
    }

    return () => {
      clearTimeout(glitchTimer)
      clearTimeout(transitionTimer)
    }
  }, [delay, shouldStart, variant])

  return (
    <span
      className={`glitch-text-wrapper ${variant === 'blur' ? 'glitch-text-wrapper--blur' : ''} ${className} ${isGlitching ? 'is-glitching' : ''} ${showEnglish ? 'show-english' : ''}`}
    >
      {koreanText && (
        <span className="glitch-text-korean">{koreanText}</span>
      )}
      <span className="glitch-text-english">{englishText}</span>
    </span>
  )
}

function Hero() {
  // Keep a loader visible until every <img> in this component finishes (load or error).
  const TOTAL_IMAGES = 5
  const doneKeysRef = useRef(new Set())
  const [doneCount, setDoneCount] = useState(0)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isScrollReady, setIsScrollReady] = useState(false)
  const stageRef = useRef(null)
  const heroRef = useRef(null)
  const passesRef = useRef(null)
  const aboutRef = useRef(null)
  const aboutTitleRef = useRef(null)
  const aboutContentRef = useRef(null)
  const featuresSectionRef = useRef(null)
  const blastSectionRef = useRef(null)
  const blastCollageRef = useRef(null)
  const blastPhotoElsRef = useRef([])
  const hasAboutEnteredRef = useRef(false)
  const [isFeaturesSectionVisible, setIsFeaturesSectionVisible] = useState(false)
  const [isBlastSectionVisible, setIsBlastSectionVisible] = useState(false)

  const blastImages = useMemo(() => {
    // Use only web-safe formats (HEIC isn't reliably supported in browsers).
    const modules = import.meta.glob('../assets/gal/*.{jpg,jpeg,png,webp,gif}', {
      eager: true,
      import: 'default',
    })

    const srcs = Object.keys(modules)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => modules[k])

    // Never reuse a photo. If fewer than 6 exist, we render fewer than 6.
    return srcs.slice(0, 6)
  }, [])

  // Lantern (lamp) glow hotspots placed over the background art.
  // These are NOT visible UI elements—just an overlay to make each lamp "bloom" randomly.
  const lamps = useMemo(
    () => [
      { id: 'lamp-0', x: 4.5, y: 18.2 },
      { id: 'lamp-1', x: 16.0, y: 20.1 },
      { id: 'lamp-2', x: 30.2, y: 19.4 },
      { id: 'lamp-3', x: 44.2, y: 20.0 },
      { id: 'lamp-4', x: 58.0, y: 20.1 },
      { id: 'lamp-5', x: 71.6, y: 20.4 },
      { id: 'lamp-6', x: 85.0, y: 20.0 },
      { id: 'lamp-7', x: 96.0, y: 18.6 },
    ],
    []
  )

  // Incrementing "sequence" values let us re-trigger a one-shot CSS animation per lamp.
  const [lampSeq, setLampSeq] = useState(() => Object.fromEntries(lamps.map((l) => [l.id, 0])))

  const markDone = useCallback((key) => {
    if (doneKeysRef.current.has(key)) return
    doneKeysRef.current.add(key)
    setDoneCount((c) => c + 1)
  }, [])

  const img = useMemo(() => {
    const make = (key) => ({
      ref: (node) => {
        // If the image is already in cache, `onLoad` may not fire reliably across all cases.
        if (node && node.complete) markDone(key)
      },
      onLoad: () => markDone(key),
      onError: () => markDone(key),
    })

    return {
      bleedBg: make('bleed-bg'),
      bg: make('bg'),
      year: make('year'),
      yatra: make('yatra'),
      torii: make('torii'),
    }
  }, [markDone])

  const isLoading = doneCount < TOTAL_IMAGES

  // Trigger entrance animations exactly once, right after we finish loading.
  useEffect(() => {
    if (hasLoaded || isLoading) return

    // Start animations AFTER the loader finishes fading out,
    // so the motion is visible (not hidden behind the overlay).
    const t = window.setTimeout(() => setHasLoaded(true), 260)
    return () => window.clearTimeout(t)
  }, [hasLoaded, isLoading])

  // After the entrance animation finishes, enable the scroll-based "settle" transforms.
  useEffect(() => {
    if (!hasLoaded) return
    const t = window.setTimeout(() => setIsScrollReady(true), 1200)
    return () => window.clearTimeout(t)
  }, [hasLoaded])

  const runAboutReveal = useCallback(() => {
    // Wait for React to finish mounting new elements when step changes
    const attemptReveal = (attempts = 0) => {
      const titleEl = aboutTitleRef.current
      const contentEl = aboutContentRef.current
      
      if (!titleEl || !contentEl) {
        // If elements aren't ready yet, try again (max 5 attempts)
        if (attempts < 5) {
          window.requestAnimationFrame(() => attemptReveal(attempts + 1))
        }
        return
      }

      // Reset classes so we can replay the reveal on step change.
      titleEl.classList.remove('is-visible', 'is-exiting')
      contentEl.classList.remove('is-visible', 'is-exiting')

      // Wait one more frame to ensure classes are reset, then start reveal
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          titleEl.classList.add('is-visible')
          window.setTimeout(() => contentEl.classList.add('is-visible'), 180)
        })
      })
    }

    attemptReveal()
  }, [])

  // About section: reveal when it enters view (and remember it's been seen).
  useEffect(() => {
    const sectionEl = aboutRef.current
    if (!sectionEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        hasAboutEnteredRef.current = true
        runAboutReveal()
        observer.disconnect()
      },
      { threshold: 0.28, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(sectionEl)
    return () => {
      observer.disconnect()
    }
  }, [runAboutReveal])

  const scrollToPasses = useCallback(() => {
    const el = passesRef.current
    if (!el) return
    // Works with native scroll; Lenis will still keep things smooth.
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const goToEvents = useCallback(() => {
    window.location.assign('/events')
  }, [])

  // Features section: trigger glitch animation when section enters view
  useEffect(() => {
    const sectionEl = featuresSectionRef.current
    if (!sectionEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        // Hysteresis prevents flicker + avoids awkward mid-section resets:
        // - Enter once ~20% visible
        // - Reset only when almost gone (~5% visible)
        const ratio = entry.intersectionRatio || 0

        setIsFeaturesSectionVisible((prev) => {
          if (!prev && ratio >= 0.2) return true
          if (prev && ratio <= 0.05) return false
          return prev
        })
      },
      { threshold: [0, 0.05, 0.2], rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(sectionEl)
    return () => {
      observer.disconnect()
    }
  }, [])

  // BLAST INTO PAST section: trigger blur crossfade when section enters view
  useEffect(() => {
    const sectionEl = blastSectionRef.current
    if (!sectionEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const ratio = entry.intersectionRatio || 0
        setIsBlastSectionVisible((prev) => {
          if (!prev && ratio >= 0.2) return true
          if (prev && ratio <= 0.05) return false
          return prev
        })
      },
      { threshold: [0, 0.05, 0.2], rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(sectionEl)
    return () => {
      observer.disconnect()
    }
  }, [])

  // BLAST collage: no sticky/pin — simple cinematic entrance.
  useEffect(() => {
    const sectionEl = blastSectionRef.current
    const collageEl = blastCollageRef.current
    if (!sectionEl || !collageEl) return

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    gsap.registerPlugin(ScrollTrigger)

    const els = blastPhotoElsRef.current.filter(Boolean)
    if (els.length === 0) return

    // GSAP-driven entrance: slower, smoother, more "cinematic" (no scrub).
    let tl = null
    let st = null

    const computePositions = () => {
      const r = collageEl.getBoundingClientRect()
      const w = Math.max(1, r.width)
      const h = Math.max(1, r.height)
      const count = els.length

      const s = Math.min(w, h)
      const spreadX = s * 0.33
      const spreadY = Math.min(h * 0.34, s * 0.52)

      const baseFinal = [
        { x: -spreadX * 0.92, y: -spreadY * 0.05 },
        { x: spreadX * 0.12, y: -spreadY * 0.98 },
        { x: spreadX * 0.98, y: spreadY * 0.08 },
        { x: spreadX * 0.52, y: spreadY * 0.92 },
        { x: -spreadX * 0.62, y: spreadY * 1.02 },
        { x: -spreadX * 1.02, y: spreadY * 0.42 },
      ]
      const finalPositions = baseFinal.slice(0, count)

      const baseDirs = [
        { x: -1, y: -0.15 },
        { x: 1, y: -0.25 },
        { x: 1, y: 0.2 },
        { x: 0.75, y: 0.9 },
        { x: -0.6, y: 1 },
        { x: -1, y: 0.55 },
      ]
      const startDirs = baseDirs.slice(0, count)
      const amp = s * 0.95

      const startPositions = finalPositions.map((p, i) => ({
        x: p.x + (startDirs[i]?.x ?? 0) * amp,
        y: p.y + (startDirs[i]?.y ?? 0) * amp,
      }))

      // Gentle rotations (deterministic) so it looks natural but stable.
      const rotations = [ -6, 5, -3, 7, -4, 6 ].slice(0, count)

      return { finalPositions, startPositions, rotations }
    }

    const build = () => {
      if (tl) tl.kill()
      if (st) st.kill()
      tl = null
      st = null

      const { finalPositions, startPositions, rotations } = computePositions()

      // Base state
      els.forEach((el, i) => {
        const start = startPositions[i] || { x: 0, y: 0 }
        gsap.set(el, {
          x: start.x,
          y: start.y,
          scale: 1.6,
          opacity: 0,
          rotate: rotations[i] ?? 0,
          transformOrigin: '50% 50%',
          zIndex: 10 + i,
          force3D: true,
        })
      })

      if (reduceMotion) {
        els.forEach((el, i) => {
          const base = finalPositions[i] || { x: 0, y: 0 }
          gsap.set(el, { x: base.x, y: base.y, scale: 1, opacity: 1, rotate: 0 })
        })
        return
      }

      tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })
      tl.pause(0)

      // Slower + slightly overlapping entrances
      els.forEach((el, i) => {
        const base = finalPositions[i] || { x: 0, y: 0 }
        tl.to(
          el,
          {
            x: base.x,
            y: base.y,
            scale: 1,
            opacity: 1,
            rotate: 0,
            duration: 1.65,
          },
          i * 0.38
        )
      })

      // Trigger once when section enters view (and reset when scrolling back up).
      st = ScrollTrigger.create({
        id: 'blast-collage',
        trigger: sectionEl,
        start: 'top 72%',
        onEnter: () => {
          if (!tl) return
          tl.timeScale(1).play()
        },
        onEnterBack: () => {
          // If user scrolls back down into the section, ensure it plays forward again.
          if (!tl) return
          tl.timeScale(1).play()
        },
        onLeaveBack: () => {
          // Reverse the collage gracefully when scrolling up out of the section.
          if (!tl) return
          tl.timeScale(1).reverse()
        },
        invalidateOnRefresh: true,
      })
    }

    // Build once, then rebuild on refresh/resize (keeps layout crisp).
    build()

    const onRefresh = () => build()
    ScrollTrigger.addEventListener('refreshInit', onRefresh)
    ScrollTrigger.refresh()

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', onRefresh)
      if (st) st.kill()
      if (tl) tl.kill()
    }
  }, [blastImages.length])


  // Scroll-based settle interaction - continuous and proportional to scroll distance,
  // but visually smoothed so it feels cinematic (no jitter/snapping).
  // Progress is 0 at top of hero, 1 when hero has fully scrolled out of view.
  useEffect(() => {
    if (!hasLoaded) return
    const el = stageRef.current
    const heroEl = heroRef.current
    if (!el || !heroEl) return

    let raf = 0
    let lastTs = 0
    let target = 0
    let current = 0
    let isAnimating = false

    const update = (ts = performance.now()) => {
      raf = 0
      const dt = Math.min(50, ts - (lastTs || ts))
      lastTs = ts

      // Improved smoothing: faster response while maintaining smoothness
      // Using a higher base value for more responsive animation
      const alpha = 1 - Math.pow(0.85, dt / 16.67) // ~0.15–0.25 typical, more responsive
      current = current + (target - current) * alpha

      el.style.setProperty('--settle', current.toFixed(6))

      // Keep animating until we're very close to target
      const diff = Math.abs(target - current)
      if (diff > 0.0001) {
        raf = window.requestAnimationFrame(update)
        isAnimating = true
      } else {
        current = target
        el.style.setProperty('--settle', current.toFixed(6))
        isAnimating = false
      }
    }

    const onScroll = () => {
      const rect = heroEl.getBoundingClientRect()
      // When rect.top = 0 => progress 0
      // When rect.top = -rect.height => progress 1 (hero fully scrolled past)
      const raw = (-rect.top) / Math.max(1, rect.height)
      target = Math.min(1, Math.max(0, raw))

      // Always start animation if not already running
      if (!isAnimating && raf === 0) {
        raf = window.requestAnimationFrame(update)
      }
    }

    // Init target/current from current scroll position
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [hasLoaded])

  // Random lamp blooms (random order / random timing).
  useEffect(() => {
    if (isLoading) return

    let cancelled = false
    let timeoutId = 0

    const rand = (min, max) => min + Math.random() * (max - min)

    const schedule = () => {
      if (cancelled) return

      // Next bloom in 300ms–1200ms
      const nextIn = Math.round(rand(300, 1200))
      timeoutId = window.setTimeout(() => {
        if (cancelled) return

        // Bloom 1–2 random lamps (sometimes 2 for simultaneous glow)
        const bloomCount = Math.random() < 0.4 ? 2 : 1
        const picked = new Set()
        while (picked.size < bloomCount) {
          picked.add(lamps[Math.floor(Math.random() * lamps.length)].id)
        }

        setLampSeq((prev) => {
          const next = { ...prev }
          picked.forEach((id) => {
            next[id] = (next[id] || 0) + 1
          })
          return next
        })

        schedule()
      }, nextIn)
    }

    schedule()

    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [isLoading, lamps])

  return (
    <>
    <section
      className={`hero ${hasLoaded ? 'is-loaded' : ''} ${isLoading ? 'is-loading' : ''}`}
      ref={heroRef}
    >
      {isLoading && (
        <div
          className="hero-loader"
          role="status"
          aria-live="polite"
          aria-label="Loading"
        >
          <div className="hero-spinner" aria-hidden="true" />
          <div className="hero-loader-text">Loading…</div>
        </div>
      )}

      {/* Full-bleed background (blurred) so the stage can keep a fixed aspect ratio */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="hero-bleed-bg"
        {...img.bleedBg}
      />

      {/* Fixed-aspect "stage" that scales uniformly across all mobile sizes */}
      <div
        ref={stageRef}
        className={`hero-stage ${isLoading ? 'is-loading' : ''} ${hasLoaded ? 'is-loaded' : ''} ${isScrollReady ? 'is-scroll-ready' : ''}`}
        aria-busy={isLoading}
      >
        {/* Background Layer - Base */}
        <div className="hero-background">
          <img src={heroBg} alt="Hero Background" className="hero-bg-image" {...img.bg} />
        </div>

        {/* Lamp glow overlay (maps to the lanterns in the background image) */}
        <div className="hero-lamps" aria-hidden="true">
          {lamps.map((lamp) => {
            const seq = lampSeq[lamp.id] || 0
            const amp = (0.85 + Math.random() * 0.6).toFixed(2)
            // Wider duration range: sometimes fast (800ms), sometimes slow (3500ms) for graceful variation
            const dur = `${Math.round(800 + Math.random() * 2700)}ms`

            return (
              <span
                key={`${lamp.id}-${seq}`}
                className="hero-lamp-glow"
                style={{
                  '--x': `${lamp.x}%`,
                  '--y': `${lamp.y}%`,
                  '--amp': amp,
                  '--bloom-dur': dur,
                  '--bloom-delay': `${Math.round(Math.random() * 200)}ms`,
                }}
              />
            )
          })}
        </div>

        {/* Video Container - Center Focus */}
        <div className="hero-video-container">
          <video className="hero-video" autoPlay loop muted playsInline>
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>

        {/* "2026" Text - Behind Torii gate */}
        <div className="hero-year-text">
          <img src={yearText} alt="2026" className="year-text-image" {...img.year} />
        </div>

        {/* Action Buttons - Below 2026 text */}
        <div className="hero-buttons">
          <button className="hero-button buy-tickets" onClick={scrollToPasses} type="button">
            <span className="hero-button-text">BUY TICKETS</span>
            <span className="star-icon" aria-hidden="true">
              ✦
            </span>
          </button>
        </div>

        {/* YATRA Text - Mid Layer (behind Torii gate) */}
        <div className="hero-yatra-text">
          <img src={yatraText} alt="YATRA" className="yatra-text-image" {...img.yatra} />
        </div>

        {/* Torii Gate Overlay - Foreground Mask (Topmost) */}
        <div className="hero-torri-gate">
          <img src={torriGate} alt="Torii Gate" className="torri-gate-image" {...img.torii} />
        </div>
      </div>

      {/* Section Divider - Bottom of Hero */}
      <div className="hero-section-divider">
        <div className="hero-divider-scroll">
          <div className="hero-divider-track" aria-label="Event dates">
            <div className="hero-divider-content">
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
            </div>
            <div className="hero-divider-content" aria-hidden="true">
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    {/* Black Background Section - After Divider */}
    <section className="hero-black-section" aria-label="About section" ref={aboutRef}>
      <div className="about-sticky">
        <div className="about-container">
          <div key="about-yatra">
            <h2 className="about-title reveal" ref={aboutTitleRef}>
              <span className="about-title-about">ABOUT</span>{' '}
              <span className="about-title-rit">YATRA&apos;26</span>
            </h2>
            <p className="about-content reveal" ref={aboutContentRef} style={{ textAlign: 'justify' }}>
              YATRA 2026 is a grand intercollegiate cultural fest of Rajalakshmi Institutions, organized by the students with the support of the faculty, principal, and management. It stands as a vibrant platform that celebrates culture, creativity, and youthful energy.
              <br /><br />
              Rooted in cultural heritage and artistic expression, YATRA brings together students to showcase their talents through music, dance, art, and a wide range of cultural events. The fest aims to inspire confidence, encourage participation, and create a space where passion meets performance.
              <br /><br />
              With the presence of distinguished guests and an atmosphere filled with enthusiasm and celebration, YATRA 2026 promises an unforgettable cultural journey that unites tradition, talent, and togetherness.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Features Divider */}
    <div className="features-section-divider" aria-hidden="true">
      <div className="hero-divider-scroll">
        <div className="hero-divider-track">
          <div className="hero-divider-content">
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
          </div>
          <div className="hero-divider-content" aria-hidden="true">
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
          </div>
        </div>
      </div>
    </div>

    {/* FEATURES OF YATRA section (content coming next) */}
    <section
      className={`features-section ${isFeaturesSectionVisible ? 'is-visible' : ''}`}
      aria-label="Features of Yatra"
      ref={featuresSectionRef}
    >
      <div className="features-container">
        <h2 className="features-title">
          <GlitchText 
            koreanText="야트라의 특징" 
            englishText="FEATURES OF" 
            className="features-title-features" 
            delay={0}
            shouldStart={isFeaturesSectionVisible}
            variant="blur"
          />
          <br />
          <GlitchText 
            koreanText="" 
            englishText="YATRA" 
            className="features-title-rest" 
            delay={500}
            shouldStart={isFeaturesSectionVisible}
            variant="blur"
          />
        </h2>
        <div className="features-event-media features-event-media--left">
          <div className="features-event-badge">
            50+ Events with CASH PRICE
          </div>
          <img src={eventImage} alt="Yatra Event" className="features-event-image" />
          <button className="features-show-more-btn" onClick={goToEvents} type="button">
            Register Now
          </button>
        </div>
        <div className="features-event-media features-event-media--right">
          <div className="features-event-badge">
            ELECTRIFYING PERFORMANCES
          </div>
          <img src={performanceImage} alt="Electrifying Performance" className="features-event-image" />
          <button className="features-show-more-btn">SEE LINEUP</button>
        </div>
      </div>
    </section>

    {/* BLAST INTO PAST section */}
    <section
      className={`blast-section ${isBlastSectionVisible ? 'is-visible' : ''}`}
      aria-label="Blast into Past"
      ref={blastSectionRef}
    >
      <div className="blast-inner">
        <div className="features-container">
          <h2 className="features-title">
            <GlitchText
              koreanText="과거 속으로 돌진하다"
              englishText="BLAST INTO THE"
              className="blast-title-prefix"
              delay={0}
              shouldStart={isBlastSectionVisible}
              variant="blur"
            />
            <br />
            <GlitchText
              koreanText=""
              englishText="PAST"
              className="blast-title-highlight"
              delay={500}
              shouldStart={isBlastSectionVisible}
              variant="blur"
            />
          </h2>

          <div className="blast-collage" ref={blastCollageRef} aria-hidden="true">
            {blastImages.map((src, idx) => (
              <img
                key={`${src}-${idx}`}
                ref={(el) => {
                  blastPhotoElsRef.current[idx] = el
                }}
                src={src}
                alt=""
                className="blast-photo"
                draggable="false"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* BUY PASSES section (from desktop registration) */}
    <section
      className="mobile-passes-section"
      aria-label="Buy Passes"
      id="buy-passes"
      ref={passesRef}
    >
      <div className="mobile-passes-container">
        <h2 className="mobile-passes-title">
          Get <span className="mobile-passes-title-accent">Passes</span>
        </h2>

        <div className="mobile-passes-grid">
          {/* YATRA ENTRY PASS */}
          <div className="mobile-pass-card mobile-pass-card--featured">
            <div className="mobile-pass-card-header">
              <h3 className="mobile-pass-card-title mobile-pass-card-title--accent">
                YATRA ENTRY PASS
              </h3>
              <p className="mobile-pass-price">₹500</p>
              <p className="mobile-pass-subprice">(RIT students)</p>
            </div>
            <div className="mobile-pass-divider" aria-hidden="true" />
            <ul className="mobile-pass-card-list mobile-pass-card-list--bright">
              <li>• Access to 2 DAYS</li>
              <li>• Proshow</li>
              <li>• DJ Night</li>
            </ul>
            <a
              href="https://formbuilder.ccavenue.com/live/icici-bank/rajalakshmi-institue-of-technology-2/yatra-2026-reg-fees-link"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-pass-cta mobile-pass-cta--accent"
            >
              Register Now
            </a>
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="mobile-footer">
      <div className="mobile-footer-container">
        <div className="mobile-footer-left">
          <h2 className="mobile-footer-title">YATRA'26</h2>
          <div className="mobile-footer-info">
            <div>
              <p className="mobile-footer-label">Address</p>
              <p className="mobile-footer-text">Kuthambakkam, Chennai, Tamil Nadu 600124</p>
            </div>
            <div>
              <p className="mobile-footer-label">Website</p>
              <a href="https://www.ritchennai.org" target="_blank" rel="noopener noreferrer" className="mobile-footer-link">
                www.ritchennai.org
              </a>
            </div>
          </div>
        </div>
        <div className="mobile-footer-right">
          <div className="mobile-footer-contact">
            <div>
              <p className="mobile-footer-label">Phone</p>
              <a href="tel:04437181600" className="mobile-footer-link">044 3718 1600</a>
            </div>
          </div>
          <div className="mobile-footer-social">
            <a
              href="https://www.instagram.com/yatra_rit/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-footer-social-link"
              aria-label="Instagram"
            >
              <svg className="mobile-footer-social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@rajalakshmiinstituteoftech4448"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-footer-social-link"
              aria-label="YouTube"
            >
              <svg className="mobile-footer-social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
    </>
  )
}

export default Hero
