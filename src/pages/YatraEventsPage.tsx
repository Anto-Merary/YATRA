import { useMemo, useState, useEffect, useRef } from "react";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import { EVENTS, type ParticipationType } from "../data/events";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMobile } from "../hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useRouteTransition } from "../components/RouteTransitionContext";
import eventsHeroImg from "../mobile/assets/event.webp?url";

type Filter = "all" | "day1" | "day2";

function includesLoose(haystack: string, needle: string | null | undefined) {
  const n = (needle ?? "").trim().toLowerCase();
  if (!n) return true;
  return (haystack ?? "").toLowerCase().includes(n);
}

// Text decryption effect component - optimized for mobile
function DecryptText({ 
  text, 
  onComplete, 
  className = "",
  cursorClassName = "text-pink-400",
  delay = 0,
  isMobile = false
}: { 
  text: string; 
  onComplete?: () => void;
  className?: string;
  cursorClassName?: string;
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
          className={`inline-block ml-1 ${cursorClassName}`}
        >
          ▊
        </motion.span>
      )}
    </span>
  );
}

export function YatraEventsPage() {
  const [participation, setParticipation] = useState<ParticipationType>("solo");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const { isMobile, prefersReducedMotion } = useMobile();
  const { isTransitioning } = useRouteTransition();
  const navigate = useNavigate();

  const ui =
    participation === "solo"
      ? {
          headline: "Solo Events",
          subhead: "Step in alone. Stand out loud.",
          cursor: "text-pink-400",
          inputBorder: "border-pink-500/20",
          inputFocus:
            "focus:border-pink-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(236,72,153,0.15)]",
          filterActive:
            "border-pink-500/40 bg-pink-500/10 text-white shadow-lg shadow-pink-500/20",
          filterInactive:
            "border-white/10 bg-white/[0.03] text-white/70 hover:border-pink-500/20 hover:bg-pink-500/5 hover:text-white active:bg-pink-500/10",
          cardHover:
            "hover:border-pink-500/30 hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(236,72,153,0.2)]",
          spotlightColor: isMobile
            ? ("rgba(236, 72, 153, 0.15)" as const)
            : ("rgba(236, 72, 153, 0.25)" as const),
          pixelSnow: "#ff00b6",
          emptyCard: "border-pink-500/20 via-pink-500/5",
          overlayHover:
            "group-hover:from-pink-500/5 group-hover:via-pink-500/0 group-hover:to-pink-500/5",
          patternColor: "rgba(236, 72, 153, 0.12)",
        }
      : {
          headline: "Group Events",
          subhead: "Bring your crew. Own the moment.",
          cursor: "text-yellow-300",
          inputBorder: "border-yellow-400/20",
          inputFocus:
            "focus:border-yellow-400/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(255,241,157,0.14)]",
          filterActive:
            "border-yellow-400/40 bg-yellow-400/10 text-white shadow-lg shadow-yellow-400/20",
          filterInactive:
            "border-white/10 bg-white/[0.03] text-white/70 hover:border-yellow-400/20 hover:bg-yellow-400/5 hover:text-white active:bg-yellow-400/10",
          cardHover:
            "hover:border-yellow-400/30 hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(255,241,157,0.18)]",
          spotlightColor: isMobile
            ? ("rgba(255, 241, 157, 0.15)" as const)
            : ("rgba(255, 241, 157, 0.25)" as const),
          pixelSnow: "#fff19d",
          emptyCard: "border-yellow-400/20 via-yellow-400/5",
          overlayHover:
            "group-hover:from-yellow-400/5 group-hover:via-yellow-400/0 group-hover:to-yellow-400/5",
          patternColor: "rgba(255, 241, 157, 0.12)",
        };

  const counts = useMemo(() => {
    let solo = 0;
    let group = 0;
    for (const e of EVENTS) {
      if (filter !== "all" && e.day !== filter) continue;
      if (e.participation === "solo") solo += 1;
      else group += 1;
    }
    return { solo, group, total: solo + group };
  }, [filter]);

  const filtered = useMemo(() => {
    const q = (query ?? "").trim();
    return EVENTS.filter((e) => {
      const participationOk = e.participation === participation;
      const dayOk = filter === "all" ? true : e.day === filter;
      const qOk = q ? includesLoose(e.name, q) : true;
      return participationOk && dayOk && qOk;
    });
  }, [participation, filter, query]);

  const suggestions = useMemo(() => {
    const q = (query ?? "").trim();
    if (!q) return [];
    return EVENTS.filter((e) => {
      const dayOk = filter === "all" ? true : e.day === filter;
      const qOk = includesLoose(e.name, q);
      return dayOk && qOk;
    }).slice(0, 6);
  }, [query, filter]);

  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Drop shadow on top - prominent gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {/* Tickets-style background, but CSS-only (prevents WebGL context-loss routing blackouts) */}
      {!prefersReducedMotion && (
        <>
          <div
            className="absolute inset-0 z-0 opacity-40 pointer-events-none"
            style={{
              // Grid + two soft glows, tinted by mode (solo pink / group yellow)
              backgroundImage:
                participation === "solo"
                  ? [
                      "linear-gradient(to right, rgba(236,72,153,0.14) 1px, transparent 1px)",
                      "linear-gradient(to bottom, rgba(236,72,153,0.14) 1px, transparent 1px)",
                      "radial-gradient(circle at 30% 20%, rgba(236,72,153,0.35), transparent 60%)",
                      "radial-gradient(circle at 70% 80%, rgba(236,72,153,0.18), transparent 60%)",
                    ].join(",")
                  : [
                      "linear-gradient(to right, rgba(255,241,157,0.14) 1px, transparent 1px)",
                      "linear-gradient(to bottom, rgba(255,241,157,0.14) 1px, transparent 1px)",
                      "radial-gradient(circle at 30% 20%, rgba(255,241,157,0.32), transparent 60%)",
                      "radial-gradient(circle at 70% 80%, rgba(255,241,157,0.16), transparent 60%)",
                    ].join(","),
              backgroundSize: "18px 18px, 18px 18px, 100% 100%, 100% 100%",
              backgroundPosition: "0 0, 0 0, center, center",
              animation: isTransitioning ? undefined : "events-bg-pan 18s linear infinite",
            }}
          />
          <style>{`
            @keyframes events-bg-pan {
              0% { background-position: 0 0, 0 0, 30% 20%, 70% 80%; }
              100% { background-position: 180px 180px, 180px 180px, 32% 22%, 68% 78%; }
            }
          `}</style>
        </>
      )}

      {/* Content Layer - scrollable above fixed background */}
      <div className="container-max py-6 sm:py-8 md:py-14 relative z-10 px-3 sm:px-4">
        {/* Events banner - shown on both mobile and desktop */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="relative h-44 sm:h-56 md:h-64">
            <img
              src={eventsHeroImg}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/60" />
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
              <div className="font-akira text-2xl sm:text-3xl md:text-4xl tracking-[0.28em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
                EVENTS
              </div>
            </div>
          </div>
        </div>

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
        {/* Header Section */}
        <div
          className={[
            "mb-4 sm:mb-6 md:mb-8 lg:mb-12",
            "text-center flex flex-col items-center",
          ].join(" ")}
        >
          {!isMobile && (
            <div className="text-[10px] xs:text-xs sm:text-sm font-semibold tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.25em] text-yatra-300">
              EVENTS
            </div>
          )}
          <div className="mt-1.5 sm:mt-2 md:mt-3 font-display text-xl xs:text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
            {!prefersReducedMotion ? (
              <DecryptText
                text={ui.headline}
                delay={200}
                isMobile={isMobile}
                cursorClassName={ui.cursor}
              />
            ) : (
              ui.headline
            )}
          </div>
          <div className="mt-2 text-xs sm:text-sm text-white/60 max-w-2xl">
            {ui.subhead}
          </div>
          <div
            className={[
              "mt-2 flex items-center gap-2 text-xs sm:text-sm flex-wrap justify-center",
            ].join(" ")}
          >
            <span className="text-white/50">
              {filtered.length} {filtered.length === 1 ? "event" : "events"} found
            </span>
            <span className="text-white/25">•</span>
            <span className="text-white/50">
              {participation === "solo" ? counts.solo : counts.group} in this mode
            </span>
          </div>
        </div>

        {/* Solo / Group Switch */}
        <LayoutGroup id="events-mode">
          <div
            className={
              isMobile
                ? "mb-4 sm:mb-6 md:mb-8 grid grid-cols-2 gap-3"
                : "mb-4 sm:mb-6 md:mb-8 grid gap-2.5 xs:gap-3 sm:gap-4 sm:grid-cols-2"
            }
          >
            {(
              [
                {
                  key: "solo",
                  title: "Solo",
                  subtitle: "For individual participants",
                },
                {
                  key: "group",
                  title: "Group",
                  subtitle: "For duos & teams",
                },
              ] as const
            ).map((m) => {
              const isActive = participation === m.key;
              const count = m.key === "solo" ? counts.solo : counts.group;
              const accents =
                m.key === "solo"
                  ? {
                      borderActive: "border-pink-500/40 shadow-pink-500/20",
                      borderHover: "hover:border-pink-500/30",
                      tint: "bg-gradient-to-br from-pink-500/10 via-white/[0.02] to-transparent",
                      icon: "bg-pink-500/10 text-pink-300",
                      count: "text-pink-300",
                      glow:
                        "bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.28),transparent_60%)]",
                    }
                  : {
                      borderActive: "border-yellow-400/40 shadow-yellow-400/20",
                      borderHover: "hover:border-yellow-400/30",
                      tint: "bg-gradient-to-br from-[#fff19d]/20 via-[#fff19d]/10 to-transparent",
                      icon: "bg-[#fff19d]/20 text-yellow-200",
                      count: "text-yellow-200",
                      glow:
                        "bg-[radial-gradient(circle_at_top,rgba(255,241,157,0.4),transparent_60%)]",
                    };

              return (
                <motion.button
                  key={m.key}
                  type="button"
                  onClick={() => setParticipation(m.key)}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  className={[
                    "relative overflow-hidden rounded-2xl border text-left transition-all touch-manipulation",
                    isMobile ? "p-3" : "p-4 xs:p-5",
                    isActive
                      ? `${accents.borderActive} shadow-lg ${m.key === "group" ? "bg-[#fff19d]/30" : "bg-white/[0.03]"}`
                      : "border-white/10 bg-white/[0.03]",
                    accents.borderHover,
                    !isMobile ? "backdrop-blur-sm" : "",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 rounded-2xl ${accents.tint}`}
                  />

                  {!prefersReducedMotion && isActive && (
                    <motion.div
                      layoutId="events-mode-highlight"
                      className={`pointer-events-none absolute inset-0 rounded-2xl ${accents.glow}`}
                      transition={{
                        type: "spring",
                        stiffness: 360,
                        damping: 32,
                      }}
                    />
                  )}

                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10",
                            accents.icon,
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {m.key === "solo" ? (
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19a6 6 0 00-12 0m12 0a6 6 0 0112 0m-12 0v-1a6 6 0 0112 0v1M9 11a4 4 0 118 0 4 4 0 01-8 0z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a4 4 0 00-4-4h-1m-6 6h6v-2a4 4 0 00-4-4h-2m-6 6H2v-2a4 4 0 014-4h2m3-5a4 4 0 110-8 4 4 0 010 8zm6 0a3 3 0 110-6 3 3 0 010 6z"
                              />
                            </svg>
                          )}
                        </span>

                        <div className="text-base xs:text-lg font-semibold text-white">
                          {m.title}
                        </div>
                      </div>

                      <div className="mt-1 text-xs xs:text-sm text-white/60">
                        {m.subtitle}
                      </div>

                      <div className="mt-3 text-[10px] xs:text-xs text-white/40">
                        Tap to explore →
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-2xl xs:text-3xl font-bold ${accents.count}`}
                      >
                        {count}
                      </div>
                      <div className="text-[10px] xs:text-xs tracking-[0.18em] text-white/50">
                        EVENTS
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>

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
              onChange={(e) => setQuery(e.target.value ?? "")}
              placeholder="Search events..."
              className={[
                "h-11 xs:h-12 w-full rounded-xl xs:rounded-2xl border bg-white/[0.04] pl-9 xs:pl-10 sm:pl-12 pr-3 xs:pr-4 text-sm xs:text-base text-white placeholder:text-white/40 outline-none transition-all touch-manipulation",
                ui.inputBorder,
                ui.inputFocus,
              ].join(" ")}
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
                      navigate(`/events/${s.id}`);
                    }}
                  >
                    <span>{s.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-white/50">
                        {s.day.toUpperCase()}
                      </span>
                      <span
                        className={[
                          "text-xs font-medium",
                          s.participation === "solo"
                            ? "text-pink-300"
                            : "text-yellow-200",
                        ].join(" ")}
                      >
                        {s.participation.toUpperCase()}
                      </span>
                    </span>
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
                    ? ui.filterActive
                    : ui.filterInactive,
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
        <AnimatePresence mode="wait" initial={false}>
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={
                prefersReducedMotion ? undefined : { opacity: 0, y: 14 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className={[
                "flex min-h-[400px] flex-col items-center justify-center rounded-2xl border bg-gradient-to-br from-black/50 to-black/50 p-12 text-center",
                ui.emptyCard,
              ].join(" ")}
            >
              {prefersReducedMotion ? (
                <div className="text-6xl mb-4">🔍</div>
              ) : (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🔍
                </motion.div>
              )}
              <div className="text-lg font-semibold text-white/80 mb-2">
                No events found
              </div>
              <div className="mt-4 text-sm text-white/50">
                <span className="text-white/40">
                  Try adjusting your search or filter criteria
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`${participation}-${filter}`}
              initial={
                prefersReducedMotion ? undefined : { opacity: 0, y: 14 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className={
                isMobile
                  ? "grid grid-cols-2 gap-3 auto-rows-fr"
                  : "grid gap-2.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
              }
            >
              {filtered.map((e) => (
                <SpotlightCard
                  key={e.id}
                  className={[
                    "group relative border-white/10 bg-white/[0.04] transition-all active:scale-[0.98] touch-manipulation flex flex-col cursor-default hover:opacity-20",
                    isMobile ? "p-1 min-h-0" : "p-2 xs:p-3 sm:p-4",
                    ui.cardHover,
                    !isMobile ? "backdrop-blur-sm hover:backdrop-blur-none" : "",
                  ].join(" ")}
                  spotlightColor={ui.spotlightColor}
                >
                  {/* Glow overlay on hover */}
                  <div
                    className={[
                      "absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-transparent transition-all duration-300 pointer-events-none",
                      ui.overlayHover,
                    ].join(" ")}
                  />

                  {/* Thumbnail - shown on both mobile and desktop */}
                  {e.posterUrl && (
                    <div className={`relative z-10 overflow-hidden rounded-lg xs:rounded-xl border border-white/10 flex-shrink-0 ${
                      isMobile ? "mb-1" : "mb-2 xs:mb-2.5 sm:mb-3"
                    }`} style={isMobile ? { flexBasis: '60%', maxHeight: '60%' } : {}}>
                      <div className="relative aspect-square w-full">
                        <img
                          src={e.posterUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover object-center"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/35" />
                      </div>
                    </div>
                  )}

                  <div className="relative z-10 flex-1 min-h-0 flex flex-col">
                    <div className={`flex items-start justify-between gap-1 xs:gap-1.5 ${
                      isMobile ? "mb-0.5" : "mb-1.5 xs:mb-2"
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold leading-tight text-white group-hover:text-white/90 line-clamp-2 ${
                          isMobile ? "text-[11px] leading-snug" : "text-sm xs:text-base"
                        }`}>
                          {e.name}
                        </div>
                      </div>
                      <div
                        className={`flex-shrink-0 rounded-full px-1.5 xs:px-2 py-0.5 text-[8px] xs:text-[9px] font-medium tracking-wider whitespace-nowrap ${
                          e.day === "day1"
                            ? "border-blue-500/20 bg-blue-500/10 text-blue-300"
                            : "border-pink-500/20 bg-pink-500/10 text-pink-300"
                        }`}
                      >
                        {e.day === "day1" ? "DAY 1" : "DAY 2"}
                      </div>
                    </div>
                  </div>

                  {/* More Info Button */}
                  <div className={`relative z-10 border-t border-white/10 flex-shrink-0 ${
                    isMobile ? "pt-0.5 mt-0.5" : "pt-2 xs:pt-2.5 mt-auto"
                  }`}>
                    <button
                      onClick={() => navigate(`/events/${e.id}`)}
                      className={`w-full rounded-md xs:rounded-lg font-semibold text-white transition-all hover:opacity-90 backdrop-blur-sm ${
                        isMobile ? "h-6 text-[10px] py-0" : "h-8 xs:h-9 sm:h-10 text-xs xs:text-sm"
                      } ${
                        e.day === "day1"
                          ? "bg-blue-500/20 border border-blue-400/25 hover:bg-blue-500/25"
                          : "bg-pink-500/20 border border-pink-400/25 hover:bg-pink-500/25"
                      }`}
                    >
                      More Info
                    </button>
                  </div>
                </SpotlightCard>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
