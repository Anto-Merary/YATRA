import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Dock from "./Dock";
import { Home, Mic, Ticket, Calendar, Images, Users } from "lucide-react";
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
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
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


  const positionClass = variant === "fixed" ? "fixed inset-x-0 top-0" : "absolute top-0 left-0 right-0";

  const navLinks = [
    { to: "/", label: "Home", end: true, icon: Home },
    { to: "/proshow", label: "Proshow", icon: Mic },
    { to: "/tickets", label: "Tickets", icon: Ticket },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/gallery", label: "Gallery", icon: Images },
    { to: "/team", label: "Team", icon: Users },
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
      icon: <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />,
      label: link.label,
      onClick: () => {
        handleNavigation(link.to);
      },
      className: location.pathname === link.to ? "dock-item-active" : "",
    };
  });

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

    </>
  );
}


