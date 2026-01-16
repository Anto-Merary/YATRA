import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll to top on route changes.
 * Uses instant scroll for immediate effect.
 * Only scrolls on actual route changes, not on initial mount.
 */
export function ScrollToTop() {
  const location = useLocation();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Only scroll if pathname actually changed (not initial mount)
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== location.pathname) {
      // Simple, single scroll to top
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
    }
    prevPathnameRef.current = location.pathname;
  }, [location.pathname]);

  return null;
}


