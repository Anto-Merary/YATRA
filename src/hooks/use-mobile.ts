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
      // PHONE-only detection.
      // Requirement: iPad mini size and larger should use desktop/PC layout.
      const MOBILE_MAX_WIDTH = 743; // iPad mini (portrait) is 744px CSS width
      const userAgent = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
      const width = window.innerWidth;

      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPhoneSized = width <= MOBILE_MAX_WIDTH;
      const isIPhoneOrIPod = /iphone|ipod/i.test(userAgent);
      const isAndroidPhone = /android/i.test(userAgent) && /mobile/i.test(userAgent);
      const isOtherPhone = /webos|blackberry|iemobile|opera mini/i.test(userAgent);
      const isPhone = isTouchDevice && isPhoneSized && (isIPhoneOrIPod || isAndroidPhone || isOtherPhone);

      setIsMobile(isPhone);

      // Strict phone check for layout switching (≤ 743px)
      setIsMobileOnly(isPhoneSized);

      // Tablet check (>= 744px and < 1024px)
      setIsTablet(width >= MOBILE_MAX_WIDTH + 1 && width < 1024);
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
