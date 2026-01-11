import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const reduce = useReducedMotion();

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

  return (
    <motion.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.98, filter: "blur(8px)" }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={reduce ? { opacity: 1 } : { opacity: 0, y: -20, scale: 0.98, filter: "blur(8px)" }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1],
        opacity: { duration: 0.3 },
        filter: { duration: 0.35 }
      }}
      onAnimationComplete={() => {
        // Ensure scroll to top after animation completes - force instant scroll
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const root = document.getElementById('root');
        if (root) root.scrollTop = 0;
      }}
    >
      {children}
    </motion.div>
  );
}


