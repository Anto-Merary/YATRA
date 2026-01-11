import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { PageTransition } from "./PageTransition";
import { ScrollToTop } from "./ScrollToTop";
import ClickSpark from "./ClickSpark";
import Dock from "./Dock";
import { Toaster } from "./ui/toaster";
import { useState, useEffect, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { Home, Music2, Ticket, List, GalleryVertical, UsersRound } from "lucide-react";

export function SiteLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const [isMobile, setIsMobile] = useState(false);

  // Scroll to top on route change - use useLayoutEffect for synchronous execution
  useLayoutEffect(() => {
    // Immediate synchronous scroll before paint - force instant scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Also try scrolling the root element if it's scrollable
    const root = document.getElementById('root');
    if (root) {
      root.scrollTop = 0;
    }
  }, [location.pathname]);

  // Also use useEffect for additional scroll attempts
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
    
    // Use requestAnimationFrame for reliable timing
    const raf1 = requestAnimationFrame(() => {
      scrollToTop();
      const raf2 = requestAnimationFrame(() => {
        scrollToTop();
      });
      return () => cancelAnimationFrame(raf2);
    });
    
    // Also scroll after delays
    const timeout1 = setTimeout(scrollToTop, 50);
    const timeout2 = setTimeout(scrollToTop, 200);
    const timeout3 = setTimeout(scrollToTop, 500);
    
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [location.pathname]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navLinks = [
    { to: "/", label: "Home", end: true, icon: Home },
    { to: "/proshow", label: "Proshow", icon: Music2 },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/events", label: "Events", icon: List },
    { to: "/gallery", label: "Gallery", icon: GalleryVertical },
    { to: "/team", label: "Team", icon: UsersRound },
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

  return (
    <ClickSpark
      className="min-h-screen"
      sparkColor="#6a5cff"
      sparkCount={10}
      sparkRadius={18}
      sparkSize={12}
      duration={520}
    >
      <div className="min-h-screen">
        {!isHomePage && <Navbar />}
        <ScrollToTop />
        <main className={isHomePage ? "" : "pt-16 sm:pt-20 md:pt-24 pb-20 sm:pb-0"}>
          <AnimatePresence 
            mode="wait"
            onExitComplete={() => {
              // Ensure scroll after exit animation completes - force instant scroll
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              const root = document.getElementById('root');
              if (root) root.scrollTop = 0;
            }}
          >
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        <Footer />
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
              duration: 0.3,
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
    </ClickSpark>
  );
}


