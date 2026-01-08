import { NavLink, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ritLogo from "../../RIT WHITE LOGO.png";
import yatraLogo from "../../LOGO .png";

const linkBase =
  "text-sm tracking-wide text-white/80 hover:text-white transition-colors duration-200";

const linkActive =
  "text-sm tracking-wide text-white underline underline-offset-8 decoration-white/50";

const mobileLinkBase =
  "block px-6 py-4 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors duration-200";

const mobileLinkActive =
  "block px-6 py-4 text-base font-medium text-white bg-white/10 border-l-4 border-yatra-400";

interface NavbarProps {
  variant?: "fixed" | "absolute";
}

export function Navbar({ variant = "fixed" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > 100) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
    
    // Show navbar when scrolling up, hide when scrolling down
    if (latest > previous && latest > 200) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  });

  useEffect(() => {
    // Always visible at the top
    if (scrollY.get() < 50) {
      setIsVisible(true);
    }
  }, []);

  // Animate navbar on route change
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 600);
    return () => clearTimeout(timer);
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const positionClass = variant === "fixed" ? "fixed inset-x-0 top-0" : "absolute top-0 left-0 right-0";

  const navLinks = [
    { to: "/", label: "Home", end: true },
    { to: "/proshow", label: "Proshow" },
    { to: "/tickets", label: "Tickets" },
    { to: "/events", label: "Events" },
    { to: "/gallery", label: "Gallery" },
    { to: "/team", label: "Team" },
  ];

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`${positionClass} z-[100] px-4 sm:px-6 md:px-8 pt-4 sm:pt-6`}
      >
        <div className="container-max mx-auto flex items-center justify-between">
          {/* Left: RIT Logo */}
          <div className="flex items-center flex-1 justify-start relative z-[101]">
            <img
              src={ritLogo}
              alt="RIT Logo"
              className="h-10 md:h-[69px] w-auto object-contain"
              draggable={false}
            />
          </div>

          {/* Center: Desktop Navigation */}
          {!isMobile && (
            <motion.div
              className="hidden md:flex items-center justify-center rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300 px-4 md:px-6 py-2 mx-4"
              style={{
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                backgroundColor: isScrolled
                  ? "rgba(0, 0, 0, 0.4)"
                  : "rgba(0, 0, 0, 0.2)",
              }}
              animate={{
                scale: isNavigating ? [1, 1.02, 1] : 1,
                boxShadow: isNavigating 
                  ? "0 20px 25px -5px rgba(236, 72, 153, 0.2), 0 10px 10px -5px rgba(236, 72, 153, 0.1)"
                  : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              <nav className="flex items-center gap-4 md:gap-6 lg:gap-8">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => (isActive ? linkActive : linkBase)}
                    end={link.end}
                  >
                    {({ isActive }) => (
                      <motion.span
                        animate={{
                          scale: isActive ? 1.05 : 1,
                          textShadow: isActive 
                            ? "0 0 8px rgba(255, 255, 255, 0.3)" 
                            : "none",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </motion.div>
          )}

          {/* Right: Yatra Logo and Mobile Menu Button */}
          <div className="flex items-center flex-1 justify-end gap-3">
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative z-[101] p-2 rounded-lg border border-white/20 bg-black/40 backdrop-blur-sm text-white hover:bg-white/10 transition-colors touch-manipulation"
                aria-label="Toggle menu"
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                <motion.div
                  animate={isMobileMenuOpen ? "open" : "closed"}
                  className="flex flex-col gap-1.5"
                >
                  <motion.span
                    variants={{
                      closed: { rotate: 0, y: 0 },
                      open: { rotate: 45, y: 6 },
                    }}
                    className="w-5 h-0.5 bg-white rounded"
                  />
                  <motion.span
                    variants={{
                      closed: { opacity: 1 },
                      open: { opacity: 0 },
                    }}
                    className="w-5 h-0.5 bg-white rounded"
                  />
                  <motion.span
                    variants={{
                      closed: { rotate: 0, y: 0 },
                      open: { rotate: -45, y: -6 },
                    }}
                    className="w-5 h-0.5 bg-white rounded"
                  />
                </motion.div>
              </button>
            )}
            <img
              src={yatraLogo}
              alt="Yatra Logo"
              className="h-10 md:h-16 w-auto object-contain"
              draggable={false}
            />
          </div>
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#070814] border-l border-white/10 shadow-2xl z-[100] overflow-y-auto"
              style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              <div className="flex flex-col h-full">
                {/* Menu Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="text-lg font-semibold text-white">Menu</div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
                    aria-label="Close menu"
                    style={{ minWidth: "44px", minHeight: "44px" }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {/* Navigation Links */}
                <nav className="flex-1 py-4">
                  {navLinks.map((link, index) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={({ isActive }) => (isActive ? mobileLinkActive : mobileLinkBase)}
                      end={link.end}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {link.label}
                      </motion.div>
                    </NavLink>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}


