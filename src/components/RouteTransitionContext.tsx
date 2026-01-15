import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

type RouteTransitionContextValue = {
  /** True briefly on every route change (used to show a loader and delay heavy effects). */
  isTransitioning: boolean;
};

const RouteTransitionContext = createContext<RouteTransitionContextValue | null>(null);

export function RouteTransitionProvider({
  children,
  durationMs = 450,
}: {
  children: React.ReactNode;
  /** How long the "transitioning" window should remain true after a pathname change. */
  durationMs?: number;
}) {
  const location = useLocation();
  const isFirstRef = useRef(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Don't flash the loader on the initial mount.
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }

    setIsTransitioning(true);
    const t = window.setTimeout(() => setIsTransitioning(false), durationMs);
    return () => window.clearTimeout(t);
  }, [location.pathname, durationMs]);

  const value = useMemo(() => ({ isTransitioning }), [isTransitioning]);
  return <RouteTransitionContext.Provider value={value}>{children}</RouteTransitionContext.Provider>;
}

export function useRouteTransition() {
  const ctx = useContext(RouteTransitionContext);
  if (!ctx) {
    // Safe default if used outside provider (e.g., unit tests).
    return { isTransitioning: false };
  }
  return ctx;
}

