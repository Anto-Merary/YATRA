import { motion, AnimatePresence } from "framer-motion";
import Galaxy from "@/components/Galaxy";
import LetterGlitch from "@/components/LetterGlitch";
import { AkiraText } from "@/components/AkiraText";
import { useEffect, useRef, useState } from "react";
import ProfileCard from "@/components/ProfileCard";
// Images should be in the public folder
// import christopherImage from "../../dist/assets/Christopher.jpeg?url";
// import antoMeraryImage from "../../dist/assets/Anto Merary.jpeg?url";
// import antoMeraryPng from "../../dist/assets/Anto Merary.png?url";
import closingTagPattern from "../assets/closing-tag-pattern.svg?url";

type TeamMember = {
  name: string;
  role?: string;
  category: "faculty" | "student" | "webdev";
  avatarUrl?: string;
  handle?: string;
  miniAvatarUrl?: string;
};

const FACULTY_COORDINATORS: TeamMember[] = [
  { name: "Faculty Member 1", category: "faculty" },
  { name: "Faculty Member 2", category: "faculty" },
  { name: "Faculty Member 3", category: "faculty" },
];

const STUDENT_COORDINATORS: TeamMember[] = [
  { name: "Student Coordinator 1", category: "student" },
  { name: "Student Coordinator 2", category: "student" },
  { name: "Student Coordinator 3", category: "student" },
  { name: "Student Coordinator 4", category: "student" },
];

const WEB_DEV_TEAM: TeamMember[] = [
  { 
    name: "Christopher", 
    category: "webdev",
    role: "Web Developer",
    avatarUrl: "/Christopher.jpeg",
    handle: "ft.chrizzy"
  },
  { 
    name: "Anto Merary", 
    category: "webdev",
    role: "Web Developer",
    avatarUrl: "/Anto Merary.jpeg",
    miniAvatarUrl: "/Anto Merary.png",
    handle: "antomerary.png"
  },
];

// Instagram links mapping
const INSTAGRAM_LINKS: Record<string, string> = {
  "Christopher": "https://www.instagram.com/ft.chrizzy?igsh=ajZkYjBmbHdmamp5",
  "Anto Merary": "https://www.instagram.com/antomerary.png?igsh=MXIxOHN2Zmhza2MxOA=="
};


type FilterType = "faculty" | "student" | "webdev" | "all";

export function TeamPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const autoScrollRef = useRef<number | null>(null);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expectedScrollTopRef = useRef(0);

  // Auto-scroll functionality
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollRef.current !== null) return; // Already scrolling

      const scroll = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const currentScroll = window.scrollY || document.documentElement.scrollTop;

        // Check if user interrupted scrolling
        if (Math.abs(currentScroll - expectedScrollTopRef.current) > 10) {
          // User is scrolling manually
          isUserScrollingRef.current = true;
          if (autoScrollRef.current !== null) {
            cancelAnimationFrame(autoScrollRef.current);
            autoScrollRef.current = null;
          }
          return;
        }

        if (currentScroll < maxScroll && !isUserScrollingRef.current) {
          // Smooth scroll by small increments
          const scrollStep = 0.5; // Slow scroll rate
          window.scrollBy({ top: scrollStep, behavior: "auto" });
          expectedScrollTopRef.current = currentScroll + scrollStep;
          autoScrollRef.current = requestAnimationFrame(scroll);
        } else {
          autoScrollRef.current = null;
        }
      };

      // Start scrolling after a short delay
      setTimeout(() => {
        if (!isUserScrollingRef.current) {
          expectedScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;
          autoScrollRef.current = requestAnimationFrame(scroll);
        }
      }, 1000);
    };

    // Handle user scroll interruption
    const handleScroll = () => {
      const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Detect if user is manually scrolling
      if (Math.abs(currentScrollTop - expectedScrollTopRef.current) > 10) {
        isUserScrollingRef.current = true;
        if (autoScrollRef.current !== null) {
          cancelAnimationFrame(autoScrollRef.current);
          autoScrollRef.current = null;
        }
      }
      
      lastScrollTopRef.current = currentScrollTop;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set new timeout to resume auto-scroll after user stops
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
        expectedScrollTopRef.current = currentScrollTop;
        startAutoScroll();
      }, 30000); // Resume auto-scroll after 30 seconds of no user interaction
    };

    // Use window scroll for page-level scrolling
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Also detect wheel events for better interruption detection
    const handleWheel = () => {
      isUserScrollingRef.current = true;
      if (autoScrollRef.current !== null) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
        expectedScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;
        startAutoScroll();
      }, 30000);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });

    // Handle click events to stop auto-scroll
    const handleClick = () => {
      isUserScrollingRef.current = true;
      if (autoScrollRef.current !== null) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Set new timeout to resume auto-scroll after 30 seconds of inactivity
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
        expectedScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;
        startAutoScroll();
      }, 30000);
    };

    window.addEventListener("click", handleClick, { passive: true });

    startAutoScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("click", handleClick);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (autoScrollRef.current !== null) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, []);

  const getFilteredMembers = (): TeamMember[] => {
    switch (activeFilter) {
      case "faculty":
        return FACULTY_COORDINATORS;
      case "student":
        return STUDENT_COORDINATORS;
      case "webdev":
        return WEB_DEV_TEAM;
      default:
        return [...FACULTY_COORDINATORS, ...STUDENT_COORDINATORS, ...WEB_DEV_TEAM];
    }
  };

  const getSectionTitle = (): string => {
    switch (activeFilter) {
      case "faculty":
        return "Faculty Co ordinators";
      case "student":
        return "Student Co ordinators";
      case "webdev":
        return "Web Dev Team";
      default:
        return "All Team Members";
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Drop shadow on top - prominent gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {/* Background - switches between Galaxy and LetterGlitch */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <AnimatePresence mode="wait">
          {activeFilter === "webdev" ? (
            <motion.div
              key="letterglitch"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <LetterGlitch
                glitchColors={['#2b4539', '#6A5CFF', '#61b3dc']}
                glitchSpeed={50}
                centerVignette={false}
                outerVignette={true}
                smooth={true}
                characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789"
              />
            </motion.div>
          ) : (
            <motion.div
              key="galaxy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <Galaxy
                focal={[0.5, 0.5]}
                rotation={[1.0, 0.0]}
                starSpeed={0.5}
                density={1.2}
                hueShift={260}
                speed={0.8}
                mouseInteraction={true}
                glowIntensity={0.4}
                saturation={0.3}
                mouseRepulsion={true}
                twinkleIntensity={0.4}
                rotationSpeed={0.05}
                repulsionStrength={2}
                transparent={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center z-10 px-4">
        <div className="container-max py-12 sm:py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="mb-8 sm:mb-10 md:mb-12 text-center">
              <AkiraText
                words={[
                  { firstLetter: "T", rest: "he", variant: "outline-only" },
                  { firstLetter: "C", rest: "rew", variant: "outline-only" },
                  { firstLetter: "b", rest: "ehind", variant: "outline-only" },
                  { firstLetter: "t", rest: "he", variant: "outline-only" },
                  { firstLetter: "m", rest: "agic", variant: "outline-only" },
                  { firstLetter: "o", rest: "f", variant: "outline-only" },
                  { firstLetter: "y", rest: "atra'26", variant: "outline-only" },
                  { firstLetter: ".", rest: "", variant: "outline-only" },
                ]}
                className=""
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 justify-center mt-6 sm:mt-8">
              <button
                onClick={() => setActiveFilter("faculty")}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border transition-all text-sm sm:text-base touch-manipulation ${
                  activeFilter === "faculty"
                    ? "bg-yatra-500/20 border-yatra-400 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                }`}
                style={{ minHeight: "44px" }}
              >
                Faculty Co ordinators
              </button>
              <button
                onClick={() => setActiveFilter("student")}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border transition-all text-sm sm:text-base touch-manipulation ${
                  activeFilter === "student"
                    ? "bg-yatra-500/20 border-yatra-400 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                }`}
                style={{ minHeight: "44px" }}
              >
                Student Co ordinators
              </button>
              <button
                onClick={() => setActiveFilter("webdev")}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg border transition-all text-sm sm:text-base touch-manipulation ${
                  activeFilter === "webdev"
                    ? "bg-yatra-500/20 border-yatra-400 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                }`}
                style={{ minHeight: "44px" }}
              >
                Web Dev Team
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Members List */}
      <section className="relative z-10 pb-16 sm:pb-24 md:pb-32 px-4">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-semibold text-white mb-4 sm:mb-6 md:mb-8">
              {getSectionTitle()}
            </h2>
          </motion.div>

          {activeFilter === "webdev" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
              {getFilteredMembers().map((member, i) => (
                <motion.div
                  key={`${member.category}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex justify-center"
                >
                  <ProfileCard
                    avatarUrl={member.avatarUrl || "https://via.placeholder.com/400x600/6A5CFF/FFFFFF?text=Placeholder"}
                    name={member.name}
                    title={member.role || "Web Developer"}
                    handle={member.handle}
                    miniAvatarUrl={member.miniAvatarUrl || member.avatarUrl}
                    iconUrl={closingTagPattern}
                    showUserInfo={true}
                    enableTilt={true}
                    behindGlowEnabled={true}
                    behindGlowColor="rgba(108, 92, 255, 0.67)"
                    innerGradient="linear-gradient(145deg, rgba(106, 92, 255, 0.2) 0%, rgba(106, 92, 255, 0.05) 100%)"
                    onContactClick={() => {
                      const instagramLink = INSTAGRAM_LINKS[member.name];
                      if (instagramLink) {
                        window.open(instagramLink, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {getFilteredMembers().map((member, i) => (
                <motion.div
                  key={`${member.category}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="text-center"
                >
                  <p className="text-xl text-white font-medium">{member.name}</p>
                  {member.role && (
                    <p className="text-sm text-white/60 mt-1">{member.role}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

