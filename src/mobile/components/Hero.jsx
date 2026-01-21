import './Hero.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import heroBg from '../assets/optimized/herobg-w1280.webp'
import heroBgLq from '../assets/optimized/herobg-lq.webp'
import heroBgPoster from '../assets/optimized/herobg-w640.webp'
import yatraText from '../assets/optimized/yatratxt-w1536.webp'
import torriGate from '../assets/optimized/torrigate-w1280.webp'
import yearText from '../assets/optimized/2026txt-w1536.webp'
import videoSrc from '../assets/video.mp4'
import eventImage from '../assets/optimized/event-w1024.webp'
import performanceImage from '../assets/optimized/performance-w1280.webp'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

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
  // Progressive loading: render immediately, then enhance as assets arrive.
  const [loaded, setLoaded] = useState(() => ({
    bleedBg: false,
    bg: false,
    year: false,
    yatra: false,
    torii: false,
  }))
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
  const [shimmerTrigger, setShimmerTrigger] = useState(0)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const videoContainerRef = useRef(null)
  const videoRef = useRef(null)

  // Network status detection
  const { shouldLoadVideo: networkShouldLoad, isSlowConnection } = useNetworkStatus()

  // Lineup teaser modal (catchy reveal-soon popup)
  const [lineupModalState, setLineupModalState] = useState('closed') // 'closed' | 'open' | 'closing'
  const isLineupModalOpen = lineupModalState !== 'closed'

  const openLineupModal = useCallback(() => {
    setLineupModalState('open')
  }, [])

  const closeLineupModal = useCallback(() => {
    setLineupModalState((s) => (s === 'open' ? 'closing' : s))
  }, [])

  useEffect(() => {
    if (lineupModalState !== 'closing') return
    const t = window.setTimeout(() => setLineupModalState('closed'), 340)
    return () => window.clearTimeout(t)
  }, [lineupModalState])

  useEffect(() => {
    if (!isLineupModalOpen) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeLineupModal()
    }

    // lock scroll while modal is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isLineupModalOpen, closeLineupModal])

  const lineupSparks = useMemo(() => {
    // Deterministic enough across renders; keeps a consistent “spark” layout.
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.round(8 + Math.random() * 84),
      y: Math.round(10 + Math.random() * 80),
      d: (Math.random() * 1.4).toFixed(2),
      s: (2 + Math.random() * 3.5).toFixed(2),
      t: (2.4 + Math.random() * 2.8).toFixed(2),
    }))
  }, [])

  const blastImages = useMemo(() => {
    // Use only web-safe formats (HEIC isn't reliably supported in browsers).
    // Include both lowercase and uppercase extensions to catch files like syn.JPG
    const modules = import.meta.glob('../assets/gal/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP,gif,GIF}', {
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

  const markLoaded = useCallback((key) => {
    setLoaded((prev) => {
      if (prev[key]) return prev
      return { ...prev, [key]: true }
    })
  }, [])

  const img = useMemo(() => {
    const make = (key) => ({
      onLoad: () => markLoaded(key),
      onError: () => markLoaded(key),
    })

    return {
      bleedBg: make('bleedBg'),
      bg: make('bg'),
      year: make('year'),
      yatra: make('yatra'),
      torii: make('torii'),
    }
  }, [markLoaded])

  const isHeroReady = loaded.bg && loaded.year && loaded.yatra && loaded.torii

  // Trigger entrance animations exactly once, right after we finish loading.
  useEffect(() => {
    if (hasLoaded) return

    // Start entrance once critical hero assets are ready,
    // but never wait too long on slow networks.
    if (isHeroReady) {
      const t = window.setTimeout(() => setHasLoaded(true), 60)
      return () => window.clearTimeout(t)
    }

    const fallback = window.setTimeout(() => setHasLoaded(true), 1200)
    return () => window.clearTimeout(fallback)
  }, [hasLoaded, isHeroReady])

  // After the entrance animation finishes, enable the scroll-based "settle" transforms.
  useEffect(() => {
    if (!hasLoaded) return
    const t = window.setTimeout(() => setIsScrollReady(true), 1200)
    return () => window.clearTimeout(t)
  }, [hasLoaded])

  // Lazy load video when it enters viewport (and network allows it)
  useEffect(() => {
    if (!networkShouldLoad) return // Don't load video on slow connections

    const containerEl = videoContainerRef.current
    if (!containerEl) return

    // Check if already in viewport
    const rect = containerEl.getBoundingClientRect()
    const isInViewport =
      rect.top < window.innerHeight + 50 &&
      rect.bottom > -50 &&
      rect.left < window.innerWidth &&
      rect.right > 0

    if (isInViewport) {
      // Video is already visible
      setShouldLoadVideo(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadVideo(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    )

    observer.observe(containerEl)

    return () => {
      observer.disconnect()
    }
  }, [networkShouldLoad])

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
    if (!hasLoaded) return

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
  }, [hasLoaded, lamps])

  // Random shimmer effect for BUY TICKETS button
  useEffect(() => {
    if (!hasLoaded) return

    let cancelled = false
    let timeoutId = 0

    const rand = (min, max) => min + Math.random() * (max - min)

    const scheduleShimmer = () => {
      if (cancelled) return

      // Random interval between 3-7 seconds for subtle, natural feel
      const nextIn = Math.round(rand(3000, 7000))
      timeoutId = window.setTimeout(() => {
        if (cancelled) return

        // Trigger shimmer by updating state
        setShimmerTrigger((prev) => prev + 1)
        
        scheduleShimmer()
      }, nextIn)
    }

    // Start first shimmer after initial delay (2-4 seconds)
    const initialDelay = Math.round(rand(2000, 4000))
    timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setShimmerTrigger(1)
        scheduleShimmer()
      }
    }, initialDelay)

    return () => {
      cancelled = true
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [hasLoaded])

  return (
    <>
    <section
      className={`hero ${hasLoaded ? 'is-loaded' : ''}`}
      ref={heroRef}
    >
      {/* Full-bleed background (blurred) so the stage can keep a fixed aspect ratio */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="hero-bleed-bg"
        decoding="async"
        loading="eager"
        fetchPriority="high"
        {...img.bleedBg}
      />

      {/* Fixed-aspect "stage" that scales uniformly across all mobile sizes */}
      <div
        ref={stageRef}
        className={`hero-stage ${hasLoaded ? 'is-loaded' : ''} ${isScrollReady ? 'is-scroll-ready' : ''}`}
        aria-busy={!hasLoaded}
      >
        {/* Background Layer - Base */}
        <div className="hero-background">
          <img
            src={heroBg}
            alt="Hero Background"
            className="hero-bg-image"
            decoding="async"
            loading="eager"
            fetchPriority="high"
            {...img.bg}
          />
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
        <div className="hero-video-container" ref={videoContainerRef}>
          {shouldLoadVideo ? (
            <video
              ref={videoRef}
              className="hero-video"
              autoPlay
              loop
              muted
              playsInline
              preload={isSlowConnection ? 'metadata' : 'auto'}
              poster={heroBgPoster}
              onLoadedData={() => {
                // Auto-play when data is loaded (on fast connections only)
                if (videoRef.current && networkShouldLoad && !isSlowConnection) {
                  videoRef.current.play().catch(() => {
                    // Ignore autoplay errors (browser policies)
                  })
                }
              }}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : (
            <div
              className="hero-video-poster"
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${heroBgPoster})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
        </div>

        {/* "2026" Text - Behind Torii gate */}
        <div className="hero-year-text">
          <img src={yearText} alt="2026" className="year-text-image" {...img.year} />
        </div>

        {/* Action Buttons - Below 2026 text */}
        <div className="hero-buttons">
          <button 
            className={`hero-button buy-tickets ${shimmerTrigger > 0 ? 'shimmer-active' : ''}`}
            onClick={scrollToPasses} 
            type="button"
            data-shimmer-trigger={shimmerTrigger}
          >
            <span className="hero-button-shimmer" aria-hidden="true" />
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
          <button className="features-show-more-btn" type="button" onClick={openLineupModal}>
            SHOW LINEUP
          </button>
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
          
          {/* CHECK EVENTS Button */}
          <button
            type="button"
            onClick={goToEvents}
            className="mobile-check-events-btn"
          >
            CHECK EVENTS
          </button>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer id="footer" className="relative mt-20 border-t border-white/10 bg-black pb-24">
      <div className="max-w-7xl mx-auto relative py-8 sm:py-10 md:py-12 px-4 sm:px-6">
        {/* Main Title - Centered at top */}
        <div className="flex justify-center mb-6 sm:mb-10 md:mb-12 overflow-hidden px-2">
          <div className="w-full max-w-5xl h-28 sm:h-36 md:h-44 overflow-hidden py-2 sm:py-4 md:py-5 flex items-center justify-center">
            <div 
              className="font-akira text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wider"
              style={{
                background: "linear-gradient(0deg, rgb(205, 7, 194) 0%, rgba(205, 7, 194, 0.65) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              YATRA'26
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col md:flex-row md:justify-between gap-6 sm:gap-10 md:gap-8 mb-8 sm:mb-12">
          {/* Left Column - Address */}
          <div className="flex-1">
            <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed text-left">
              <div className="font-semibold text-white">Rajalakshmi Institute of Technology</div>
              <div className="text-white/95">Bangalore Highway Road, Kuthambakkam,</div>
              <div className="text-white/95">Chennai, Tamil Nadu - 600124</div>
            </div>
          </div>

          {/* Right Column - Social Media & Contact */}
          <div className="flex-1 md:text-right">
            {/* Social Media Icons */}
            <div className="flex md:justify-end items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <a
                href="https://www.facebook.com/ritchennai"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2 sm:p-2.5 text-white hover:text-white hover:border-white/40 active:bg-white/10 transition-colors touch-manipulation"
                aria-label="Facebook"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M14 8.5h2V5.75A18 18 0 0 0 13.6 5.6c-2.4 0-4.1 1.46-4.1 4.15V12H7v3h2.5v6h3.1v-6h2.8l.5-3h-3.3V10c0-1 .33-1.5 1.4-1.5Z" fill="currentColor"/>
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2 sm:p-2.5 text-white hover:text-white hover:border-white/40 active:bg-white/10 transition-colors touch-manipulation"
                aria-label="Instagram"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9A4.75 4.75 0 0 1 16.5 21.25h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M17.25 6.75h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2 sm:p-2.5 text-white hover:text-white hover:border-white/40 active:bg-white/10 transition-colors touch-manipulation"
                aria-label="YouTube"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.266.978.842 1.74 1.766 1.778 1.582.43 7.831.437 7.831.437s6.265.007 7.831-.403a2.515 2.515 0 0 0 1.767-1.776c.415-1.563.417-4.812.417-4.812s.002-3.265-.415-4.831zM9.996 15.005l-.005-6 5.207 3.005-5.202 2.995z" fill="currentColor"/>
                </svg>
              </a>
            </div>

            {/* Email and Phone */}
            <div className="space-y-1 text-xs sm:text-sm md:text-base text-white/70">
              <div>yatra@ritchennai.edu.in</div>
              <div>
                <a href="tel:+919843656238" className="hover:text-white transition-colors">+91 98436 56238</a>
              </div>
              <div>
                <a href="tel:+919080850106" className="hover:text-white transition-colors">+91 90808 50106</a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright - Bottom Left */}
        <div className="border-t border-white/10 pt-4 sm:pt-5 sm:pt-6">
          <div className="text-[10px] sm:text-xs text-white/40">
            © {new Date().getFullYear()} YATRA'26
          </div>
        </div>
      </div>
    </footer>

    {/* Lineup Teaser Modal */}
    {lineupModalState !== 'closed' && (
      <div
        className={`lineup-modal-overlay ${lineupModalState === 'open' ? 'is-open' : 'is-closing'}`}
        onMouseDown={closeLineupModal}
        role="presentation"
      >
        <div className="lineup-modal" role="dialog" aria-modal="true" aria-labelledby="lineup-modal-title" onMouseDown={(e) => e.stopPropagation()}>
          <button className="lineup-modal-close" type="button" onClick={closeLineupModal} aria-label="Close popup">
            ×
          </button>

          <div className="lineup-modal-top" aria-hidden="true">
            <span className="lineup-modal-chip">LINEUP</span>
            <span className="lineup-modal-chip lineup-modal-chip--accent">COMING SOON</span>
          </div>

          <div className="lineup-modal-sparks" aria-hidden="true">
            {lineupSparks.map((p) => (
              <span
                key={p.id}
                className="lineup-spark"
                style={{
                  '--x': `${p.x}%`,
                  '--y': `${p.y}%`,
                  '--d': `${p.d}s`,
                  '--t': `${p.t}s`,
                  '--s': `${p.s}px`,
                }}
              />
            ))}
          </div>

          <h3 id="lineup-modal-title" className="lineup-modal-title">
            <GlitchText
              koreanText="곧 공개됩니다"
              englishText="WILL BE REVEALED SOON"
              className="lineup-modal-title-text"
              delay={0}
              shouldStart={lineupModalState === 'open'}
              variant="glitch"
            />
          </h3>

          <p className="lineup-modal-subtitle">
            The stage is getting set. The reveal drop is going to be wild — keep your eyes on YATRA.
          </p>

          <div className="lineup-modal-stamp" aria-hidden="true">
            <span className="lineup-modal-stamp-ring" />
            <span className="lineup-modal-stamp-text">REVEAL</span>
          </div>

          <div className="lineup-modal-actions">
            <button className="lineup-modal-cta" type="button" onClick={closeLineupModal}>
              OK, I’LL WAIT
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default Hero
