import type { ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Reveal once (default) or every time it re-enters view */
  once?: boolean;
  /** Intersection amount (0..1). Default 0.2 */
  amount?: number;
  /** Pixels of translateY at start */
  y?: number;
  /** Max blur in px at start */
  blur?: number;
  /** Duration in seconds */
  duration?: number;
};

/**
 * ReactBits-style ScrollReveal:
 * - clips content upward (mask reveal)
 * - fades in
 * - blur -> sharp
 * - subtle lift
 */
export function ScrollReveal({
  children,
  className,
  once = true,
  amount = 0.2,
  y = 18,
  blur = 10,
  duration = 0.55,
}: ScrollRevealProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount, once });
  const [fallbackInView, setFallbackInView] = useState(false);

  const canUseIntersectionObserver = useMemo(
    () => typeof window !== "undefined" && typeof window.IntersectionObserver !== "undefined",
    [],
  );

  // Fallback: if IO doesn't fire (can happen during route transitions/animations),
  // manually check if the element is in the viewport so content doesn't stay invisible.
  useEffect(() => {
    if (reduce || inView || fallbackInView) return;
    if (!canUseIntersectionObserver) {
      setFallbackInView(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const check = () => {
      const r = el.getBoundingClientRect();
      const isVisible = r.bottom > 0 && r.top < window.innerHeight;
      if (isVisible) setFallbackInView(true);
    };

    // Run once on mount and also on scroll/resize until it becomes visible.
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [reduce, inView, fallbackInView, canUseIntersectionObserver]);

  const shouldShow = reduce || inView || fallbackInView || !canUseIntersectionObserver;

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        y,
        filter: `blur(${blur}px)`,
        clipPath: "inset(0 0 100% 0)",
      }}
      animate={
        shouldShow
          ? {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              clipPath: "inset(0 0 0% 0)",
            }
          : undefined
      }
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}


