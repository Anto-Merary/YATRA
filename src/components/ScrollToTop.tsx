import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scroll to top on route changes.
 * Uses instant scroll for immediate effect.
 */
export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Scroll all possible scroll containers immediately
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
      
      // Also try scrolling any scrollable containers
      const scrollableElements = document.querySelectorAll('[style*="overflow"], [class*="overflow"]');
      scrollableElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.scrollTop = 0;
        }
      });
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Use requestAnimationFrame for reliable timing
    requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(() => {
        scrollToTop();
      });
    });
    
    // Also scroll after delays to catch any late renders
    const timeout1 = setTimeout(scrollToTop, 50);
    const timeout2 = setTimeout(scrollToTop, 150);
    const timeout3 = setTimeout(scrollToTop, 500);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [location.pathname]);

  return null;
}


