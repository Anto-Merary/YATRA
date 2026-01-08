import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Smoothly scroll to top on route changes.
 * Respects reduced-motion preference by falling back to instant scroll.
 */
export function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Let the next page render first, then scroll.
    const t = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: prefersReduced ? "auto" : "smooth" });
    }, 0);

    return () => window.clearTimeout(t);
  }, [location.pathname]);

  return null;
}


