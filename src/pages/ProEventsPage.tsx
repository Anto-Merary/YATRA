import { motion } from "framer-motion";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { useMobile } from "../hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import mrmrsImage from "../assets/mrmrs.webp?url";
import danceImage from "../assets/dance.webp?url";

export function ProEventsPage() {
  const { isMobile, prefersReducedMotion } = useMobile();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-black">
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {!prefersReducedMotion && (
        <div
          className="absolute inset-0 z-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: [
              "linear-gradient(to right, rgba(168,85,247,0.14) 1px, transparent 1px)",
              "linear-gradient(to bottom, rgba(168,85,247,0.14) 1px, transparent 1px)",
              "radial-gradient(circle at 30% 20%, rgba(168,85,247,0.35), transparent 60%)",
              "radial-gradient(circle at 70% 80%, rgba(168,85,247,0.18), transparent 60%)",
            ].join(","),
            backgroundSize: "18px 18px, 18px 18px, 100% 100%, 100% 100%",
          }}
        />
      )}

      <div className="container-max py-6 sm:py-8 md:py-14 relative z-10 px-3 sm:px-4">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/events")}
          className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm sm:text-base">Back to Categories</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] xs:text-xs sm:text-sm font-semibold tracking-[0.15em] text-purple-300">
            PRO EVENTS
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
            Premium Competitions
          </div>
          <div className="mt-2 text-xs sm:text-sm text-white/60">
            Special showcases and exclusive events
          </div>
        </div>

        {/* PRO Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl">
          {/* Mr. & Ms. Yatra Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SpotlightCard
              className="group relative cursor-pointer overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-white/[0.04] to-transparent p-6 sm:p-8 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] touch-manipulation backdrop-blur-sm"
              spotlightColor={isMobile ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.25)"}
              onClick={() => navigate("/events/mr-ms-yatra")}
            >
              {/* Right image (masked) */}
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-[44%] sm:w-[46%] opacity-60 sm:opacity-90"
                aria-hidden="true"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to left, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
                  maskImage:
                    "linear-gradient(to left, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
                }}
              >
                <img
                  src={mrmrsImage}
                  alt=""
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/0 via-black/15 to-black/70" />
              </div>

              {/* Content */}
              <div className="relative z-10 pr-12 sm:pr-16">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Mr. & Ms. Yatra
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-white/70 mb-4 line-clamp-2">
                  The ultimate competition to crown the most charismatic personalities of YATRA 2026
                </p>
                <div className="flex items-center gap-4 text-xs sm:text-sm">
                  <span className="text-purple-300">Prize: ₹5000</span>
                  <span className="text-white/50">•</span>
                  <span className="text-white/70">Entry: ₹300</span>
                </div>
                <div className="mt-4 text-xs text-white/50 group-hover:text-white/70 transition-colors">
                  Tap to view details →
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Dance Battle Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <SpotlightCard
              className="group relative cursor-pointer overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-white/[0.04] to-transparent p-6 sm:p-8 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98] touch-manipulation backdrop-blur-sm"
              spotlightColor={isMobile ? "rgba(168, 85, 247, 0.15)" : "rgba(168, 85, 247, 0.25)"}
              onClick={() => navigate("/pro-dance-battle")}
            >
              {/* Right image (masked) */}
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-[44%] sm:w-[46%] opacity-60 sm:opacity-90"
                aria-hidden="true"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to left, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
                  maskImage:
                    "linear-gradient(to left, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
                }}
              >
                <img
                  src={danceImage}
                  alt=""
                  className="h-full w-full object-cover object-center"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-l from-black/0 via-black/15 to-black/70" />
              </div>

              {/* Content */}
              <div className="relative z-10 pr-12 sm:pr-16">
                <div className="flex items-center gap-3 mb-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Dance Battle
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-white/70 mb-4 line-clamp-2">
                  High-energy face-offs where dancers bring style, power, and stage presence.
                </p>
                <div className="flex items-center gap-4 text-xs sm:text-sm">
                  <span className="text-purple-300">Prize: TBA</span>
                  <span className="text-white/50">•</span>
                  <span className="text-white/70">Entry: TBA</span>
                </div>
                <div className="mt-4 text-xs text-white/50 group-hover:text-white/70 transition-colors">
                  Tap to view details →
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
