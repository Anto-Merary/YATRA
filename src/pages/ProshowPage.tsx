import { Link } from "react-router-dom";
import TextType from "@/components/TextType";
import FaultyTerminal from "@/components/FaultyTerminal";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

// NOTE: User-provided path. This file exists in the repo at dist/assets/artist.png.
import artistPng from "../../dist/assets/artist.png";

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

export function ProshowPage() {
  const artistName = "Playboi Carti";
  const [showKorean, setShowKorean] = useState(true);
  const [isDecryptingKorean, setIsDecryptingKorean] = useState(true);
  const [isDecryptingEnglish, setIsDecryptingEnglish] = useState(false);
  const aboutText =
    `Real name Jordan Terrell Carter, born Sept 13, 1995 (or '96, sources be wildin') in Atlanta, GA. Dude started spittin' bars back in 2011 as $ir Cartier, uploadin' on SoundCloud, then switched to Playboi Carti in 2013. Joined Awful Records, linked up with A$AP Rocky and AWGE/Interscope in 2016.
Blew up with his 2017 self-titled mixtape - tracks like 'Magnolia' and 'wokeuplikethis*' with Uzi were everywhere, no cap. Then Die Lit in 2018 (pure slatt vibes), Whole Lotta Red in 2020 (that one went #1 and shifted the whole sound), and this year in 2025 he dropped MUSIC which is experimental af and got a deluxe too.`;

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
      
      {/* FaultyTerminal Background - covers entire page */}
      <div className="absolute inset-0 z-0 opacity-30 w-full h-full">
        <FaultyTerminal
          scale={2}
          gridMul={[3, 2]}
          digitSize={1.2}
          timeScale={0.4}
          scanlineIntensity={0.4}
          glitchAmount={1.1}
          flickerAmount={0.8}
          noiseAmp={1.2}
          chromaticAberration={2}
          dither={true}
          curvature={0.15}
          tint="#ec4899"
          mouseReact={true}
          mouseStrength={0.3}
          brightness={0.6}
        />
      </div>

      {/* Content Layer */}
      <div className="container-max py-12 md:py-20 relative z-10 min-h-screen">
          {/* Hero Section - Split Layout */}
          <div className="mb-16 grid gap-8 md:grid-cols-2 md:gap-12">
            {/* Left: Artist Image */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-pink-500/20 bg-black/40 backdrop-blur-sm">
                {/* Glitch overlay effect */}
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
            <div className="flex flex-col justify-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <div className="mb-4 font-mono text-xs tracking-widest text-pink-500/60">
                  [PROSHOW_HEADLINER]
                </div>
                <h1 className="font-display text-6xl font-black leading-none tracking-tight md:text-7xl font-mono">
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
                        {isDecryptingKorean ? (
                          <DecryptText 
                            text="플레이보이 카티" 
                            onComplete={handleKoreanComplete}
                            delay={500}
                          />
                        ) : (
                          <motion.span
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            플레이보이 카티
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
                        <div className="block text-pink-500">
                          {isDecryptingEnglish ? (
                            <DecryptText 
                              text="PLAYBOI" 
                              delay={200}
                            />
                          ) : (
                            "PLAYBOI"
                          )}
                        </div>
                        <div className="block text-white mt-2">
                          {isDecryptingEnglish ? (
                            <DecryptText 
                              text="CARTI" 
                              delay={800}
                            />
                          ) : (
                            "CARTI"
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </h1>
              </motion.div>

              {/* Stats Grid */}
              <motion.div
                className="grid grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {[
                  { label: "ALBUMS", value: "4" },
                  { label: "BILLBOARD", value: "#67" },
                  { label: "GENRE", value: "RAP" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="border border-white/10 bg-black/30 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ borderColor: "rgba(236,72,153,0.5)", scale: 1.05 }}
                  >
                    <div className="font-mono text-2xl font-bold text-pink-500">{stat.value}</div>
                    <div className="mt-1 font-mono text-xs text-white/50">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* About Section */}
          <motion.div
            className="mb-16 border border-white/10 bg-black/40 p-8 backdrop-blur-sm md:p-12"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="mb-6 font-mono text-xs tracking-widest text-pink-500/60">
              [ARTIST_BIO]
            </div>
            <div className="max-w-3xl">
              <TextType
                as="p"
                className="font-mono text-sm leading-relaxed text-white/80 md:text-base"
                text={aboutText}
                typingSpeed={25}
                initialDelay={1000}
                loop={false}
                showCursor
                cursorClassName="text-pink-500"
              />
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="flex flex-col items-center justify-between gap-6 border border-pink-500/30 bg-black/50 p-8 backdrop-blur-sm md:flex-row md:p-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div>
              <div className="mb-2 font-mono text-xs tracking-widest text-pink-500/60">
                [TICKET_ACCESS]
              </div>
              <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
                <span className="text-pink-400">준비되셨나요?</span> Ready for the show?
              </h2>
              <p className="mt-2 font-mono text-sm text-white/60">
                <span className="text-pink-300/80">공연</span> 티켓을 예약하세요 • Secure your spot at the most anticipated <span className="text-pink-300/80">공연</span>
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/tickets"
                className="group relative inline-block border border-pink-500 bg-pink-500/10 px-8 py-4 font-mono text-sm font-semibold text-white transition-all hover:bg-pink-500/20 hover:border-pink-400"
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

      {/* Floating glitch elements */}
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
    </div>
  );
}
