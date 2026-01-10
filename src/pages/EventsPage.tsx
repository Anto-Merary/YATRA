import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "../components/Modal";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import PixelSnow from "../components/PixelSnow";
import { EVENTS, type FestEvent } from "../data/events";
import { motion } from "framer-motion";
import { useMobile } from "../hooks/use-mobile";
import leafImage from "../assets/leaf.jpeg?url";

type Filter = "all" | "day1" | "day2";

function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

// Text decryption effect component - optimized for mobile
function DecryptText({ 
  text, 
  onComplete, 
  className = "",
  delay = 0,
  isMobile = false
}: { 
  text: string; 
  onComplete?: () => void;
  className?: string;
  delay?: number;
  isMobile?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(true);
  const charsRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);
  const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/";

  useEffect(() => {
    charsRef.current = text.split("");
    setDisplayedText("");
    setIsDecrypting(true);
    frameRef.current = 0;
    
    // On mobile or if reduced motion, skip animation
    if (isMobile) {
      setDisplayedText(text);
      setIsDecrypting(false);
      if (onComplete) {
        setTimeout(onComplete, 100);
      }
      return;
    }
    
    let currentIndex = 0;
    let glitchCount = 0;
    let maxGlitches = 0;
    
    const decryptChar = () => {
      if (currentIndex >= charsRef.current.length) {
        setIsDecrypting(false);
        if (onComplete) {
          setTimeout(onComplete, 1200);
        }
        return;
      }

      frameRef.current++;
      
      // Throttle updates - only update every 2-3 frames for better performance
      if (frameRef.current % 2 === 0) {
        if (glitchCount < maxGlitches) {
          const randomChar = randomChars[Math.floor(Math.random() * randomChars.length)];
          const partial = charsRef.current.slice(0, currentIndex).join("");
          setDisplayedText(partial + randomChar);
          glitchCount++;
        } else {
          // Reveal actual character
          const finalPartial = charsRef.current.slice(0, currentIndex + 1).join("");
          setDisplayedText(finalPartial);
          currentIndex++;
          glitchCount = 0;
          maxGlitches = 2 + Math.floor(Math.random() * 2); // Reduced glitches
        }
      }
      
      rafRef.current = requestAnimationFrame(decryptChar);
    };

    const startTimeout = setTimeout(() => {
      maxGlitches = 2 + Math.floor(Math.random() * 2);
      rafRef.current = requestAnimationFrame(decryptChar);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [text, onComplete, delay, isMobile]);

  return (
    <span className={`${className} relative`}>
      {displayedText}
      {isDecrypting && !isMobile && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          className="inline-block ml-1 text-pink-400"
        >
          ▊
        </motion.span>
      )}
    </span>
  );
}

export function EventsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<FestEvent | null>(null);
  const [isDecryptingEnglish, setIsDecryptingEnglish] = useState(true);
  const { isMobile, prefersReducedMotion } = useMobile();

  const filtered = useMemo(() => {
    const q = query.trim();
    return EVENTS.filter((e) => {
      const dayOk = filter === "all" ? true : e.day === filter;
      const qOk = q ? includesLoose(e.name, q) : true;
      return dayOk && qOk;
    });
  }, [filter, query]);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return EVENTS.filter((e) => includesLoose(e.name, q)).slice(0, 6);
  }, [query]);


  return (
    <div className={`relative min-h-screen w-full overflow-hidden ${isMobile ? 'bg-black' : 'bg-slate-950'}`}>
      {/* Background - leaf.jpeg positioned in corners for mobile, radial gradients for desktop */}
      {isMobile ? (
        <>
          {/* Top-left corner leaf decoration */}
          <div 
            className="absolute top-0 left-0 z-0 w-[55%] h-[45%] bg-contain bg-no-repeat bg-top-left pointer-events-none"
            style={{
              backgroundImage: `url(${leafImage})`,
              opacity: 0.7,
              filter: 'brightness(1.1) contrast(1.1)',
            }}
          />
          {/* Bottom-right corner leaf decoration */}
          <div 
            className="absolute bottom-0 right-0 z-0 w-[55%] h-[45%] bg-contain bg-no-repeat bg-bottom-right pointer-events-none"
            style={{
              backgroundImage: `url(${leafImage})`,
              opacity: 0.7,
              filter: 'brightness(1.1) contrast(1.1)',
            }}
          />
          {/* Subtle radial gradient overlay to enhance corner glow effect */}
          <div 
            className="absolute top-0 left-0 w-[50%] h-[40%] z-[1] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at top left, rgba(236, 72, 153, 0.1), transparent 70%)',
            }}
          />
          <div 
            className="absolute bottom-0 right-0 w-[50%] h-[40%] z-[1] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.1), transparent 70%)',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 z-0">
          <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
          <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
        </div>
      )}
      
      {/* Drop shadow on top - prominent gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {/* PixelSnow Background Effect - above radial gradient background - disabled on mobile */}
      {!prefersReducedMotion && !isMobile && (
        <div className="absolute inset-0 z-[1]">
          <PixelSnow
            color="#ff00b6"
            flakeSize={0.01}
            minFlakeSize={1.5}
            pixelResolution={200}
            speed={1.0}
            depthFade={5}
            farPlane={20}
            brightness={2.0}
            gamma={0.4545}
            density={0.4}
            variant="snowflake"
            direction={90}
          />
        </div>
      )}

      {/* Subtle Korean-inspired pattern overlay */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(236, 72, 153, 0.1) 10px,
            rgba(236, 72, 153, 0.1) 20px
          )`
        }} />
      </div>

      {/* Content Layer */}
      <div className="container-max py-6 sm:py-8 md:py-14 relative z-10 px-3 sm:px-4">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12">
          <div className="text-[10px] xs:text-xs sm:text-sm font-semibold tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.25em] text-yatra-300">EVENTS</div>
          <div className="mt-1.5 sm:mt-2 md:mt-3 font-display text-xl xs:text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
            {isDecryptingEnglish && !prefersReducedMotion ? (
              <DecryptText 
                text="Explore all events" 
                delay={200}
                isMobile={isMobile}
              />
            ) : (
              "Explore all events"
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm flex-wrap">
            <span className="text-white/50">
              {filtered.length} {filtered.length === 1 ? "event" : "events"} found
            </span>
          </div>
        </div>

        {/* Event Statistics */}
        <div className="mb-4 sm:mb-6 grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4">
          {[
            { label: "Total Events", value: EVENTS.length },
            { label: "Day 1", value: EVENTS.filter(e => e.day === "day1").length },
            { label: "Day 2", value: EVENTS.filter(e => e.day === "day2").length },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
              className={`rounded-lg xs:rounded-xl border border-pink-500/20 bg-pink-500/5 p-1.5 xs:p-2 sm:p-3 md:p-4 text-center ${isMobile ? '' : 'backdrop-blur-sm'}`}
            >
              <div className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-pink-400">{stat.value}</div>
              <div className="mt-0.5 xs:mt-1 text-[9px] xs:text-[10px] sm:text-xs text-white/60 leading-tight">
                <span>{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-4 sm:mb-6 md:mb-8 space-y-3 sm:space-y-4 md:mb-10">
        <div className="grid gap-3 sm:gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div className="relative">
            {/* Search icon */}
            <div className="absolute left-3 xs:left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none z-10">
              <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              className="h-11 xs:h-12 w-full rounded-xl xs:rounded-2xl border border-pink-500/20 bg-white/[0.04] pl-9 xs:pl-10 sm:pl-12 pr-3 xs:pr-4 text-sm xs:text-base text-white placeholder:text-white/40 outline-none transition-all focus:border-pink-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(236,72,153,0.15)] touch-manipulation"
              style={{ fontSize: "16px" }}
            />

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[52px] z-20 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-[#070814] shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 transition-colors hover:bg-white/5"
                    onClick={() => {
                      setQuery(s.name);
                      setActive(s);
                    }}
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-white/50">{s.day.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
            {(
              [
                { key: "all", label: "All" },
                { key: "day1", label: "Day 1" },
                { key: "day2", label: "Day 2" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={[
                  "rounded-xl xs:rounded-2xl border px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 text-xs sm:text-sm font-medium transition-all relative overflow-hidden touch-manipulation",
                  filter === t.key
                    ? "border-pink-500/40 bg-pink-500/10 text-white shadow-lg shadow-pink-500/20"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:border-pink-500/20 hover:bg-pink-500/5 hover:text-white active:bg-pink-500/10",
                ].join(" ")}
                style={{ minHeight: "44px", minWidth: "60px" }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        </div>

        {/* Events Grid */}
        {filtered.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-pink-500/20 bg-gradient-to-br from-black/50 via-pink-500/5 to-black/50 p-12 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🔍
            </motion.div>
            <div className="text-lg font-semibold text-white/80 mb-2">
              No events found
            </div>
            <div className="mt-4 text-sm text-white/50">
              <span className="text-white/40">Try adjusting your search or filter criteria</span>
            </div>
          </div>
        ) : (
        <div className="grid gap-2.5 xs:gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => (
            <SpotlightCard
              key={e.id}
              className={`group relative cursor-pointer border-white/10 bg-white/[0.04] p-3 xs:p-4 sm:p-5 transition-all hover:border-pink-500/30 hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(236,72,153,0.2)] active:scale-[0.98] touch-manipulation ${isMobile ? '' : 'backdrop-blur-sm'}`}
              spotlightColor={isMobile ? "rgba(236, 72, 153, 0.15)" : "rgba(236, 72, 153, 0.25)"}
              onClick={() => setActive(e)}
            >
              {/* Subtle pink glow overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/0 via-pink-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:via-pink-500/0 group-hover:to-pink-500/5 transition-all duration-300 pointer-events-none" />
              
              <div className="relative z-10 pointer-events-none">
                <div className="flex items-start justify-between gap-2 xs:gap-3 mb-2 xs:mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm xs:text-base font-semibold leading-tight text-white group-hover:text-white/90 line-clamp-2">
                      {e.name}
                    </div>
                  </div>
                  <div className={`flex-shrink-0 rounded-full px-2 xs:px-2.5 py-0.5 xs:py-1 text-[9px] xs:text-[10px] font-medium tracking-wider whitespace-nowrap ${
                    e.day === "day1" 
                      ? "border-blue-500/20 bg-blue-500/10 text-blue-300" 
                      : "border-pink-500/20 bg-pink-500/10 text-pink-300"
                  }`}>
                    {e.day === "day1" ? "DAY 1" : "DAY 2"}
                  </div>
                </div>
                <div className="mb-2 xs:mb-3 text-xs xs:text-sm text-white/70 line-clamp-1">{e.venue}</div>
                <div className="text-[10px] xs:text-xs text-white/40 group-hover:text-white/50">
                  Tap for details →
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
        )}

        <Modal
        open={!!active}
        onOpenChange={(o) => {
          if (!o) setActive(null);
        }}
        title={active ? active.name : undefined}
      >
        {active && (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[320px_1fr]">
            {/* Left Column - Poster & Description */}
            <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                {active.posterUrl ? (
                  <img
                    src={active.posterUrl}
                    alt={`${active.name} poster`}
                    className="h-[320px] w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                    draggable={false}
                  />
                ) : null}
                {!active.posterUrl && (
                  <div className="flex h-[320px] w-full items-center justify-center text-xs text-white/50">
                    <div className="text-center">
                      <div className="mb-2 text-2xl">📸</div>
                      <div>
                        Poster (add <span className="mx-1 font-mono text-white/70">posterUrl</span>)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`rounded-xl border border-white/10 bg-white/[0.03] p-4 ${isMobile ? '' : 'backdrop-blur-sm'}`}>
                <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300 mb-3 flex items-center gap-2">
                  <span>ABOUT</span>
                </div>
                <div className="text-sm leading-relaxed text-white/70">
                  {active.description}
                </div>
              </div>
            </div>

            {/* Right Column - Details & Actions */}
            <div className="space-y-4 order-1 lg:order-2">
              <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${isMobile ? '' : 'backdrop-blur-sm'}`}>
                <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300 mb-4 flex items-center gap-2">
                  <span>DETAILS</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="min-w-[80px] text-white/50">
                      Venue:
                    </span>
                    <span className="text-white/80">{active.venue}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="min-w-[80px] text-white/50">
                      Day:
                    </span>
                    <span className="text-white/80">
                      {active.day === "day1" ? "Day 1" : "Day 2"}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="min-w-[80px] text-white/50">
                      Organizer:
                    </span>
                    <span className="text-white/80">{active.organizerName}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="min-w-[80px] text-white/50">
                      Phone:
                    </span>
                    <a
                      href={`tel:${active.organizerPhone}`}
                      className="text-white/80 hover:text-pink-300 transition-colors"
                    >
                      {active.organizerPhone}
                    </a>
                  </div>
                </div>
              </div>

              <a
                href={active.registrationUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-4 sm:py-3.5 text-sm font-semibold text-white transition-all hover:from-pink-600 hover:to-pink-500 hover:shadow-[0_8px_24px_rgba(236,72,153,0.4)] hover:scale-[1.02] touch-manipulation"
                style={{ minHeight: "44px" }}
              >
                <span className="text-white/90">Register Now</span>
                <motion.div
                  className="absolute inset-0 rounded-xl bg-white/20"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ originX: 0 }}
                />
              </a>
            </div>
          </div>
        )}
        </Modal>
      </div>
    </div>
  );
}


