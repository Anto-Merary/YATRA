import './Hero.css'
import '../../styles/mobile-footer.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import heroBg from '../assets/optimized/herobg-w1280.webp'
import heroBgLq from '../assets/optimized/herobg-lq.webp'
import heroBgPoster from '../assets/optimized/herobg-w640.webp'
import yatraText from '../assets/optimized/yatratxt-w1536.webp'
import yatraTicketLogo from '../../assets/LOGO .webp'
import torriGate from '../assets/optimized/torrigate-w1280.webp'
import yearText from '../assets/optimized/2026txt-w1536.webp'
import videoSrc from '../assets/video.mp4'
import eventImage from '../assets/optimized/event-w1024.webp'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useDeviceCapability, getAnimationConfig } from '../hooks/useDeviceCapability'

// Lineup card assets live in public/ for mobile + desktop reuse.
const gvBackCard = '/gvbackcard (1).webp'
const gvFrontCard = '/gvfrontcard.webp'
const aooraFrontCard = '/aoorafrontcard.webp'
const pradeepFrontCard = '/pradeepkumarfrontcard.webp'

function GlitchText({ koreanText, englishText, className, delay = 0, shouldStart = false, variant = 'glitch' }) {
  const [isGlitching, setIsGlitching] = useState(false)
  // If there's no Korean text, render English immediately so layout doesn't collapse.
  const [showEnglish, setShowEnglish] = useState(() => !koreanText)

  useEffect(() => {
    let glitchTimer = 0
    let transitionTimer = 0

    // When the section leaves view, reset so the effect can replay next time.
    if (!shouldStart) {
      setIsGlitching(false)
      setShowEnglish(!koreanText)
      return () => {
        if (glitchTimer) clearTimeout(glitchTimer)
        if (transitionTimer) clearTimeout(transitionTimer)
      }
    }

    // No Korean line = nothing to crossfade from; keep English visible and in-flow.
    if (!koreanText) {
      setIsGlitching(false)
      setShowEnglish(true)
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
  }, [delay, shouldStart, variant, koreanText])

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

/**
 * Optimized DecryptText component - uses DOM refs instead of React state
 * to avoid triggering React re-renders during the scramble animation.
 * 
 * Performance optimizations:
 * 1. Direct DOM manipulation via ref (no React reconciliation)
 * 2. requestAnimationFrame for smoother frame scheduling
 * 3. Skip animation entirely on low-end devices (skipAnimation prop)
 * 4. Cleanup on unmount/visibility change
 */
function DecryptText({
  koreanText,
  englishText,
  className,
  delay = 0,
  shouldStart = false,
  frameInterval = 32,
  skipAnimation = false
}) {
  const textRef = useRef(null)
  const animationRef = useRef({ timeoutId: 0, rafId: 0, isRunning: false })

  // Initial text (shown before animation starts)
  const initialText = koreanText || englishText || ''
  const finalText = englishText || ''

  useEffect(() => {
    const anim = animationRef.current
    const el = textRef.current

    // Cleanup function
    const cleanup = () => {
      if (anim.timeoutId) window.clearTimeout(anim.timeoutId)
      if (anim.rafId) window.cancelAnimationFrame(anim.rafId)
      anim.isRunning = false
    }

    // Reset to initial text when animation stops
    if (!shouldStart) {
      if (el) el.textContent = koreanText || ''
      cleanup()
      return cleanup
    }

    // Skip animation on low-end devices - show final text immediately with no scramble
    if (skipAnimation) {
      anim.timeoutId = window.setTimeout(() => {
        if (el) el.textContent = finalText
      }, delay)
      return cleanup
    }

    // Start the decrypt animation after delay
    anim.timeoutId = window.setTimeout(() => {
      if (!el) return

      const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const glyphsLength = glyphs.length
      let frame = 0
      // Adaptive frame skip: faster interval = more frames to skip for same visual speed
      const frameSkip = frameInterval > 40 ? 1 : 2
      const textLength = finalText.length

      anim.isRunning = true
      let lastTime = performance.now()

      // Use requestAnimationFrame with timing control for smoother animation
      const tick = (currentTime) => {
        if (!anim.isRunning || !el) return

        // Throttle based on frameInterval
        const elapsed = currentTime - lastTime
        if (elapsed < frameInterval) {
          anim.rafId = window.requestAnimationFrame(tick)
          return
        }
        lastTime = currentTime

        frame += 1
        const revealCount = Math.min(textLength, Math.floor(frame / frameSkip))

        // Build scrambled text - optimized string building
        let result = ''
        for (let i = 0; i < textLength; i++) {
          const char = finalText[i]
          if (char === ' ') {
            result += ' '
          } else if (i < revealCount) {
            result += char
          } else {
            result += glyphs[(Math.random() * glyphsLength) | 0]
          }
        }

        // Direct DOM update - no React re-render
        el.textContent = result

        // Check if animation is complete
        if (revealCount >= textLength) {
          el.textContent = finalText
          anim.isRunning = false
          return
        }

        anim.rafId = window.requestAnimationFrame(tick)
      }

      anim.rafId = window.requestAnimationFrame(tick)
    }, delay)

    return cleanup
  }, [delay, finalText, koreanText, shouldStart, frameInterval, skipAnimation])

  return <span ref={textRef} className={className}>{initialText}</span>
}

function Hero() {
  // Device capability detection for adaptive animations
  const deviceCapability = useDeviceCapability()
  const animConfig = useMemo(() => getAnimationConfig(deviceCapability.tier), [deviceCapability.tier])

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
  const aboutRef = useRef(null)
  const aboutTitleRef = useRef(null)
  const aboutContentRef = useRef(null)
  const featuresSectionRef = useRef(null)
  const blastSectionRef = useRef(null)
  const passesSectionRef = useRef(null)
  const featuresImageRef = useRef(null)
  const blastCollageRef = useRef(null)
  const blastPhotoElsRef = useRef([])
  const hasAboutEnteredRef = useRef(false)
  const hasFeaturesEnteredRef = useRef(false)
  const hasBlastEnteredRef = useRef(false)
  const [isFeaturesSectionVisible, setIsFeaturesSectionVisible] = useState(false)
  const [isBlastSectionVisible, setIsBlastSectionVisible] = useState(false)
  const [blastShouldEagerLoad, setBlastShouldEagerLoad] = useState(false)
  const [shimmerTrigger, setShimmerTrigger] = useState(0)
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [shouldShowVideoVisual, setShouldShowVideoVisual] = useState(false)
  const videoContainerRef = useRef(null)
  const videoRef = useRef(null)
  const preloadVideoRef = useRef(null)

  const isExperienceReady = isVideoReady || videoError

  // Network status detection
  const { shouldLoadVideo: networkShouldLoad, isSlowConnection } = useNetworkStatus()

  // Set body class for CSS-based optimizations on low-end devices
  useEffect(() => {
    if (deviceCapability.isLowEnd) {
      document.body.classList.add('low-end-device')
    } else {
      document.body.classList.remove('low-end-device')
    }
    return () => {
      document.body.classList.remove('low-end-device')
    }
  }, [deviceCapability.isLowEnd])

  // Lineup teaser modal (catchy reveal-soon popup)
  const [lineupModalState, setLineupModalState] = useState('closed') // 'closed' | 'open' | 'closing'
  const isLineupModalOpen = lineupModalState !== 'closed'

  // LINEUP flip card (tap to reveal)
  const [isGvCardFlipped, setIsGvCardFlipped] = useState(false)
  const toggleGvCard = useCallback(() => {
    setIsGvCardFlipped((v) => !v)
  }, [])

  const [isAooraCardFlipped, setIsAooraCardFlipped] = useState(false)
  const toggleAooraCard = useCallback(() => {
    setIsAooraCardFlipped((v) => !v)
  }, [])

  const [isPradeepCardFlipped, setIsPradeepCardFlipped] = useState(false)
  const togglePradeepCard = useCallback(() => {
    setIsPradeepCardFlipped((v) => !v)
  }, [])

  // LINEUP carousel (character-select style)
  const lineupCarouselRef = useRef(null)
  const [activeLineupIndex, setActiveLineupIndex] = useState(0)
  const swipeStartRef = useRef({ x: 0, y: 0, time: 0 })

  const scrollLineup = useCallback((dir) => {
    const el = lineupCarouselRef.current
    if (!el) return
    const amount = Math.round(el.clientWidth * 0.8)
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }, [])

  const lineupCards = useMemo(
    () => [
      { id: 'gv', status: 'revealed' },
      { id: 'aoora', status: 'revealed' },
      { id: 'pradeep', status: 'revealed' },
      { id: 'countdown-48hr', status: 'countdown' },
    ],
    []
  )

  // 24-hour countdown card (same vibe as desktop): counts down from first mount.
  const countdownStartRef = useRef(0)
  const [countdownNow, setCountdownNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isExperienceReady) return
    if (!countdownStartRef.current) countdownStartRef.current = Date.now()
    const t = window.setInterval(() => setCountdownNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [isExperienceReady])

  const countdownText48hr = useMemo(() => {
    const start = countdownStartRef.current || Date.now()
    const target = start + 48 * 60 * 60 * 1000 // 48 hours countdown
    const distance = Math.max(0, target - countdownNow)
    const totalHours = Math.floor(distance / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)
    return (
      String(totalHours).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0') +
      ':' +
      String(seconds).padStart(2, '0')
    )
  }, [countdownNow])

  // Ticket registration countdown timer
  const [ticketCountdownNow, setTicketCountdownNow] = useState(() => Date.now())

  useEffect(() => {
    if (!isExperienceReady) return
    const t = window.setInterval(() => setTicketCountdownNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [isExperienceReady])

  // Set target date for registration opening (adjust this to your actual registration start date)
  // Example: February 1, 2026 at 10:00 AM IST
  const registrationTargetDate = useMemo(() => {
    // You can adjust this date to when registration actually opens
    return new Date('2026-02-01T10:00:00+05:30').getTime()
  }, [])

  const ticketCountdownText = useMemo(() => {
    const distance = Math.max(0, registrationTargetDate - ticketCountdownNow)
    // Calculate total hours (including days converted to hours)
    const totalHours = Math.floor(distance / (1000 * 60 * 60))
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    // Format as HH:MM:SS (total hours can exceed 24)
    return `${String(totalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [ticketCountdownNow, registrationTargetDate])

  const isRegistrationOpen = useMemo(() => {
    return ticketCountdownNow >= registrationTargetDate
  }, [ticketCountdownNow, registrationTargetDate])

  // Track which lineup card is centered in the carousel (character-select style).
  // Optimized: reduced frequency of updates and better throttling
  useEffect(() => {
    if (!isExperienceReady) return

    const el = lineupCarouselRef.current
    if (!el) return

    let raf = 0
    let ticking = false
    let isScrolling = false
    let scrollTimeout = null
    let lastUpdateTime = 0
    // Throttle updates more aggressively on low-end devices
    const updateThrottle = deviceCapability.isLowEnd ? 100 : deviceCapability.isMidRange ? 50 : 16

    // Cache children to avoid repeated DOM queries
    let cachedChildren = null
    const getChildren = () => {
      if (!cachedChildren) {
        cachedChildren = Array.from(el.querySelectorAll('.lineup-card-slot'))
      }
      return cachedChildren
    }

    const update = () => {
      ticking = false

      // Skip if we updated too recently
      const now = performance.now()
      if (now - lastUpdateTime < updateThrottle) return
      lastUpdateTime = now

      const children = getChildren()
      if (children.length === 0) return

      const r = el.getBoundingClientRect()
      const centerX = r.left + r.width / 2
      let bestIdx = 0
      let bestDist = Number.POSITIVE_INFINITY

      children.forEach((child, idx) => {
        const cr = child.getBoundingClientRect()
        const cCenter = cr.left + cr.width / 2
        const d = Math.abs(cCenter - centerX)
        if (d < bestDist) {
          bestDist = d
          bestIdx = idx
        }
      })

      setActiveLineupIndex((prev) => {
        if (prev !== bestIdx) return bestIdx
        return prev
      })
    }

    const onScroll = () => {
      isScrolling = true
      // Clear any pending timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      // Set timeout to mark scrolling as ended
      scrollTimeout = setTimeout(() => {
        isScrolling = false
        // Final update when scroll ends
        update()
      }, 150)

      if (!ticking) {
        ticking = true
        raf = window.requestAnimationFrame(update)
      }
    }

    const onResize = () => {
      // Invalidate cache on resize
      cachedChildren = null
      if (!ticking) {
        ticking = true
        raf = window.requestAnimationFrame(update)
      }
    }

    // Wait a bit to ensure DOM is ready, then set up listeners
    let intervalId = null
    const initTimer = window.setTimeout(() => {
      el.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onResize, { passive: true })
      // Initial update
      update()
      // Only run periodic check when not actively scrolling
      // Longer interval on low-end devices
      const checkInterval = deviceCapability.isLowEnd ? 600 : 400
      intervalId = window.setInterval(() => {
        if (!isScrolling) {
          update()
        }
      }, checkInterval)
    }, 100)

    return () => {
      window.clearTimeout(initTimer)
      if (scrollTimeout) clearTimeout(scrollTimeout)
      if (intervalId) window.clearInterval(intervalId)
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [isExperienceReady, deviceCapability.isLowEnd, deviceCapability.isMidRange])

  // Swipe gesture detection for carousel navigation
  useEffect(() => {
    if (!isExperienceReady) return

    const el = lineupCarouselRef.current
    if (!el) return

    const handleTouchStart = (e) => {
      const touch = e.touches[0]
      swipeStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
    }

    const handleTouchEnd = (e) => {
      if (!swipeStartRef.current.x) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - swipeStartRef.current.x
      const deltaY = touch.clientY - swipeStartRef.current.y
      const deltaTime = Date.now() - swipeStartRef.current.time

      // Minimum swipe distance (40px) and maximum time (300ms) for a valid swipe
      const minSwipeDistance = 40
      const maxSwipeTime = 300

      // Check if horizontal swipe is dominant and fast enough
      if (Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > minSwipeDistance &&
        deltaTime < maxSwipeTime) {
        // Swipe left (positive deltaX) = scroll right (next card)
        // Swipe right (negative deltaX) = scroll left (previous card)
        scrollLineup(deltaX > 0 ? 1 : -1)
      }

      // Reset
      swipeStartRef.current = { x: 0, y: 0, time: 0 }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isExperienceReady, scrollLineup])

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

  const allBlastImages = useMemo(() => {
    // Use only webp images for better performance and consistency
    const modules = import.meta.glob('../assets/gal/*.{webp,WEBP}', {
      eager: true,
      import: 'default',
    })

    /**
     * Keep the *same* visual order you had before (dev matched prod sometimes by accident),
     * but make it production-stable:
     * - Previously we sorted by the generated URL string, which changes in prod due to hashing.
     * - Now we sort by the original module key (path), which is stable in both dev and prod.
     */
    const orderedKeys = Object.keys(modules).sort((a, b) => a.localeCompare(b))

    // Get unique images by base filename to avoid any duplicates (preserve orderedKeys order)
    const uniqueImages = new Map()
    orderedKeys.forEach((key) => {
      const baseName = key.split('/').pop()?.replace(/\.(webp|WEBP)$/i, '').toLowerCase()
      if (baseName && !uniqueImages.has(baseName)) {
        uniqueImages.set(baseName, modules[key])
      }
    })

    return Array.from(uniqueImages.values())
  }, [])

  const blastImages = useMemo(() => allBlastImages, [allBlastImages])

  useEffect(() => {
    blastPhotoElsRef.current = []
  }, [blastImages.length])

  // Lantern (lamp) glow hotspots placed over the background art.
  // These are NOT visible UI elements—just an overlay to make each lamp "bloom" randomly.
  // Optimized: reduce lamp count on low-end devices
  const lamps = useMemo(
    () => {
      const allLamps = [
        { id: 'lamp-0', x: 4.5, y: 18.2 },
        { id: 'lamp-1', x: 16.0, y: 20.1 },
        { id: 'lamp-2', x: 30.2, y: 19.4 },
        { id: 'lamp-3', x: 44.2, y: 20.0 },
        { id: 'lamp-4', x: 58.0, y: 20.1 },
        { id: 'lamp-5', x: 71.6, y: 20.4 },
        { id: 'lamp-6', x: 85.0, y: 20.0 },
        { id: 'lamp-7', x: 96.0, y: 18.6 },
      ]
      // Return fewer lamps on low-end devices (or none if lamp glow is disabled)
      if (!animConfig.enableLampGlow) return []
      return allLamps.slice(0, animConfig.lampCount)
    },
    [animConfig.enableLampGlow, animConfig.lampCount]
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
    // Keep first paint smooth: don't start entrance until hero video is ready to play.
    if (!isVideoReady && !videoError) return

    // Start entrance once critical hero assets are ready,
    // but never wait too long on slow networks.
    if (isHeroReady) {
      const t = window.setTimeout(() => setHasLoaded(true), 60)
      return () => window.clearTimeout(t)
    }

    const fallback = window.setTimeout(() => setHasLoaded(true), 1200)
    return () => window.clearTimeout(fallback)
  }, [hasLoaded, isHeroReady, isVideoReady, videoError])

  // After the entrance animation finishes, enable the scroll-based "settle" transforms.
  useEffect(() => {
    if (!hasLoaded) return
    if (!isVideoReady && !videoError) return
    const t = window.setTimeout(() => setIsScrollReady(true), 1200)
    return () => window.clearTimeout(t)
  }, [hasLoaded, isVideoReady, videoError])

  // First impression: aggressively preload the hero MP4 and block the rest of the page
  // until the video is ready to play (so users never see a half-loaded hero).
  useEffect(() => {
    // Always start fetching ASAP (even on slow networks) so the hero is consistent.
    setShouldLoadVideo(true)

    // Hint the browser to prioritize the MP4 request. Using the imported `videoSrc`
    // ensures this works for both dev and production (hashed) builds.
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'video'
    link.href = videoSrc
    link.type = 'video/mp4'
    document.head.appendChild(link)

    // Kick off loading as soon as the preload video element mounts.
    const t = window.setTimeout(() => {
      const el = preloadVideoRef.current
      if (el) {
        try {
          el.load()
        } catch {
          // ignore
        }
      }
    }, 0)

    // Fallback: if the video never becomes playable, unblock after a bit so the site doesn't look "stuck".
    const fallback = window.setTimeout(() => {
      setVideoError(true)
      setIsVideoReady(true)
    }, 15000)

    return () => {
      window.clearTimeout(t)
      window.clearTimeout(fallback)
      if (link.parentNode) link.parentNode.removeChild(link)
    }
  }, [])

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

  // About section: reveal when it enters view (ScrollTrigger = reliable with Lenis + dynamic layout).
  useEffect(() => {
    if (!isExperienceReady) return
    const sectionEl = aboutRef.current
    if (!sectionEl) return

    gsap.registerPlugin(ScrollTrigger)

    const st = ScrollTrigger.create({
      id: 'about-reveal',
      trigger: sectionEl,
      start: 'top 72%',
      once: true,
      onEnter: () => {
        hasAboutEnteredRef.current = true
        runAboutReveal()
      },
    })

    // In case we're already past the trigger point when the page mounts (e.g., restore scroll),
    // force an update so `onEnter` can fire appropriately.
    st.refresh()
    st.update()

    return () => {
      st.kill()
    }
  }, [isExperienceReady, runAboutReveal])

  const goToEvents = useCallback(() => {
    const baseUrl = (import.meta?.env?.BASE_URL || '/').replace(/\/+$/, '')
    window.location.assign(`${baseUrl}/events`)
  }, [])

  const goToPasses = useCallback((e) => {
    if (e?.preventDefault) e.preventDefault()
    const el = passesSectionRef.current || document.getElementById('buy-passes')
    if (!el) return
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      // Safari fallback
      el.scrollIntoView()
    }
  }, [])

  // Features section: trigger glitch animation once when section enters view
  useEffect(() => {
    if (!isExperienceReady) return
    const sectionEl = featuresSectionRef.current
    if (!sectionEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const ratio = entry.intersectionRatio || 0
        if (hasFeaturesEnteredRef.current) return
        if (ratio >= 0.2) {
          hasFeaturesEnteredRef.current = true
          setIsFeaturesSectionVisible(true)
          observer.disconnect()
        }
      },
      { threshold: [0, 0.05, 0.2], rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(sectionEl)
    return () => {
      observer.disconnect()
    }
  }, [isExperienceReady])

  // Features image: parallax slide-in on scroll
  // Optimized: uses adaptive scrub and can be disabled on low-end devices
  useEffect(() => {
    if (!isExperienceReady) return
    // Skip parallax on low-end devices
    if (!animConfig.parallax) return

    const sectionEl = featuresSectionRef.current
    const imageEl = featuresImageRef.current
    if (!sectionEl || !imageEl) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageEl,
        { x: 70, y: 40, rotate: -1, scale: 0.96, opacity: 0 },
        {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top 80%',
            end: 'bottom 35%',
            scrub: animConfig.scrub,
            fastScrollEnd: true,
          },
        }
      )
    }, sectionEl)

    return () => {
      ctx.revert()
    }
  }, [isExperienceReady, animConfig.parallax, animConfig.scrub])

  // BLAST INTO PAST section: trigger blur crossfade once when section enters view
  useEffect(() => {
    if (!isExperienceReady) return
    const sectionEl = blastSectionRef.current
    if (!sectionEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        const ratio = entry.intersectionRatio || 0
        if (hasBlastEnteredRef.current) return
        if (ratio >= 0.2) {
          hasBlastEnteredRef.current = true
          setIsBlastSectionVisible(true)
          observer.disconnect()
        }
      },
      { threshold: [0, 0.05, 0.2], rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(sectionEl)
    return () => {
      observer.disconnect()
    }
  }, [isExperienceReady])

  // BLAST collage: start loading images *before* the section is visible so the last
  // photos don't pop in late when users scroll slowly.
  useEffect(() => {
    if (!isExperienceReady) return
    const sectionEl = blastSectionRef.current
    if (!sectionEl) return

    if (blastShouldEagerLoad) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setBlastShouldEagerLoad(true)
        observer.disconnect()
      },
      // Preload early: when the section is still far below the viewport.
      { rootMargin: '900px 0px 900px 0px', threshold: 0.01 }
    )

    observer.observe(sectionEl)
    return () => observer.disconnect()
  }, [isExperienceReady, blastShouldEagerLoad])

  useEffect(() => {
    if (!blastShouldEagerLoad) return
    // Preload all collage images (browser cache will handle duplicates).
    blastImages.forEach((src) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = src
    })
  }, [blastShouldEagerLoad, blastImages])

  // BLAST collage: no sticky/pin — simple cinematic entrance.
  useEffect(() => {
    if (!isExperienceReady) return
    const sectionEl = blastSectionRef.current
    const collageEl = blastCollageRef.current
    if (!sectionEl || !collageEl) return

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Treat low-end devices as "reduced motion" to show final layout immediately
    const shouldReduce = reduceMotion || deviceCapability.isLowEnd

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
      // Keep photos strictly inside the collage box across many screen sizes.
      // Smaller spread prevents bottom photos from overflowing into the next section.
      // Slightly wider fan-out (requested): still constrained by the collage overflow.
      const spreadX = s * 0.38
      // More vertical spread so bottom photos use the available space and feel "revealed"
      // as users scroll down.
      const spreadY = Math.min(h * 0.52, s * 0.78)

      const hash = (str) => {
        // Simple deterministic hash (djb2-ish)
        let h = 5381
        for (let i = 0; i < str.length; i++) {
          h = ((h << 5) + h) ^ str.charCodeAt(i)
        }
        return h >>> 0
      }
      const rand01 = (seed) => {
        // xorshift32 -> [0,1)
        let x = seed >>> 0
        x ^= x << 13
        x ^= x >>> 17
        x ^= x << 5
        return ((x >>> 0) % 10000) / 10000
      }

      const baseFinal = [
        { x: -spreadX * 0.85, y: -spreadY * 0.14 },
        // Top-center ("syn") photo: bring it down a bit so it never hides under the title
        { x: 0, y: -spreadY * 0.48 },
        { x: spreadX * 0.85, y: -spreadY * 0.08 },
        { x: spreadX * 0.55, y: spreadY * 0.92 },
        { x: -spreadX * 0.55, y: spreadY * 1.06 },
        { x: -spreadX * 0.95, y: spreadY * 0.48 },
      ]
      // Add a small deterministic jitter so it looks randomly stacked but stays stable.
      const finalPositions = baseFinal.slice(0, count).map((p, i) => {
        const src = String(blastImages[i] || '')
        const seed = hash(`${src}:${i}`)
        const jx = (rand01(seed) - 0.5) * spreadX * 0.16
        const jy = (rand01(seed ^ 0x9e3779b9) - 0.5) * spreadY * 0.14
        // Small manual nudges for specific photos (requested):
        // - asal: move up a little
        // - pal: move up 8% (from 5% → 8%)
        // NOTE: Use [-\.] to match both dev (pal.webp) and prod (pal-hash.webp) URLs
        const isAsal = /(^|\/|\\)asal[-\.]/i.test(src)
        const isPal = /(^|\/|\\)pal[-\.]/i.test(src)
        // Stronger upward nudges so they sit higher along their rotated angle.
        const nudgeAsal = -Math.min(32, spreadY * 0.11)
        const nudgePal = -Math.min(70, spreadY * 0.33) // pal moved up (was 0.25, now 0.33)
        const nudgeY = isPal ? nudgePal : isAsal ? nudgeAsal : 0

        return { x: p.x + jx, y: p.y + jy + nudgeY }
      })

      const baseDirs = [
        { x: -1, y: -0.15 },
        { x: 1, y: -0.25 },
        { x: 1, y: 0.2 },
        { x: 0.75, y: 0.9 },
        { x: -0.6, y: 1 },
        { x: -1, y: 0.55 },
      ]
      const startDirs = baseDirs.slice(0, count)
      const amp = s * 0.8

      const startPositions = finalPositions.map((p, i) => ({
        x: p.x + (startDirs[i]?.x ?? 0) * amp,
        y: p.y + (startDirs[i]?.y ?? 0) * amp,
      }))

      // Gentle rotations (deterministic) so it looks natural but stable.
      const rotations = [-6, 5, -3, 7, -4, 6].slice(0, count).map((r, i) => {
        const src = String(blastImages[i] || '')
        const seed = hash(`${src}:rot:${i}`)
        const jr = (rand01(seed) - 0.5) * 6 // +/-3deg
        return r + jr
      })

      return { finalPositions, startPositions, rotations }
    }

    const build = () => {
      if (tl) tl.kill()
      if (st) st.kill()
      tl = null
      st = null

      const { finalPositions, startPositions, rotations } = computePositions()
      const getSrc = (el) => String(el?.currentSrc || el?.src || '')
      const getBaseScale = (src) => {
        const isPal = /(^|\/|\\)pal[-\.]/i.test(src)
        const isSyn = /(^|\/|\\)syn[-\.]/i.test(src)
        return isPal ? 3.3075 : isSyn ? 2.0475 : 1.35
      }
      const getReducedScale = (src) => {
        const isPal = /(^|\/|\\)pal[-\.]/i.test(src)
        const isSyn = /(^|\/|\\)syn[-\.]/i.test(src)
        return isPal ? 1.9425 : isSyn ? 1.575 : 1
      }
      const getFinalScale = (src) => {
        const isPal = /(^|\/|\\)pal[-\.]/i.test(src)
        const isSyn = /(^|\/|\\)syn[-\.]/i.test(src)
        return isPal ? 1.9425 : isSyn ? 1.575 : 1
      }

      // Base state (bigger + offscreen, then ease into final positions on scroll)
      els.forEach((el, i) => {
        const start = startPositions[i] || { x: 0, y: 0 }
        const src = getSrc(el)

        gsap.set(el, {
          // Center using GSAP-managed percent transforms so CSS centering isn't lost
          // when GSAP updates `transform` (prevents images "dropping" to the bottom).
          xPercent: -50,
          yPercent: -50,
          x: start.x,
          y: start.y,
          scale: getBaseScale(src),
          opacity: 0,
          rotate: rotations[i] ?? 0,
          transformOrigin: '50% 50%',
          zIndex: 10 + i,
          force3D: true,
        })
      })

      if (shouldReduce) {
        els.forEach((el, i) => {
          const base = finalPositions[i] || { x: 0, y: 0 }
          const src = getSrc(el)
          gsap.set(el, {
            xPercent: -50,
            yPercent: -50,
            x: base.x,
            y: base.y,
            scale: getReducedScale(src),
            opacity: 1,
            rotate: 0,
          })
        })
        return
      }

      gsap.registerPlugin(ScrollTrigger)
      tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      })
      tl.pause(0)

      // Adaptive animation duration and stagger based on device capability
      const slowFactor = deviceCapability.isLowEnd ? 1.15 : deviceCapability.isMidRange ? 1.3 : 1.45
      const animDuration = animConfig.duration * slowFactor
      const animStagger = animConfig.stagger * slowFactor

      // Slower + slightly overlapping entrances (timeline length also controls scrub pacing)
      els.forEach((el, i) => {
        const base = finalPositions[i] || { x: 0, y: 0 }
        const src = getSrc(el)

        tl.to(
          el,
          {
            x: base.x,
            y: base.y,
            scale: getFinalScale(src),
            opacity: 1,
            rotate: 0,
            duration: animDuration,
          },
          i * animStagger
        )
      })

      // Tie reveal to scroll so photos don't all pop in early.
      // Adaptive scrub: higher value = smoother but less responsive (better for low-end)
      const blastScrub = animConfig.scrub * (deviceCapability.isLowEnd ? 1.2 : 1.5)
      st = ScrollTrigger.create({
        id: 'blast-collage',
        trigger: sectionEl,
        // Start later (user is actually in the section), and stretch the end so the
        // reveal stays progressive while they explore the whole block.
        start: 'top 70%',
        end: 'bottom 40%',
        scrub: blastScrub,
        animation: tl,
        invalidateOnRefresh: true,
        // Performance: don't update on every pixel
        fastScrollEnd: true,
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
  }, [
    isExperienceReady,
    blastImages.length,
    animConfig.duration,
    animConfig.stagger,
    animConfig.scrub,
    deviceCapability.isLowEnd,
    deviceCapability.isMidRange,
  ])


  // Scroll-based settle interaction - continuous and proportional to scroll distance,
  // but visually smoothed so it feels cinematic (no jitter/snapping).
  // Progress is 0 at top of hero, 1 when hero has fully scrolled out of view.
  // Optimized: uses throttling and adaptive smoothing based on device capability
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
    let lastScrollTime = 0
    // Throttle scroll handler on low-end devices
    const scrollThrottle = deviceCapability.isLowEnd ? 32 : 16

    const update = (ts = performance.now()) => {
      raf = 0
      const dt = Math.min(50, ts - (lastTs || ts))
      lastTs = ts

      // Adaptive smoothing: lower alpha = smoother but slower response
      // Low-end devices get smoother (less frequent updates)
      const baseSmoothing = deviceCapability.isLowEnd ? 0.92 : deviceCapability.isMidRange ? 0.88 : 0.85
      const alpha = 1 - Math.pow(baseSmoothing, dt / 16.67)
      current = current + (target - current) * alpha

      el.style.setProperty('--settle', current.toFixed(4))

      // Keep animating until we're very close to target
      const diff = Math.abs(target - current)
      // Larger threshold on low-end devices to stop animation sooner
      const threshold = deviceCapability.isLowEnd ? 0.001 : 0.0001
      if (diff > threshold) {
        raf = window.requestAnimationFrame(update)
        isAnimating = true
      } else {
        current = target
        el.style.setProperty('--settle', current.toFixed(4))
        isAnimating = false
      }
    }

    const onScroll = () => {
      // Throttle scroll events on low-end devices
      const now = performance.now()
      if (now - lastScrollTime < scrollThrottle) return
      lastScrollTime = now

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
  }, [hasLoaded, deviceCapability.isLowEnd, deviceCapability.isMidRange])

  // Random lamp blooms (random order / random timing).
  // Optimized: runs less frequently on low-end devices, disabled entirely if no lamps
  useEffect(() => {
    if (!hasLoaded) return
    // Skip if lamp glow is disabled (low-end devices)
    if (!animConfig.enableLampGlow || lamps.length === 0) return

    let cancelled = false
    let timeoutId = 0

    const rand = (min, max) => min + Math.random() * (max - min)

    // Adaptive timing: slower on mid-range, much slower on low-end (if enabled)
    const minInterval = deviceCapability.isMidRange ? 500 : 300
    const maxInterval = deviceCapability.isMidRange ? 1800 : 1200

    const schedule = () => {
      if (cancelled) return

      // Next bloom with adaptive timing
      const nextIn = Math.round(rand(minInterval, maxInterval))
      timeoutId = window.setTimeout(() => {
        if (cancelled) return

        // Bloom only 1 lamp at a time on mid-range devices
        const bloomCount = deviceCapability.isMidRange ? 1 : (Math.random() < 0.4 ? 2 : 1)
        const picked = new Set()
        while (picked.size < bloomCount && picked.size < lamps.length) {
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
  }, [hasLoaded, lamps, animConfig.enableLampGlow, deviceCapability.isMidRange])

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

        // Trigger shimmer by updating state - incrementing forces animation restart
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

  // Force animation restart by toggling class when shimmerTrigger changes
  const buyTicketsButtonRef = useRef(null)
  useEffect(() => {
    if (shimmerTrigger === 0) return

    const button = buyTicketsButtonRef.current
    if (!button) return

    // Remove class to reset animation
    button.classList.remove('shimmer-active')

    // Force reflow to ensure class removal is processed
    void button.offsetWidth

    // Re-add class to trigger animation
    requestAnimationFrame(() => {
      button.classList.add('shimmer-active')
    })
  }, [shimmerTrigger])

  // Once the gate is gone and the full layout mounts, refresh ScrollTrigger so start/end
  // positions are computed against the final DOM (prevents “already revealed” animations).
  useEffect(() => {
    if (!isExperienceReady) return
    gsap.registerPlugin(ScrollTrigger)
    const t = window.setTimeout(() => {
      try {
        ScrollTrigger.refresh()
      } catch {
        // ignore
      }
    }, 0)
    return () => window.clearTimeout(t)
  }, [isExperienceReady])

  // While the gate is shown, prevent scrolling so the user doesn't land on a half-revealed section.
  useEffect(() => {
    if (isExperienceReady) return
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
    }
  }, [isExperienceReady])

  return (
    <>
      {!isExperienceReady && (
        <>
          <div
            className="hero-gate"
            role="status"
            aria-live="polite"
            aria-label="Loading the YATRA experience"
            style={{ backgroundImage: `url(${heroBgPoster})` }}
          >
            <div className="hero-gate-scrim" aria-hidden="true" />
            <div className="hero-gate-inner">
              <div className="hero-gate-title">YATRA&apos;26</div>
              <div className="hero-gate-subtitle">Preparing the experience…</div>
              <div className="hero-gate-spinner" aria-hidden="true" />
            </div>
          </div>

          {/* Preload the MP4 while the gate is visible (keeps the heavy hero UI unmounted). */}
          {shouldLoadVideo && (
            <video
              ref={preloadVideoRef}
              className="hero-preload-video"
              muted
              playsInline
              preload="auto"
              onLoadedData={() => {
                if (!isVideoReady) setIsVideoReady(true)
              }}
              onCanPlay={() => {
                if (!isVideoReady) setIsVideoReady(true)
              }}
              onCanPlayThrough={() => {
                if (!isVideoReady) setIsVideoReady(true)
              }}
              onError={() => {
                setVideoError(true)
                setIsVideoReady(true)
              }}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          )}
        </>
      )}

      {isExperienceReady && (
        <section
          className={`hero ${hasLoaded ? 'is-loaded' : ''}`}
          ref={heroRef}
        >
          {/* Full-bleed background (blurred) so the stage can keep a fixed aspect ratio */}
          <div className="hero-bleed-bg-wrapper">
            <img
              src={heroBg}
              alt=""
              aria-hidden="true"
              className="hero-bleed-bg"
              decoding="async"
              loading="eager"
              fetchpriority="high"
              {...img.bleedBg}
            />
          </div>

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
                fetchpriority="high"
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
                <>
                  <video
                    ref={videoRef}
                    className="hero-video"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster={heroBgPoster}
                    onLoadedData={() => {
                      if (!isVideoReady) setIsVideoReady(true)
                      // Try to start playback immediately (muted autoplay usually works on mobile).
                      if (videoRef.current) {
                        videoRef.current.play().catch(() => {
                          // Ignore autoplay errors (browser policies)
                        })
                      }
                    }}
                    onCanPlay={() => {
                      if (!isVideoReady) setIsVideoReady(true)
                      if (videoRef.current) {
                        videoRef.current.play().catch(() => {
                          // Ignore autoplay errors
                        })
                      }
                    }}
                    onPlaying={() => {
                      // Hide the poster overlay only once playback has actually started.
                      // This masks the "first few seconds low-FPS" look on weaker phones.
                      const el = videoRef.current
                      if (!el) return
                      const t0 = performance.now()
                      const poll = () => {
                        if (!videoRef.current) return
                        const elapsed = performance.now() - t0
                        if (videoRef.current.currentTime >= 0.25 || elapsed > 1500) {
                          setShouldShowVideoVisual(true)
                          return
                        }
                        window.requestAnimationFrame(poll)
                      }
                      poll()
                    }}
                    onError={() => {
                      setVideoError(true)
                      setIsVideoReady(true)
                    }}
                  >
                    <source src={videoSrc} type="video/mp4" />
                  </video>

                  <div
                    className={`hero-video-cover ${shouldShowVideoVisual ? 'is-hidden' : ''}`}
                    aria-hidden="true"
                  />
                </>
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
              <a
                ref={buyTicketsButtonRef}
                href="#buy-passes"
                onClick={goToPasses}
                className={`hero-button buy-tickets ${shimmerTrigger > 0 ? 'shimmer-active' : ''}`}
                data-shimmer-trigger={shimmerTrigger}
              >
                <span className="hero-button-shimmer" aria-hidden="true" />
                <span className="hero-button-text">BUY TICKETS</span>
                <span className="star-icon" aria-hidden="true">
                  ✦
                </span>
              </a>
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
      )}

      {isExperienceReady && (
        <>
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
                    YATRA 2026 is a grand intercollegiate cultural fest of Rajalakshmi Institutions, organized by the students with the support of the management, principal, and faculty. It stands as a vibrant platform that celebrates culture, creativity, and youthful energy.
                    <br /><br />
                    Rooted in cultural heritage and artistic expression, YATRA brings together students to showcase their talents through music, dance, art, and a wide range of cultural events. The fest aims to inspire confidence, encourage participation, and create a space where passion meets performance. With the presence of distinguished guests and an atmosphere filled with enthusiasm and celebration, YATRA 2026 promises an unforgettable cultural journey that unites tradition, talent, and togetherness.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* LINEUP Divider */}
          <div className="lineup-section-divider" aria-hidden="true">
            <div className="hero-divider-scroll">
              <div className="hero-divider-track">
                <div className="hero-divider-content">
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                </div>
                <div className="hero-divider-content" aria-hidden="true">
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">LINEUP</span>
                  <span className="hero-divider-star">✦</span>
                </div>
              </div>
            </div>
          </div>

          {/* LINEUP Section */}
          <section className="lineup-section" aria-label="Lineup section">
            <div className="lineup-container">
              <div className="lineup-kicker">Headliners</div>
              <h2 className="lineup-title">LINEUP</h2>
              <div className="lineup-divider" aria-hidden="true">
                <span className="lineup-divider-line" />
                <span className="lineup-divider-text">라인업</span>
                <span className="lineup-divider-line" />
              </div>
              <p className="lineup-subtitle">Experience. Big names live.</p>

              <div className="lineup-carousel-wrap">
                <button
                  type="button"
                  className="lineup-arrow-btn lineup-arrow-btn--left"
                  aria-label="Previous lineup card"
                  onClick={() => scrollLineup(-1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M15 5l-7 7 7 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div className="lineup-carousel" ref={lineupCarouselRef} aria-label="Lineup carousel">
                  {lineupCards.map((card, idx) => {
                    const isActive = idx === activeLineupIndex
                    const isRevealed = card.status === 'revealed'
                    const isCountdown = card.status === 'countdown'
                    const isLocked = card.status === 'locked'
                    const isGv = card.id === 'gv'
                    const isAoora = card.id === 'aoora'
                    const isPradeep = card.id === 'pradeep'
                    const isFlipped = isGv ? isGvCardFlipped : isAoora ? isAooraCardFlipped : isPradeep ? isPradeepCardFlipped : false
                    const toggleFlip = isGv ? toggleGvCard : isAoora ? toggleAooraCard : isPradeep ? togglePradeepCard : undefined
                    const frontImage = isGv ? gvFrontCard : isAoora ? aooraFrontCard : isPradeep ? pradeepFrontCard : null
                    const revealLabel = isGv ? 'GV Prakash' : isAoora ? 'Aoora' : isPradeep ? 'Pradeep Kumar' : 'Lineup artist'
                    const countdownParts = countdownText48hr.split(':')

                    return (
                      <div
                        key={card.id}
                        className={`lineup-card-slot ${isActive ? 'is-active' : ''} ${isLocked ? 'lineup-card-slot--locked' : ''}`}
                      >
                        {isRevealed && frontImage ? (
                          <button
                            type="button"
                            className={`lineup-flip-card ${isFlipped ? 'is-flipped' : ''}`}
                            onClick={toggleFlip}
                            aria-pressed={isFlipped}
                            aria-label={`${isFlipped ? 'Hide' : 'Reveal'} ${revealLabel}`}
                          >
                            <div className="lineup-flip-card-inner">
                              <div className="lineup-flip-card-face lineup-flip-card-face--back">
                                <img
                                  src={gvBackCard}
                                  alt="Lineup card back"
                                  className="lineup-flip-card-img"
                                />
                                {!isFlipped && (
                                  <span className="lineup-tap-to-reveal">Tap to reveal</span>
                                )}
                              </div>
                              <div className="lineup-flip-card-face lineup-flip-card-face--front">
                                <img
                                  src={frontImage}
                                  alt={revealLabel}
                                  className="lineup-flip-card-img"
                                />
                              </div>
                            </div>
                          </button>
                        ) : isCountdown ? (
                          <button
                            type="button"
                            className="lineup-flip-card"
                            onClick={openLineupModal}
                            aria-label="Reveal timer"
                          >
                            <div className="lineup-flip-card-inner">
                              <div className="lineup-flip-card-face lineup-flip-card-face--back">
                                <img
                                  src={gvBackCard}
                                  alt="Lineup card back"
                                  className="lineup-flip-card-img"
                                />
                                <div className="lineup-countdown-overlay">
                                  <div className="countdown-timer">
                                    {countdownParts.map((part, index) => (
                                      <span className="countdown-digit-group" key={`${card.id}-${index}`}>
                                        <span className="countdown-digit-box">{part}</span>
                                        {index < countdownParts.length - 1 && (
                                          <span className="countdown-colon">:</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="countdown-label">Reveal in</div>
                                </div>
                              </div>
                              <div className="lineup-flip-card-face lineup-flip-card-face--front">
                                <img
                                  src={gvBackCard}
                                  alt="Lineup card back"
                                  className="lineup-flip-card-img"
                                />
                              </div>
                            </div>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="lineup-flip-card"
                            onClick={openLineupModal}
                            aria-label="Locked lineup artist"
                          >
                            <div className="lineup-flip-card-inner">
                              <div className="lineup-flip-card-face lineup-flip-card-face--back">
                                <img
                                  src={gvBackCard}
                                  alt="Lineup card back"
                                  className="lineup-flip-card-img"
                                />
                                <div className="lineup-countdown-overlay">
                                  <svg className="lineup-locked-icon" viewBox="0 0 24 24" aria-hidden="true">
                                    <path
                                      d="M7 11V7a5 5 0 0110 0v4"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <rect
                                      x="5"
                                      y="11"
                                      width="14"
                                      height="10"
                                      rx="2"
                                      ry="2"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    />
                                  </svg>
                                  <div className="lineup-locked-text">Locked</div>
                                  <div className="countdown-label">Stay tuned</div>
                                </div>
                              </div>
                              <div className="lineup-flip-card-face lineup-flip-card-face--front">
                                <img
                                  src={gvBackCard}
                                  alt="Lineup card back"
                                  className="lineup-flip-card-img"
                                />
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="lineup-arrow-btn lineup-arrow-btn--right"
                  aria-label="Next lineup card"
                  onClick={() => scrollLineup(1)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M9 5l7 7-7 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="lineup-scroll-hint" aria-hidden="true">
                <svg className="lineup-scroll-hint-icon" viewBox="0 0 24 24">
                  <path
                    d="M15 6l-6 6 6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="lineup-scroll-hint-text">Swipe to explore</span>
                <svg className="lineup-scroll-hint-icon" viewBox="0 0 24 24">
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </section>

          {/* FEATURES OF YATRA section (content coming next) */}
          <section
            className={`features-section ${isFeaturesSectionVisible ? 'is-visible' : ''}`}
            aria-label="Features of Yatra"
            ref={featuresSectionRef}
          >
            <div className="features-container">
              <div className="section-divider" aria-hidden="true">
                <span className="section-divider-line" />
                <span className="section-divider-text">야트라의 특징</span>
                <span className="section-divider-line" />
              </div>

              <div className="features-heading">
                <h2 className="features-title">
                  <span className={`features-title-main text-reveal ${isFeaturesSectionVisible ? 'is-visible' : ''}`}>
                    IMAGINE
                  </span>
                  <span className={`features-title-sub text-reveal text-reveal--delay ${isFeaturesSectionVisible ? 'is-visible' : ''}`}>
                    50+ EVENTS
                  </span>
                </h2>
                <p className="features-title-tag">CASH PRIZE • ALL-DAY HYPE</p>
              </div>

              <div className="features-parallax">
                <div className="features-image-frame" ref={featuresImageRef}>
                  <img src="/Gallery/yatraevents.webp" alt="Yatra Events" className="features-image" />
                  <div className="features-image-glow" aria-hidden="true" />
                  <div className="features-layered-text">
                    <span className="features-layer features-layer--korean">오십+ 이벤트</span>
                    <span className="features-layer features-layer--main">50+ EVENTS</span>
                    <span className="features-layer features-layer--accent">CASH PRIZE</span>
                  </div>
                </div>
              </div>

              <div className="features-summary">
                50+ events across tech, culture, and performance. Two days of nonstop energy.
              </div>

              <div className="features-categories">
                <div className="features-category">
                  <div className="features-category-label">TECHNICAL</div>
                  <div className="features-category-title">Gaming & Digital Arts</div>
                  <p className="features-category-desc">
                    Esports, photography, short film, poster design, quizzes, drone challenge.
                  </p>
                </div>
                <div className="features-category">
                  <div className="features-category-label">CULTURAL</div>
                  <div className="features-category-title">Dance, Music & Arts</div>
                  <p className="features-category-desc">
                    Dance battles, singing, beatbox, traditional arts, comedy, and games.
                  </p>
                </div>
                <div className="features-category">
                  <div className="features-category-label">ON-STAGE</div>
                  <div className="features-category-title">Performance & Theatre</div>
                  <p className="features-category-desc">
                    Mime, mono acting, mock parliament, K-cosplay, and face fiesta competitions.
                  </p>
                </div>
              </div>

              <button className="features-cta" type="button" onClick={goToEvents}>
                Explore Events
              </button>
            </div>
          </section>

          {/* BLAST INTO PAST section */}
          <section
            className={`blast-section ${isBlastSectionVisible ? 'is-visible' : ''}`}
            aria-label="Blast into Past"
            ref={blastSectionRef}
          >
            <div className="blast-inner">
              <div className="section-divider" aria-hidden="true">
                <span className="section-divider-line" />
                <span className="section-divider-text">감사합니다</span>
                <span className="section-divider-line" />
              </div>
              <h2 className="features-title">
                <span className={`blast-title-prefix text-reveal ${isBlastSectionVisible ? 'is-visible' : ''}`}>
                  BLAST INTO THE
                </span>
                <span className={`blast-title-highlight text-reveal text-reveal--delay ${isBlastSectionVisible ? 'is-visible' : ''}`}>
                  PAST
                </span>
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
                    decoding="async"
                    loading={blastShouldEagerLoad ? 'eager' : 'lazy'}
                    fetchpriority={blastShouldEagerLoad && idx < 2 ? 'high' : 'auto'}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* PASSES Divider (between BLAST and BUY PASSES) */}
          <div className="passes-section-divider" aria-hidden="true">
            <div className="hero-divider-scroll">
              <div className="hero-divider-track" aria-label="Buy passes">
                <div className="hero-divider-content">
                  <span className="hero-divider-text">BUY PASSES</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">BUY PASSES</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">BUY PASSES</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">BUY PASSES</span>
                  <span className="hero-divider-star">✦</span>
                </div>
                <div className="hero-divider-content" aria-hidden="true">
                  <span className="hero-divider-text">BUY PASSES</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">BUY PASSES</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">BUY PASSES</span>
                  <span className="hero-divider-star">✦</span>
                  <span className="hero-divider-text">BUY PASSES</span>
                  <span className="hero-divider-star">✦</span>
                </div>
              </div>
            </div>
          </div>

          {/* BUY PASSES (ticket purchase) - normal scroll section */}
          <section
            id="buy-passes"
            ref={passesSectionRef}
            className="mobile-passes-section"
            aria-label="Buy passes"
          >
            <div className="mobile-passes-container">
              <h2 className="mobile-passes-title">
                GET YOUR <span className="mobile-passes-title-accent">PASSES</span>
              </h2>

              <div className="mobile-ticket-wrapper">
                {/* Ticket 1: Rajalakshmi Institutions */}
                <div className="mobile-neo-ticket">
                  <div className="mobile-ticket-left" style={{
                    backgroundImage: 'url(/ticket1.jpeg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 3%',
                    minHeight: '180px'
                  }}>
                  </div>

                  <div className="mobile-ticket-right">
                    <div className="mobile-ticket-header">
                      <div>
                        <div className="mobile-ticket-title" style={{ fontSize: '0.9rem', lineHeight: '1.1' }}>RAJALAKSHMI INSTITUTIONS</div>
                        <div className="mobile-ticket-subtitle">For Rajalakshmi Students</div>
                      </div>
                      <div className="mobile-ticket-seal" aria-hidden="true">
                        승인
                      </div>
                    </div>

                    <ul className="mobile-ticket-list">
                      <li>For Rajalakshmi Students</li>
                      <li>Proshows & DJ Night Included</li>
                      <li>Unlimited Fun Guaranteed</li>
                    </ul>

                    <a
                      className="mobile-ticket-cta"
                      href="https://formbuilder.ccavenue.com/live/icici-bank/rajalakshmi-institue-of-technology-2/yatra-2026-reg-fees-link"
                    >
                      REGISTER
                    </a>
                  </div>

                  <span className="mobile-ticket-notch top" aria-hidden="true" />
                  <span className="mobile-ticket-notch bottom" aria-hidden="true" />
                </div>

                {/* Ticket 2: General Public Registration */}
                <div className="mobile-neo-ticket" style={{ marginTop: '20px' }}>
                  <div className="mobile-ticket-left" style={{
                    backgroundImage: 'url(/ticket2.jpeg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 3%',
                    minHeight: '180px'
                  }}>
                  </div>

                  <div className="mobile-ticket-right">
                    <div className="mobile-ticket-header">
                      <div>
                        <div className="mobile-ticket-title" style={{ fontSize: '1.1rem' }}>GENERAL PASSES</div>
                        <div className="mobile-ticket-subtitle">OFFICIAL ENTRY</div>
                      </div>
                      <div className="mobile-ticket-seal" aria-hidden="true">
                        공공
                      </div>
                    </div>

                    <ul className="mobile-ticket-list">
                      <li><strong>DAY 1:</strong> ₹500 — Guest: AOORA</li>
                      <li><strong>DAY 2:</strong> ₹500 — GV Prakash & Pradeep Kumar</li>
                      <li style={{ color: '#9b1799', fontWeight: 700 }}>🔥 COMBO: ₹850 (DAY 1 & 2) — BEST OFFER!</li>
                    </ul>

                    <a
                      className="mobile-ticket-cta"
                      href="https://forms.easebuzz.in/sign-up/RAJALAKSHMIbw5w4/General_Public_Reg_Yatra26/?inst_name=RAJALAKSHMIbw5w4&form_name=General_Public_Reg_Yatra26&jsonData=1"
                    >
                      REGISTER
                    </a>
                  </div>

                  <span className="mobile-ticket-notch top" aria-hidden="true" />
                  <span className="mobile-ticket-notch bottom" aria-hidden="true" />
                </div>

                {/* Ticket 3: Schools Registration */}
                <div className="mobile-neo-ticket" style={{ marginTop: '20px' }}>
                  <div className="mobile-ticket-left" style={{
                    backgroundImage: 'url(/ticket3.jpeg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 3%',
                    minHeight: '180px'
                  }}>
                  </div>

                  <div className="mobile-ticket-right">
                    <div className="mobile-ticket-header">
                      <div>
                        <div className="mobile-ticket-title" style={{ fontSize: '1.1rem' }}>SCHOOLS PASSES</div>
                        <div className="mobile-ticket-subtitle">OFFICIAL ENTRY</div>
                      </div>
                      <div className="mobile-ticket-seal" aria-hidden="true">
                        학교
                      </div>
                    </div>

                    <ul className="mobile-ticket-list">
                      <li>School Students & Orgs</li>
                      <li>Bring Your Students</li>
                      <li>Experience Yatra '26</li>
                    </ul>

                    <a
                      className="mobile-ticket-cta"
                      href="https://forms.easebuzz.in/sign-up/RAJALAKSHMIbw5w4/Yatra26_Schools_Registeration/?inst_name=RAJALAKSHMIbw5w4&form_name=Yatra26_Schools_Registeration&jsonData=1A"
                    >
                      REGISTER
                    </a>
                  </div>

                  <span className="mobile-ticket-notch top" aria-hidden="true" />
                  <span className="mobile-ticket-notch bottom" aria-hidden="true" />
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer id="footer" className="mobile-footer" aria-label="Footer">
            <div className="mobile-footer-container">
              <div className="mobile-footer-title">YATRA&apos;26</div>

              <div className="mobile-footer-section">
                <div className="mobile-footer-label">ADDRESS</div>
                <div className="mobile-footer-text">Kuthambakkam, Chennai, Tamil Nadu 600124</div>
              </div>

              <div className="mobile-footer-section">
                <div className="mobile-footer-label">WEBSITE</div>
                <a className="mobile-footer-link" href="https://www.ritchennai.org" target="_blank" rel="noopener noreferrer">
                  www.ritchennai.org
                </a>
              </div>

              <div className="mobile-footer-section">
                <div className="mobile-footer-label">CONTACT</div>
                <div className="mobile-footer-phone-numbers" style={{ flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
                  <div>
                    <div className="mobile-footer-text" style={{ fontSize: '0.875rem', marginBottom: '4px', fontWeight: '500' }}>Derry Gabriel</div>
                    <div className="mobile-footer-text" style={{ fontSize: '0.75rem', marginBottom: '4px', opacity: 0.8 }}>Overall Coordinator</div>
                    <a className="mobile-footer-link mobile-footer-link--underline" href="tel:+919884470171">
                      +91 98844 70171
                    </a>
                  </div>
                  <div>
                    <div className="mobile-footer-text" style={{ fontSize: '0.875rem', marginBottom: '4px', fontWeight: '500' }}>Kishore Kumar S</div>
                    <div className="mobile-footer-text" style={{ fontSize: '0.75rem', marginBottom: '4px', opacity: 0.8 }}>Event Committee Coordinator</div>
                    <a className="mobile-footer-link mobile-footer-link--underline" href="tel:+918825910614">
                      +91 88259 10614
                    </a>
                  </div>
                  <div>
                    <div className="mobile-footer-text" style={{ fontSize: '0.875rem', marginBottom: '4px', fontWeight: '500' }}>Muthu Kumaran</div>
                    <div className="mobile-footer-text" style={{ fontSize: '0.75rem', marginBottom: '4px', opacity: 0.8 }}>Joint Overall Coordinator</div>
                    <a className="mobile-footer-link mobile-footer-link--underline" href="tel:+919094141232">
                      +91 90941 41232
                    </a>
                  </div>
                </div>
              </div>

              <div className="mobile-footer-social" aria-label="Social links">
                <a
                  className="mobile-footer-social-link"
                  href="https://www.instagram.com/yatra_rit?igsh=MTYzdDJhbHlnOHhmNQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <svg className="mobile-footer-social-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9A4.75 4.75 0 0 1 16.5 21.25h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M17.25 6.75h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </a>
                <a
                  className="mobile-footer-social-link"
                  href="https://youtube.com/@rajalakshmiinstituteoftech4448?si=E-E820dMeHNlnfBo"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                >
                  <svg className="mobile-footer-social-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.266.978.842 1.74 1.766 1.778 1.582.43 7.831.437 7.831.437s6.265.007 7.831-.403a2.515 2.515 0 0 0 1.767-1.776c.415-1.563.417-4.812.417-4.812s.002-3.265-.415-4.831zM9.996 15.005l-.005-6 5.207 3.005-5.202 2.995z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
              </div>

              <div className="mobile-footer-section">
                <div className="mobile-footer-label">LEGAL</div>
                <div className="mobile-footer-phone-numbers" style={{ flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                  <a
                    className="mobile-footer-link mobile-footer-link--underline"
                    href="/privacy-policy"
                    onClick={(e) => {
                      e.preventDefault()
                      const baseUrl = (import.meta?.env?.BASE_URL || '/').replace(/\/+$/, '')
                      window.location.assign(`${baseUrl}/privacy-policy`)
                    }}
                  >
                    Privacy Policy
                  </a>
                  <a
                    className="mobile-footer-link mobile-footer-link--underline"
                    href="/terms-conditions"
                    onClick={(e) => {
                      e.preventDefault()
                      const baseUrl = (import.meta?.env?.BASE_URL || '/').replace(/\/+$/, '')
                      window.location.assign(`${baseUrl}/terms-conditions`)
                    }}
                  >
                    Terms & Conditions
                  </a>
                </div>
              </div>
            </div>
          </footer >

          {/* Lineup Teaser Modal */}
          {
            lineupModalState !== 'closed' && (
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
            )
          }
        </>
      )
      }
    </>
  )
}

export default Hero
