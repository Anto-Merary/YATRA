import { NoiseOverlay } from "../components/NoiseOverlay";
import { RevealOnScroll } from "../components/RevealOnScroll";
import { ThreeLogo } from "../components/ThreeLogo";
import { Navbar } from "../components/Navbar";
import { AkiraText } from "../components/AkiraText";
import { Button } from "../components/ui/button";
import { RainbowButton } from "../components/ui/rainbow-button";
import { Link } from "react-router-dom";
import yatraVideo from "../assets/video.mp4?url";
import ritLogo from "../assets/RIT WHITE LOGO.png";
import artistPng from "../assets/artist.png?url";
import TiltedCard from "../components/TiltedCard";
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

            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center z-20 relative">
               <Link to="/tickets">
                  <RainbowButton 
                    size="lg" 
                    className="min-w-[160px] font-bold text-lg transition-all duration-300 font-display"
                    style={{
                      "--color-1": "#ec4899",
                      "--color-2": "#ec4899",
                      "--color-3": "#ec4899",
                      "--color-4": "#ec4899",
                      "--color-5": "#ec4899",
                    } as React.CSSProperties}
                  >
                    Buy Tickets
                  </RainbowButton>
               </Link>
               <Link to="/events">
                  <RainbowButton 
                    size="lg" 
                    className="min-w-[160px] font-bold text-lg transition-all duration-300 font-display"
                    style={{
                      "--color-1": "#ec4899",
                      "--color-2": "#ec4899",
                      "--color-3": "#ec4899",
                      "--color-4": "#ec4899",
                      "--color-5": "#ec4899",
                    } as React.CSSProperties}
                  >
                    Register Events
                  </RainbowButton>
               </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-16 sm:bottom-4 left-0 right-0 flex justify-center pb-2 sm:pb-4 md:pb-8 px-4">
          <div className="text-[9px] xs:text-[10px] sm:text-xs text-white/60 text-center px-2">Touch & drag the 3D logo to interact.</div>
        </div>
      </section>

      {/* About YATRA Section */}
      <section className="relative py-12 sm:py-16 md:py-24 overflow-hidden">
        <div className="container-max relative z-10 px-4 sm:px-6">
          <RevealOnScroll>
            <div className="flex flex-col items-center justify-center space-y-8 sm:space-y-12">
               <div className="flex flex-col items-center">
                 <AkiraText
                    words={[
                      { text: "ABOUT", variant: "outline-only" },
                      { text: "YATRA", variant: "glow" },
                    ]}
                    animationDelay={0.2}
                 />
               </div>

               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8, delay: 0.4 }}
                 className="w-full max-w-4xl px-4 text-center"
               >
                 <p className="text-white/90 leading-relaxed text-sm sm:text-base md:text-lg" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                   Yatra'26 is a grand intercollege cultural fest at Rajalakshmi Institute of Technology organized by the student community with the support of Faculties, Principal and Management. Main motive of Yatra is involving or concerning the enthusiasm among students with a deep sense of humor which is also a part of Cultural heritage. This enhances the confidence level of the students thereby allowing them to perform better. In fact, students can also leverage the advantage of participating in various activities. Many chief guests are being invited to join us.
                 </p>
               </motion.div>
            </div>
          </RevealOnScroll>
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
                  Rajalakshmi Institute of Technology is one of the best engineering colleges in Chennai and is part of Rajalakshmi Institutions, which has been synonymous with providing excellence in higher education to students for many years. Rajalakshmi Institute of Technology was established in 2008 and is affiliated with Anna University Chennai. Ours is one among the few Colleges to receive accreditation for Under Graduate Engineering programmes from the National Board of Accreditation (NBA), New Delhi, as soon as attaining the eligibility to apply for accreditation. The College is accredited by the National Assessment and Accreditation Council (NAAC) with 'A++' Grade.
                </p>
              </motion.div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <RevealOnScroll>
        <div className="flex flex-col items-center justify-center py-10 sm:py-20 px-4 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
             
             <div className="mb-8 sm:mb-12 flex flex-col items-center z-10 w-full">
                <AkiraText
                  words={[
                    { text: "PRO", variant: "outline-only" },
                    { text: "SHOWS", variant: "glow" },
                  ]}
                  animationDelay={0.2}
                />
              </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 z-10 w-full max-w-6xl">
                {/* Text Content - Left Side */}
                <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6 order-2 lg:order-1 px-4">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-2">AOORA</h2>
                        <h3 className="text-xl sm:text-2xl text-pink-500 font-mono tracking-widest mb-6">LIVE IN CONCERT</h3>
                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-sans mb-8">
                            Get ready for an electrifying performance by the K-Pop sensation AOORA! Known for his unique blend of energetic EDM and pop, he's set to light up the stage with his neon-fueled fashion and high-octane performance. Don't miss this chance to witness the "Indo-Korean" genre pioneer live at YATRA '26!
                        </p>
                         <Link to="/proshow">
                            <RainbowButton 
                                size="lg" 
                                className="min-w-[180px] font-bold text-lg transition-all duration-300 font-display"
                                style={{
                                "--color-1": "#ec4899",
                                "--color-2": "#ec4899",
                                "--color-3": "#ec4899",
                                "--color-4": "#ec4899",
                                "--color-5": "#ec4899",
                                } as React.CSSProperties}
                            >
                                VIEW DETAILS
                            </RainbowButton>
                        </Link>
                    </motion.div>
                </div>

                {/* Tilted Card - Right Side */}
                <div className="w-full lg:w-1/2 flex justify-center lg:justify-end order-1 lg:order-2">
                    <Link to="/proshow" className="cursor-pointer group relative block transform transition-transform hover:scale-105 duration-500">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-violet-500 rounded-[20px] blur opacity-30 group-hover:opacity-100 transition duration-500" />
                            <div className="relative bg-black rounded-[20px] p-1">
                                <TiltedCard
                                    imageSrc={artistPng}
                                    altText="Pro Show Artist AOORA"
                                    captionText="AOORA - LIVE IN CONCERT"
                                    containerHeight="500px"
                                    containerWidth="350px"
                                    imageHeight="500px"
                                    imageWidth="350px"
                                    rotateAmplitude={12}
                                    scaleOnHover={1.05}
                                    showMobileWarning={false}
                                    showTooltip={true}
                                    displayOverlayContent={true}
                                    overlayContent={
                                        <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black via-black/20 to-transparent">
                                            <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                                <div className="inline-block border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold text-white/90">
                                                    CLICK TO VIEW
                                                </div>
                                            </div>
                                        </div>
                                    }
                                />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}
