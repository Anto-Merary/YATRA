import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * Also checks for reduced motion preference
 */
function getInitialMobileState() {
  // Synchronous check on initial render to prevent flash
  if (typeof window === 'undefined') {
    return { isMobile: false, isMobileOnly: false, isTablet: false, prefersReducedMotion: false };
  }
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
  const width = window.innerWidth;
  
  const isSmallScreen = width <= 768;
  const isMobile = isMobileDevice || isSmallScreen;
  const isMobileOnly = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = mediaQuery.matches;
  
  return { isMobile, isMobileOnly, isTablet, prefersReducedMotion };
}

export function useMobile() {
  const initialState = getInitialMobileState();
  const [isMobile, setIsMobile] = useState(initialState.isMobile);
  const [isMobileOnly, setIsMobileOnly] = useState(initialState.isMobileOnly);
  const [isTablet, setIsTablet] = useState(initialState.isTablet);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(initialState.prefersReducedMotion);

  useEffect(() => {
    // Check if mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase()
      );
      const width = window.innerWidth;
      
      const isSmallScreen = width <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
      
      // Strict mobile check for layout switching (< 768px)
      setIsMobileOnly(width < 768);
      
      // Tablet check (>= 768px and < 1024px)
      setIsTablet(width >= 768 && width < 1024);
    };

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    checkMobile();
    mediaQuery.addEventListener('change', handleReducedMotionChange);

    // Also check on resize
    const handleResize = () => {
      checkMobile();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      mediaQuery.removeEventListener('change', handleReducedMotionChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isMobile, isMobileOnly, isTablet, prefersReducedMotion };
}
