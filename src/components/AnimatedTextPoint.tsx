import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedTextPointProps {
  children: ReactNode;
  delay?: number;
}

export function AnimatedTextPoint({ children, delay = 0 }: AnimatedTextPointProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        x: 5,
        transition: { duration: 0.2 },
      }}
      className="flex flex-wrap items-center gap-2 text-white/90 text-base sm:text-lg leading-relaxed cursor-default"
    >
      {children}
    </motion.div>
  );
}

