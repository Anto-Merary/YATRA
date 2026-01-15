import { motion, AnimatePresence } from "framer-motion";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import LetterGlitch from "@/components/LetterGlitch";
import { NeonGlowText } from "@/components/NeonGlowText";
import { useEffect, useRef, useState } from "react";
import ProfileCard from "@/components/ProfileCard";
import christopherImage from "../assets/christopher.png?url";
import antoMeraryImage from "../assets/antomerary.png?url";
import antoMeraryPng from "../assets/antomerary.png?url";
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
    avatarUrl: christopherImage,
    handle: "ft.chrizzy"
  },
  { 
    name: "Anto Merary", 
    category: "webdev",
    role: "Web Developer",
    avatarUrl: antoMeraryImage,
    miniAvatarUrl: antoMeraryPng,
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
      
      {/* Background - switches between StarsBackground and LetterGlitch */}
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
              key="stars"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              <StarsBackground
                factor={0.05}
                speed={50}
                starColor="#fff"
                pointerEvents={false}
                className="bg-black"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center z-10 px-3 sm:px-4">
        <div className="container-max py-8 sm:py-12 md:py-16 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="mb-6 xs:mb-8 sm:mb-10 md:mb-12 text-center px-2">
              <h1 
                className="font-base-neue text-transparent text-center text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight tracking-wide" 
                style={{ WebkitTextStroke: "1px white" }}
              >
                THE MINDS BEHIND YATRA'26
              </h1>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 justify-center mt-4 xs:mt-6 sm:mt-8 px-2">
              <button
                onClick={() => setActiveFilter("faculty")}
                className={`px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg border transition-all text-xs xs:text-sm sm:text-base touch-manipulation active:scale-95 ${
                  activeFilter === "faculty"
                    ? "bg-yatra-500/20 border-yatra-400 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:border-white/20 active:bg-white/10"
                }`}
                style={{ minHeight: "44px" }}
              >
                Faculty Co ordinators
              </button>
              <button
                onClick={() => setActiveFilter("student")}
                className={`px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg border transition-all text-xs xs:text-sm sm:text-base touch-manipulation active:scale-95 ${
                  activeFilter === "student"
                    ? "bg-yatra-500/20 border-yatra-400 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:border-white/20 active:bg-white/10"
                }`}
                style={{ minHeight: "44px" }}
              >
                Student Co ordinators
              </button>
              <button
                onClick={() => setActiveFilter("webdev")}
                className={`px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg border transition-all text-xs xs:text-sm sm:text-base touch-manipulation active:scale-95 ${
                  activeFilter === "webdev"
                    ? "bg-yatra-500/20 border-yatra-400 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:border-white/20 active:bg-white/10"
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
      <section className="relative z-10 pb-12 xs:pb-16 sm:pb-20 md:pb-24 lg:pb-32 px-3 sm:px-4">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 xs:mb-8 sm:mb-10 md:mb-12"
          >
            <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-display font-semibold text-white mb-3 xs:mb-4 sm:mb-6 md:mb-8">
              {getSectionTitle()}
            </h2>
          </motion.div>

          {activeFilter === "webdev" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-6 sm:gap-8 max-w-5xl mx-auto">
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
            <div className="space-y-4 xs:space-y-6 max-w-3xl mx-auto">
              {getFilteredMembers().map((member, i) => (
                <motion.div
                  key={`${member.category}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="text-center"
                >
                  <p className="text-lg xs:text-xl text-white font-medium">{member.name}</p>
                  {member.role && (
                    <p className="text-xs xs:text-sm text-white/60 mt-0.5 xs:mt-1">{member.role}</p>
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

