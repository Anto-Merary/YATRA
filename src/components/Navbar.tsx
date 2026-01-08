import { NavLink, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect } from "react";
import ritLogo from "../../RIT WHITE LOGO.png";
import yatraLogo from "../../LOGO .png";

const linkBase =
  "text-sm tracking-wide text-white/80 hover:text-white transition-colors duration-200";

const linkActive =
  "text-sm tracking-wide text-white underline underline-offset-8 decoration-white/50";

interface NavbarProps {
  variant?: "fixed" | "absolute";
}

export function Navbar({ variant = "fixed" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
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

  const positionClass = variant === "fixed" ? "fixed inset-x-0 top-0" : "absolute top-0 left-0 right-0";

  return (
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
      className={`${positionClass} z-[100] px-6 md:px-8 pt-6`}
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

        {/* Center: Navigation */}
        <motion.div
          className="flex items-center justify-center rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300 px-4 md:px-6 py-2 mx-4"
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
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? linkActive : linkBase)}
              end
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
                  Home
                </motion.span>
              )}
            </NavLink>
            <NavLink
              to="/proshow"
              className={({ isActive }) => (isActive ? linkActive : linkBase)}
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
                  Proshow
                </motion.span>
              )}
            </NavLink>
            <NavLink
              to="/tickets"
              className={({ isActive }) => (isActive ? linkActive : linkBase)}
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
                  Tickets
                </motion.span>
              )}
            </NavLink>
            <NavLink
              to="/events"
              className={({ isActive }) => (isActive ? linkActive : linkBase)}
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
                  Events
                </motion.span>
              )}
            </NavLink>
            <NavLink
              to="/gallery"
              className={({ isActive }) => (isActive ? linkActive : linkBase)}
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
                  Gallery
                </motion.span>
              )}
            </NavLink>
            <NavLink
              to="/team"
              className={({ isActive }) => (isActive ? linkActive : linkBase)}
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
                  Team
                </motion.span>
              )}
            </NavLink>
          </nav>
        </motion.div>

        {/* Right: Yatra Logo */}
        <div className="flex items-center flex-1 justify-end">
          <img
            src={yatraLogo}
            alt="Yatra Logo"
            className="h-10 md:h-16 w-auto object-contain"
            draggable={false}
          />
        </div>
      </div>
    </motion.div>
  );
}


