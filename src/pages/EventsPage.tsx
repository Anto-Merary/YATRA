import { useMemo, useState, useEffect, useRef } from "react";
import { Modal } from "../components/Modal";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import PixelSnow from "../components/PixelSnow";
import { EVENTS, type FestEvent } from "../data/events";
import { motion, AnimatePresence } from "framer-motion";

type Filter = "all" | "day1" | "day2";

function includesLoose(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

// Text decryption effect component
function DecryptText({ 
  text, 
  onComplete, 
  className = "",
  delay = 0 
}: { 
  text: string; 
  onComplete?: () => void;
  className?: string;
  delay?: number;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(true);
  const charsRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/가나다라마바사아자차카타파하";

  useEffect(() => {
    charsRef.current = text.split("");
    setDisplayedText("");
    setIsDecrypting(true);
    
    // Clear any existing timeouts/intervals
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    let currentIndex = 0;
    
    const decryptChar = (index: number) => {
      if (index >= charsRef.current.length) {
        setIsDecrypting(false);
        if (onComplete) {
          const completeTimeout = setTimeout(onComplete, 1200);
          timeoutRef.current.push(completeTimeout);
        }
        return;
      }

      // Show glitch effect - cycle through random chars before revealing
      let glitchCount = 0;
      const maxGlitches = 3 + Math.floor(Math.random() * 3);
      
      intervalRef.current = setInterval(() => {
        const randomChar = randomChars[Math.floor(Math.random() * randomChars.length)];
        const partial = charsRef.current.slice(0, index).join("");
        setDisplayedText(partial + randomChar);
        
        glitchCount++;
        if (glitchCount >= maxGlitches) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Reveal actual character
          const finalPartial = charsRef.current.slice(0, index + 1).join("");
          setDisplayedText(finalPartial);
          
          // Move to next character
          currentIndex++;
          const nextTimeout = setTimeout(() => {
            decryptChar(currentIndex);
          }, 60 + Math.random() * 40);
          timeoutRef.current.push(nextTimeout);
        }
      }, 30 + Math.random() * 30);
    };

    const startTimeout = setTimeout(() => {
      decryptChar(0);
    }, delay);
    timeoutRef.current.push(startTimeout);

    return () => {
      timeoutRef.current.forEach(clearTimeout);
      timeoutRef.current = [];
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, onComplete, delay]);

  return (
    <span className={`${className} relative`}>
      {displayedText}
      {isDecrypting && (
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
  const [showKorean, setShowKorean] = useState(true);
  const [isDecryptingKorean, setIsDecryptingKorean] = useState(true);
  const [isDecryptingEnglish, setIsDecryptingEnglish] = useState(false);

  const handleKoreanComplete = () => {
    setIsDecryptingKorean(false);
    setTimeout(() => {
      setShowKorean(false);
      setIsDecryptingEnglish(true);
    }, 500);
  };

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

  // Helper function to check if event is popular (you can customize this logic)
  const isPopularEvent = (eventId: string) => {
    const popularEvents = ["k-drama-vs-anime-quiz", "k-cosplay", "solo-dance", "singing"];
    return popularEvents.includes(eventId);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Radial gradient circles background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
        <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
      </div>
      
      {/* Drop shadow on top - prominent gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {/* PixelSnow Background Effect - above radial gradient background */}
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
      <div className="container-max py-6 sm:py-8 md:py-14 relative z-10 px-4">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <div className="text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-yatra-300">EVENTS</div>
          <div className="mt-2 sm:mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
            <AnimatePresence mode="wait">
              {showKorean ? (
                <motion.div
                  key="korean"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="block text-pink-400 font-korean"
                >
                  {isDecryptingKorean ? (
                    <DecryptText 
                      text="이벤트 탐색" 
                      onComplete={handleKoreanComplete}
                      delay={500}
                    />
                  ) : (
                    <motion.span
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      이벤트 탐색
                    </motion.span>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="english"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDecryptingEnglish ? (
                    <DecryptText 
                      text="Explore all events" 
                      delay={200}
                    />
                  ) : (
                    "Explore all events"
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm flex-wrap">
            <span className="text-white/50">
              {filtered.length} {filtered.length === 1 ? "event" : "events"}
            </span>
            <span className="text-pink-300/80 font-medium font-korean">
              {filtered.length}개 이벤트
            </span>
            <span className="text-white/30">•</span>
            <span className="text-white/50">found</span>
          </div>
        </div>

        {/* Event Statistics */}
        <div className="mb-4 sm:mb-6 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "전체 이벤트", value: EVENTS.length, korean: "Total Events" },
            { label: "1일차", value: EVENTS.filter(e => e.day === "day1").length, korean: "Day 1" },
            { label: "2일차", value: EVENTS.filter(e => e.day === "day2").length, korean: "Day 2" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-2 sm:p-3 md:p-4 text-center backdrop-blur-sm"
            >
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-pink-400">{stat.value}</div>
              <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-white/60">
                <span className="text-pink-300/80 font-korean">{stat.label}</span>
                <span className="text-white/40 mx-1">•</span>
                <span>{stat.korean}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 sm:mb-8 space-y-4 md:mb-10">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
          <div className="relative">
            {/* Search icon */}
            <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none z-10">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이벤트 검색... Search events..."
              className="h-11 sm:h-12 w-full rounded-2xl border border-pink-500/20 bg-white/[0.04] pl-10 sm:pl-12 pr-3 sm:pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-all focus:border-pink-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(236,72,153,0.15)] touch-manipulation"
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

          <div className="flex items-center gap-2 flex-wrap">
            {(
              [
                { key: "all", label: "All", korean: "전체" },
                { key: "day1", label: "Day 1", korean: "1일차" },
                { key: "day2", label: "Day 2", korean: "2일차" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={[
                  "rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium transition-all relative overflow-hidden touch-manipulation",
                  filter === t.key
                    ? "border-pink-500/40 bg-pink-500/10 text-white shadow-lg shadow-pink-500/20"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:border-pink-500/20 hover:bg-pink-500/5 hover:text-white",
                ].join(" ")}
                style={{ minHeight: "44px" }}
              >
                <span className="text-pink-300/80 text-[10px] sm:text-xs mr-1 font-korean">{t.korean}</span>
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
              <span className="text-pink-400 font-korean">이벤트를 찾을 수 없습니다</span>
            </div>
            <div className="text-base text-white/60 mb-1">
              No events found
            </div>
            <div className="mt-4 text-sm text-white/50">
              <span className="text-pink-300/80 font-korean">검색 또는 필터 조건을 조정해보세요</span>
              <br />
              <span className="text-white/40">Try adjusting your search or filter criteria</span>
            </div>
          </div>
        ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => (
            <SpotlightCard
              key={e.id}
              className="group relative cursor-pointer border-white/10 bg-white/[0.04] p-4 sm:p-5 transition-all hover:border-pink-500/30 hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(236,72,153,0.2)] touch-manipulation"
              spotlightColor="rgba(236, 72, 153, 0.25)"
              onClick={() => setActive(e)}
            >
              {/* Subtle pink glow overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-pink-500/0 via-pink-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:via-pink-500/0 group-hover:to-pink-500/5 transition-all duration-300 pointer-events-none" />
              
              <div className="relative z-10 pointer-events-none">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    {/* Korean-style badges */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {isPopularEvent(e.id) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-medium border border-pink-500/30 font-korean">
                          인기
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium border border-blue-500/30 font-korean">
                        신규
                      </span>
                    </div>
                    <div className="text-base font-semibold leading-tight text-white group-hover:text-white/90">
                      {e.name}
                    </div>
                  </div>
                  <div className="flex-shrink-0 rounded-full border border-pink-500/20 bg-pink-500/10 px-2.5 py-1 text-[10px] font-medium tracking-wider text-pink-300">
                    {e.day === "day1" ? (
                      <>
                        <span className="font-korean">1일차</span>
                        <span className="mx-1 text-pink-400/50">•</span>
                        <span>DAY 1</span>
                      </>
                    ) : (
                      <>
                        <span className="font-korean">2일차</span>
                        <span className="mx-1 text-pink-400/50">•</span>
                        <span>DAY 2</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="mb-3 text-sm text-white/70 line-clamp-1">{e.venue}</div>
                <div className="text-xs text-white/40 group-hover:text-white/50">
                  <span className="text-pink-300/80 font-korean">자세히 보기</span>
                  <span className="mx-1 text-white/30">•</span>
                  <span>Click for details →</span>
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
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* Left Column - Poster & Description */}
            <div className="space-y-4 order-2 lg:order-1">
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

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300 mb-3 flex items-center gap-2">
                  <span className="text-pink-400 font-korean">소개</span>
                  <span className="text-white/30">•</span>
                  <span>ABOUT</span>
                </div>
                <div className="text-sm leading-relaxed text-white/70">
                  {active.description}
                </div>
              </div>
            </div>

            {/* Right Column - Details & Actions */}
            <div className="space-y-4 order-1 lg:order-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300 mb-4 flex items-center gap-2">
                  <span className="text-pink-400 font-korean">상세 정보</span>
                  <span className="text-white/30">•</span>
                  <span>DETAILS</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="min-w-[80px] text-white/50 flex items-center gap-1">
                      <span className="text-pink-300/80 font-korean">장소:</span>
                      <span className="text-white/30">•</span>
                      <span>Venue:</span>
                    </span>
                    <span className="text-white/80">{active.venue}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="min-w-[80px] text-white/50 flex items-center gap-1">
                      <span className="text-pink-300/80 font-korean">날짜:</span>
                      <span className="text-white/30">•</span>
                      <span>Day:</span>
                    </span>
                    <span className="text-white/80">
                      {active.day === "day1" ? (
                        <>
                          <span className="text-pink-300/80 font-korean">1일차</span>
                          <span className="text-white/50 mx-2">•</span>
                          Day 1
                        </>
                      ) : (
                        <>
                          <span className="text-pink-300/80 font-korean">2일차</span>
                          <span className="text-white/50 mx-2">•</span>
                          Day 2
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="min-w-[80px] text-white/50 flex items-center gap-1">
                      <span className="text-pink-300/80 font-korean">주최자:</span>
                      <span className="text-white/30">•</span>
                      <span>Organizer:</span>
                    </span>
                    <span className="text-white/80">{active.organizerName}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="min-w-[80px] text-white/50 flex items-center gap-1">
                      <span className="text-pink-300/80 font-korean">전화번호:</span>
                      <span className="text-white/30">•</span>
                      <span>Phone:</span>
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
                <span className="text-white font-medium font-korean">지금 등록하기</span>
                <span className="mx-2 text-white/70">•</span>
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


