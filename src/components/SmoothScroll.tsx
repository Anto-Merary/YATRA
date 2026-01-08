import { useEffect } from 'react';

/**
 * SmoothScroll component that provides enhanced smooth scrolling behavior
 * across all pages using requestAnimationFrame with easing
 */
export function SmoothScroll() {
  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      return; // Don't apply smooth scroll if user prefers reduced motion
    }
    
    let isScrolling = false;
    let rafId: number | null = null;
    
    // Target scroll position
    let targetScrollY = window.scrollY || window.pageYOffset || 0;
    let currentScrollY = targetScrollY;
    
    // Smooth scroll animation
    const animate = () => {
      const diff = targetScrollY - currentScrollY;
      
      // If difference is very small, snap to target and stop
      if (Math.abs(diff) < 0.5) {
        currentScrollY = targetScrollY;
        window.scrollTo(0, currentScrollY);
        isScrolling = false;
        rafId = null;
        return;
      }
      
      // Smooth interpolation with easing (ease-out)
      const easeFactor = 0.15; // Lower = smoother but slower, Higher = faster but less smooth
      currentScrollY += diff * easeFactor;
      window.scrollTo(0, currentScrollY);
      
      rafId = requestAnimationFrame(animate);
    };
    
    const handleWheel = (e: WheelEvent) => {
      // Update target scroll position
      targetScrollY += e.deltaY;
      
      // Clamp to valid scroll range
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));
      
      // Start smooth scrolling if not already scrolling
      if (!isScrolling) {
        currentScrollY = window.scrollY || window.pageYOffset || 0;
        isScrolling = true;
        rafId = requestAnimationFrame(animate);
      }
    };
    
    // Add wheel event listener
    window.addEventListener('wheel', handleWheel, { passive: true });
    
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);
  
  return null;
}

