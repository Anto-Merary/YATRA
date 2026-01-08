import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const reduce = useReducedMotion();

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
    >
      {children}
    </motion.div>
  );
}


