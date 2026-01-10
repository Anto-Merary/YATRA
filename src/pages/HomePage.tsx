import { GuestReveal } from "../components/GuestReveal";
import { NoiseOverlay } from "../components/NoiseOverlay";
import { RevealOnScroll } from "../components/RevealOnScroll";
import { ThreeLogo } from "../components/ThreeLogo";
import { Navbar } from "../components/Navbar";
import { AkiraText } from "../components/AkiraText";
import yatraVideo from "../assets/video.mp4?url";
import ritLogo from "../assets/RIT WHITE LOGO.png";
import { motion } from "framer-motion";

export function HomePage() {
  return (
    <div>
      <section className="relative h-[92vh] min-h-[500px] sm:min-h-[600px] md:min-h-[680px] overflow-hidden">
        {/* Drop shadow on top - prominent gradient */}
        <div className="absolute top-0 left-0 right-0 h-40 sm:h-60 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-80 video-grain"
          style={{
            objectFit: "cover",
            minWidth: "100%",
            minHeight: "100%",
            width: "100%",
            height: "100%",
          }}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={yatraVideo}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/55 to-black" />
        <div className="video-grain-overlay absolute inset-0 pointer-events-none" />
        <NoiseOverlay opacity={0.4} />
        <Navbar variant="absolute" />

        <div className="container-max relative flex h-full items-center justify-center px-3 sm:px-4">
          <div className="flex flex-col items-center justify-center text-center w-full">
            <div className="text-[9px] xs:text-[10px] sm:text-xs font-semibold tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-white/70 my-4 sm:my-6 md:my-[33px] px-2">
              RAJALAKSHMI INSTITUTE OF TECHNOLOGY
            </div>

            <div className="mt-4 sm:mt-6 md:mt-10 w-full flex justify-center items-center">
              <div className="flex justify-center items-center">
                <ThreeLogo />
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-16 sm:bottom-4 left-0 right-0 flex justify-center pb-2 sm:pb-4 md:pb-8 px-4">
          <div className="text-[9px] xs:text-[10px] sm:text-xs text-white/60 text-center px-2">Touch &amp; drag the 3D logo to interact.</div>
        </div>
      </section>

      <section className="relative py-8 sm:py-12 md:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/40" />
        <div className="video-grain-overlay absolute inset-0 pointer-events-none opacity-30" />
        <div className="container-max relative z-10 px-3 sm:px-4">
          <RevealOnScroll>
            <div className="relative flex flex-col items-center space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
              {/* RIT Logo Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="relative flex items-center justify-center px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-full bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 border border-white/20 shadow-2xl backdrop-blur-md"
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 via-white/15 to-white/10 opacity-60" />
                  <img
                    src={ritLogo}
                    alt="RIT Logo"
                    className="relative z-10 h-10 sm:h-12 md:h-14 w-auto object-contain filter brightness-0 invert opacity-95"
                    draggable={false}
                  />
                </motion.div>
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -inset-2 bg-gradient-to-r from-yatra-400/30 via-yatra-500/40 to-yatra-400/30 rounded-full blur-2xl"
                />
              </motion.div>

              {/* Motto */}
              <div className="flex flex-col items-center px-4">
                <AkiraText
                  words={[
                    { text: "ABOUT", variant: "outline-only" },
                    { text: "RIT", variant: "glow" },
                  ]}
                  animationDelay={0.2}
                />
              </div>

              {/* About RIT */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full max-w-4xl mt-4 sm:mt-6 px-4"
              >
                <p className="text-white/90 leading-relaxed text-sm sm:text-base md:text-lg" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                  Rajalakshmi Institute of Technology is one of the best engineering colleges in Chennai and is part of Rajalakshmi Institutions, which has been synonymous with providing excellence in higher education to students for many years. Rajalakshmi Institute of Technology was established in 2008 and is affiliated with Anna University Chennai. Ours is one among the few Colleges to receive accreditation for Under Graduate Engineering programmes from the National Board of Accreditation (NBA), New Delhi, as soon as attaining the eligibility to apply for accreditation. The College is accredited by the National Assessment and Accreditation Council (NAAC) with &apos;A++&apos; Grade.
                </p>
              </motion.div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <RevealOnScroll>
        <GuestReveal
          guestName="To Be Revealed"
          description="Guest image will appear on the left when you provide a PNG. Until then, we show a silhouette placeholder and a countdown bar."
          revealAt={new Date("2026-01-15T00:00:00")}
        />
      </RevealOnScroll>
    </div>
  );
}


