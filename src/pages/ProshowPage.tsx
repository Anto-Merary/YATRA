import { Link } from "react-router-dom";
import TextType from "@/components/TextType";
import FaultyTerminal from "@/components/FaultyTerminal";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMobile } from "../hooks/use-mobile";

import artistPng from "../assets/artist.png?url";

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
  const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/가나다라마바사아자차카타파하";

  useEffect(() => {
    charsRef.current = text.split("");
    setDisplayedText("");
    setIsDecrypting(true);
    frameRef.current = 0;
    
    // On mobile, skip animation
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

// Custom decryption component for AOORA with colored parts - optimized for mobile
function DecryptAOORA({ 
  onComplete, 
  delay = 0,
  isMobile = false
}: { 
  onComplete?: () => void;
  delay?: number;
  isMobile?: boolean;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(true);
  const charsRef = useRef<string[]>([]);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);
  const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/가나다라마바사아자차카타파하";
  const text = "AOORA";

  useEffect(() => {
    charsRef.current = text.split("");
    setDisplayedText("");
    setIsDecrypting(true);
    frameRef.current = 0;
    
    // On mobile, skip animation
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
  }, [onComplete, delay, isMobile]);

  // Split displayed text into colored parts: A (pink), OO (white), RA (pink)
  const renderColoredText = () => {
    if (displayedText.length === 0) return null;
    
    const parts = [];
    if (displayedText.length >= 1) {
      parts.push(<span key="a" className="text-pink-500">{displayedText[0]}</span>);
    }
    if (displayedText.length >= 2) {
      const ooPart = displayedText.slice(1, 3);
      parts.push(<span key="oo" className="text-white">{ooPart}</span>);
    }
    if (displayedText.length >= 4) {
      const raPart = displayedText.slice(3);
      parts.push(<span key="ra" className="text-pink-500">{raPart}</span>);
    }
    
    return parts;
  };

  return (
    <span className="relative">
      {renderColoredText()}
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

export function ProshowPage() {
  const artistName = "AOORA";
  const [showKorean, setShowKorean] = useState(true);
  const [isDecryptingKorean, setIsDecryptingKorean] = useState(true);
  const [isDecryptingEnglish, setIsDecryptingEnglish] = useState(false);
  const { isMobile, prefersReducedMotion } = useMobile();
  const aboutText =
    `Meet AOORA (Park Min-jun), the K-Pop sensation bridging the gap between Korea and India. Debuting in 2009 with the group Double-A, Aoora went solo to pursue a unique blend of energetic EDM and pop. Known for his signature 'Indo-Korean' genre, he went viral for his K-Pop renditions of Bappi Lahiri classics like Jimmy Jimmy and Auva Auva. After winning hearts as a wild card on Bigg Boss 17, he continues to light up stages with his neon-fueled fashion and high-octane performances.`;

  const handleKoreanComplete = () => {
    setIsDecryptingKorean(false);
    setTimeout(() => {
      setShowKorean(false);
      setIsDecryptingEnglish(true);
    }, 500);
  };

  return (
    <div className="relative w-full min-h-screen bg-black">
      {/* Drop shadow on top - prominent gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {/* FaultyTerminal Background - covers entire page - optimized for mobile */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 z-0 opacity-30 w-full h-full">
          <FaultyTerminal
            scale={isMobile ? 1.5 : 2}
            gridMul={isMobile ? [2, 1] : [3, 2]}
            digitSize={isMobile ? 1.0 : 1.2}
            timeScale={isMobile ? 0.2 : 0.4}
            scanlineIntensity={isMobile ? 0.2 : 0.4}
            glitchAmount={isMobile ? 0.8 : 1.1}
            flickerAmount={isMobile ? 0.5 : 0.8}
            noiseAmp={isMobile ? 0.8 : 1.2}
            chromaticAberration={isMobile ? 1 : 2}
            dither={isMobile ? false : true}
            curvature={isMobile ? 0.1 : 0.15}
            tint="#ec4899"
            mouseReact={!isMobile}
            mouseStrength={0.3}
            brightness={isMobile ? 0.4 : 0.6}
            dpr={isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2)}
          />
        </div>
      )}

      {/* Content Layer */}
      <div className="container-max py-6 sm:py-8 md:py-12 lg:py-20 relative z-10 min-h-screen px-3 sm:px-4">
          {/* Hero Section - Split Layout */}
          <div className="mb-6 sm:mb-10 md:mb-14 lg:mb-16 grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:gap-12">
            {/* Left: Artist Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
            >
              <div className={`relative aspect-[3/4] overflow-hidden rounded-lg xs:rounded-xl border border-pink-500/20 bg-black/40 ${isMobile ? '' : 'backdrop-blur-sm'}`}>
                {/* Glitch overlay effect - disabled on mobile */}
                {!isMobile && !prefersReducedMotion && (
                  <motion.div
                    className="absolute inset-0 bg-pink-500/10 z-10"
                    animate={{
                      clipPath: [
                        "inset(0% 0% 0% 0%)",
                        "inset(10% 5% 15% 5%)",
                        "inset(0% 0% 0% 0%)",
                      ],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                    }}
                  />
                )}
                <motion.img
                  src={artistPng}
                  alt={artistName}
                  draggable={false}
                  className="relative z-10 h-full w-full object-cover"
                  style={{
                    filter: "contrast(1.1) brightness(0.95)",
                  }}
                />
                {/* Scanline effect */}
                <div className="absolute inset-0 z-20 bg-[linear-gradient(transparent_50%,rgba(236,72,153,0.03)_50%)] bg-[length:100%_4px] pointer-events-none" />
              </div>
            </motion.div>

            {/* Right: Title & Info */}
            <div className="flex flex-col justify-center space-y-4 sm:space-y-6 md:space-y-8">
              <motion.div
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.8 }}
              >
                <div className="mb-2 sm:mb-3 md:mb-4 font-mono text-[10px] xs:text-xs tracking-wider xs:tracking-widest text-pink-500/60">
                  [PROSHOW_HEADLINER]
                </div>
                <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-none tracking-tight font-mono">
                  <AnimatePresence mode="wait">
                    {showKorean ? (
                      <motion.div
                        key="korean"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="block text-pink-500"
                      >
                        {isDecryptingKorean && !prefersReducedMotion ? (
                          <DecryptText 
                            text="아우라" 
                            onComplete={handleKoreanComplete}
                            delay={500}
                            isMobile={isMobile}
                          />
                        ) : (
                          <motion.span
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            아우라
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
                        <div className="block">
                          {isDecryptingEnglish && !prefersReducedMotion ? (
                            <DecryptAOORA 
                              delay={200}
                              isMobile={isMobile}
                            />
                          ) : (
                            <>
                              <span className="text-pink-500">A</span>
                              <span className="text-white">OO</span>
                              <span className="text-pink-500">RA</span>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </h1>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { label: "DEBUT", value: "2009" },
                  { label: "GENRE", value: "K-POP" },
                  { label: "STYLE", value: "EDM" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className={`border border-white/10 bg-black/30 p-1.5 xs:p-2 sm:p-3 md:p-4 ${isMobile ? '' : 'backdrop-blur-sm'}`}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.5 + i * 0.1 }}
                    whileHover={isMobile ? {} : { borderColor: "rgba(236,72,153,0.5)", scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="font-mono text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-pink-500">{stat.value}</div>
                    <div className="mt-0.5 xs:mt-1 font-mono text-[9px] xs:text-[10px] sm:text-xs text-white/50 leading-tight">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* About Section */}
          <motion.div
            className={`mb-6 sm:mb-10 md:mb-14 lg:mb-16 border border-white/10 bg-black/40 p-3 xs:p-4 sm:p-6 md:p-8 lg:p-12 ${isMobile ? '' : 'backdrop-blur-sm'} rounded-lg xs:rounded-xl`}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.6 }}
          >
            <div className="mb-3 xs:mb-4 sm:mb-6 font-mono text-[9px] xs:text-[10px] sm:text-xs tracking-wider xs:tracking-widest text-pink-500/60">
              [ARTIST_BIO]
            </div>
            <div className="max-w-3xl">
              {isMobile || prefersReducedMotion ? (
                <p className="font-mono text-xs xs:text-sm sm:text-sm md:text-base leading-relaxed text-white/80">
                  {aboutText}
                </p>
              ) : (
                <TextType
                  as="p"
                  className="font-mono text-xs xs:text-sm sm:text-sm md:text-base leading-relaxed text-white/80"
                  text={aboutText}
                  typingSpeed={25}
                  initialDelay={1000}
                  loop={false}
                  showCursor
                  cursorClassName="text-pink-500"
                />
              )}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className={`flex flex-col items-center justify-between gap-3 xs:gap-4 sm:gap-6 border border-pink-500/30 bg-black/50 p-3 xs:p-4 sm:p-6 md:p-8 lg:p-12 ${isMobile ? '' : 'backdrop-blur-sm'} md:flex-row rounded-lg xs:rounded-xl`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.8 }}
          >
            <div className="w-full md:w-auto">
              <div className="mb-1.5 xs:mb-2 font-mono text-[9px] xs:text-[10px] sm:text-xs tracking-wider xs:tracking-widest text-pink-500/60">
                [TICKET_ACCESS]
              </div>
              <h2 className="font-display text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                Ready for the show?
              </h2>
              <p className="mt-1.5 xs:mt-2 font-mono text-xs sm:text-sm text-white/60">
                Secure your spot at the most anticipated show
              </p>
            </div>
            <motion.div
              whileHover={isMobile ? {} : { scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto"
            >
              <Link
                to="/tickets"
                className="group relative inline-block border border-pink-500 bg-pink-500/10 px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 font-mono text-xs sm:text-sm font-semibold text-white transition-all hover:bg-pink-500/20 hover:border-pink-400 active:bg-pink-500/30 touch-manipulation w-full sm:w-auto text-center rounded-lg xs:rounded-xl"
                style={{ minHeight: "44px" }}
              >
                <span className="relative z-10">BOOK_TICKETS.exe</span>
                <motion.div
                  className="absolute inset-0 bg-pink-500/20"
                  initial={{ width: "0%" }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          </motion.div>
        </div>

      {/* Floating glitch elements - disabled on mobile */}
      {!isMobile && !prefersReducedMotion && (
        <div className="pointer-events-none fixed inset-0 z-[5]">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-pink-500/20"
              style={{
                left: `${20 + i * 30}%`,
                top: `${30 + i * 20}%`,
                width: "2px",
              }}
              animate={{
                opacity: [0, 1, 0],
                height: [0, 100, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                repeatDelay: 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
