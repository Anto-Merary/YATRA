import { useState, useEffect, useMemo } from 'react'

/**
 * Detects device performance capability for adaptive animations.
 * Returns a tier: 'high', 'medium', or 'low'
 * 
 * Factors considered:
 * - Hardware concurrency (CPU cores)
 * - Device memory (if available)
 * - Connection type
 * - User preference for reduced motion
 * - Touch device detection
 * - Screen refresh rate capability
 */
export function useDeviceCapability() {
  const [capability, setCapability] = useState(() => {
    // SSR-safe default
    if (typeof window === 'undefined') return 'medium'
    return detectCapability()
  })

  useEffect(() => {
    // Re-detect on mount (in case SSR default was used)
    setCapability(detectCapability())

    // Listen for memory pressure (if supported)
    if ('deviceMemory' in navigator) {
      // Memory doesn't change, but connection might
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (connection) {
        const handleChange = () => setCapability(detectCapability())
        connection.addEventListener('change', handleChange)
        return () => connection.removeEventListener('change', handleChange)
      }
    }
  }, [])

  return useMemo(() => ({
    tier: capability,
    isLowEnd: capability === 'low',
    isMidRange: capability === 'medium',
    isHighEnd: capability === 'high',
    // Animation settings based on tier
    shouldReduceAnimations: capability === 'low',
    shouldReduceBlur: capability !== 'high',
    shouldReduceParallax: capability === 'low',
    scrubMultiplier: capability === 'low' ? 2.5 : capability === 'medium' ? 1.8 : 1.35,
    animationDurationMultiplier: capability === 'low' ? 0.6 : capability === 'medium' ? 0.85 : 1,
    maxConcurrentAnimations: capability === 'low' ? 2 : capability === 'medium' ? 4 : 6,
  }), [capability])
}

function detectCapability() {
  if (typeof window === 'undefined') return 'medium'

  let score = 50 // Start at medium

  // Check for reduced motion preference (user explicitly wants less)
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  if (prefersReducedMotion) return 'low'

  // Hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4
  if (cores <= 2) score -= 25
  else if (cores <= 4) score -= 10
  else if (cores >= 8) score += 15

  // Device memory (Chrome only, in GB)
  const memory = navigator.deviceMemory
  if (memory !== undefined) {
    if (memory <= 2) score -= 30
    else if (memory <= 4) score -= 10
    else if (memory >= 8) score += 15
  }

  // Connection quality
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (connection) {
    const effectiveType = connection.effectiveType
    if (effectiveType === 'slow-2g' || effectiveType === '2g') score -= 20
    else if (effectiveType === '3g') score -= 10
    if (connection.saveData) score -= 15
  }

  // Touch device heuristic (mobile devices are generally less powerful)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  if (isTouchDevice) {
    // Check if it's likely a tablet (larger screen) vs phone
    const screenWidth = Math.min(window.screen.width, window.screen.height)
    if (screenWidth < 400) score -= 15 // Small phone
    else if (screenWidth < 600) score -= 10 // Regular phone
    // Tablets get less penalty
  }

  // Check for high refresh rate support (indicator of modern device)
  // This is a heuristic based on screen dimensions and pixel ratio
  const pixelRatio = window.devicePixelRatio || 1
  if (pixelRatio >= 3) score += 10 // High DPI, likely modern
  else if (pixelRatio < 2) score -= 5

  // Frame rate check using a quick benchmark (only on first load)
  // We'll do a lightweight check instead of a full benchmark
  const isLikelySlowDevice = checkFrameRateHeuristic()
  if (isLikelySlowDevice) score -= 20

  // Classify into tiers
  if (score >= 55) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

// Quick heuristic to detect slow devices without a full benchmark
function checkFrameRateHeuristic() {
  if (typeof window === 'undefined') return false

  // Check if the browser supports high-resolution timestamps
  if (!window.performance?.now) return true // Old browser = likely slow

  // Check for battery API (if battery is low, treat as slow)
  if ('getBattery' in navigator) {
    // Don't block on this, just note it for future
  }

  // Check screen dimensions vs device memory ratio
  const screenArea = window.screen.width * window.screen.height
  const memory = navigator.deviceMemory || 4
  const ratio = screenArea / (memory * 1000000)

  // High resolution + low memory = likely slow
  if (ratio > 2) return true

  return false
}

/**
 * Returns optimized animation config based on device capability
 */
export function getAnimationConfig(tier) {
  const configs = {
    high: {
      blur: true,
      parallax: true,
      stagger: 0.55,
      duration: 2.25,
      scrub: 1.35,
      lampCount: 8,
      decryptInterval: 32,
      enableLightning: true,
      enableLampGlow: true,
      maxConcurrentAnimations: 6,
    },
    medium: {
      blur: true,
      parallax: true,
      stagger: 0.4,
      duration: 1.8,
      scrub: 2.0,
      lampCount: 4,
      decryptInterval: 48,
      enableLightning: true,
      enableLampGlow: true,
      maxConcurrentAnimations: 5, // Show 5 of 6 images
    },
    low: {
      blur: false,
      parallax: false,
      stagger: 0.25,
      duration: 1.2,
      scrub: 3.0,
      lampCount: 0,
      decryptInterval: 64,
      enableLightning: false,
      enableLampGlow: false,
      maxConcurrentAnimations: 4, // Show 4 of 6 images
    },
  }
  return configs[tier] || configs.medium
}
