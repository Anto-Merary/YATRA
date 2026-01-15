import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * Also checks for reduced motion preference
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOnly, setIsMobileOnly] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
