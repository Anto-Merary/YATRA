import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import { ScrollToTop } from "./ScrollToTop";
import Dock from "./Dock";
import { Toaster } from "./ui/toaster";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Home, List } from "lucide-react";
import { RouteTransitionProvider } from "./RouteTransitionContext";

export function SiteLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const isGVPrakashPage = location.pathname === "/gv-prakash";
  const [isMobile, setIsMobile] = useState(false);

  // Track previous pathname to only scroll on actual route changes
  const prevPathnameRef = useRef<string | null>(null);
  
  // Scroll to top only on route change (not on initial mount or when pathname hasn't changed)
  useLayoutEffect(() => {
    // Only scroll if pathname actually changed (not initial mount)
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== location.pathname) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      const root = document.getElementById('root');
      if (root) {
        root.scrollTop = 0;
      }
    }
    prevPathnameRef.current = location.pathname;
  }, [location.pathname]);

  // Safety fallback: Ensure page content is visible after route change
  // This prevents black screen if AnimatePresence gets stuck
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      // Check main content area and ensure it's visible
      const main = document.querySelector('main');
      if (main) {
        const mainStyle = window.getComputedStyle(main);
        // If main is hidden, force visibility
        if (mainStyle.opacity === '0' || parseFloat(mainStyle.opacity) < 0.01) {
          main.style.opacity = '1';
        }
        
        // Check all direct children (PageTransition motion.div elements)
        Array.from(main.children).forEach((child) => {
          const htmlChild = child as HTMLElement;
          const childStyle = window.getComputedStyle(htmlChild);
          if (childStyle.opacity === '0' || parseFloat(childStyle.opacity) < 0.01) {
            htmlChild.style.opacity = '1';
            htmlChild.style.transform = 'none';
          }
        });
      }
    }, 600); // After transition should complete

    return () => clearTimeout(safetyTimer);
  }, [location.pathname]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      // Phone-only breakpoint (iPad mini size and larger should use desktop)
      setIsMobile(window.innerWidth <= 743);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navLinks = [
    { to: "/", label: "Home", end: true, icon: Home },
    { to: "/events", label: "Events", icon: List },
  ];

  // Wrapper function to scroll and navigate
  const handleNavigation = (to: string) => {
    // Scroll immediately before navigation - force instant scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const root = document.getElementById('root');
    if (root) root.scrollTop = 0;
    // Then navigate
    navigate(to);
  };

  // Dock items for mobile navigation
  const dockItems = navLinks.map((link) => {
    const IconComponent = link.icon;
    return {
      icon: <IconComponent className="w-full h-full" />,
      label: link.label,
      onClick: () => {
        handleNavigation(link.to);
      },
      className: location.pathname === link.to ? "dock-item-active" : "",
    };
  });

  // For GV Prakash page, render fullscreen without Navbar/Footer
  if (isGVPrakashPage) {
    return (
      <div className="w-full h-screen overflow-hidden">
        <Outlet />
      </div>
    );
  }

  return (
    <RouteTransitionProvider durationMs={450}>
      <div className="min-h-screen">
          {/* RouteLoaderOverlay removed - PageTransition handles visual transitions */}
          {!isHomePage && <Navbar />}
          <ScrollToTop />
          <main className={isHomePage ? "" : "pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-0 min-h-screen"}>
            <AnimatePresence 
              // Keep AnimatePresence configuration stable across routes.
              // Switching `mode` dynamically can cause exit/enter to get "stuck"
              // (URL updates but previous screen remains or a blank screen appears).
              mode="wait"
              initial={false}
              onExitComplete={() => {
                // Only scroll to top if we're not already at the top
                // This prevents interfering with user's scroll position
                if (window.scrollY > 10 || document.documentElement.scrollTop > 10) {
                  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                }
              }}
            >
              {/* Use pathname as key for deterministic transitions */}
              <PageTransition key={location.pathname}>
                <div className="w-full">
                  <Outlet />
                </div>
              </PageTransition>
            </AnimatePresence>
          </main>
          {!isHomePage && <Footer />}
          <Toaster />
          
          {/* Mobile Dock Navigation - Always rendered at SiteLayout level for all pages */}
          {isMobile && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none"
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                width: "100vw",
                paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                boxSizing: "border-box",
              }}
            >
              <div className="pointer-events-auto w-full" style={{ width: "100%" }}>
                <Dock
                  items={dockItems}
                  className="mobile-dock"
                  baseItemSize={44}
                  magnification={56}
                  distance={150}
                  panelHeight={64}
                  dockHeight={80}
                  spring={{ mass: 0.1, stiffness: 200, damping: 15 }}
                />
              </div>
            </motion.div>
          )}
      </div>
    </RouteTransitionProvider>
  );
}


