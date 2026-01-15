import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const reduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure scroll to top when component mounts (new page loads)
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Use requestAnimationFrame
    requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(() => {
        scrollToTop();
      });
    });
    
    // Also scroll after animation completes
    const timeoutId = setTimeout(scrollToTop, 450);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Fallback: Ensure content is visible even if animation fails
  useEffect(() => {
    // Safety check after animation should complete
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const element = containerRef.current;
        const computedStyle = window.getComputedStyle(element);
        // Force visibility if still hidden after animation should complete
        if (computedStyle.opacity === '0' || parseFloat(computedStyle.opacity) < 0.01) {
          element.style.opacity = '1';
          element.style.transform = 'none';
          element.style.willChange = 'auto';
        }
      }
    }, 500); // After animation duration + buffer

    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      // Avoid CSS `filter` on the route container: it can create a new stacking context
      // and has been observed to cause "blank page" rendering glitches on some GPUs/browsers,
      // especially when pages use `position: fixed` backgrounds (like EventsPage).
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.99 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 1 } : { opacity: 0, y: -18, scale: 0.99 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1],
        opacity: { duration: 0.3 },
      }}
      onAnimationStart={() => {
        // Ensure we start visible if animation starts
        if (containerRef.current) {
          containerRef.current.style.willChange = 'opacity, transform';
        }
      }}
      onAnimationComplete={() => {
        // Ensure scroll to top after animation completes - force instant scroll
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const root = document.getElementById('root');
        if (root) root.scrollTop = 0;
        
        // Clean up will-change for performance and ensure visibility
        if (containerRef.current) {
          containerRef.current.style.willChange = 'auto';
          // Ensure element is visible after animation completes
          const computedStyle = window.getComputedStyle(containerRef.current);
          if (computedStyle.opacity === '0' || parseFloat(computedStyle.opacity) < 0.01) {
            containerRef.current.style.opacity = '1';
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}


