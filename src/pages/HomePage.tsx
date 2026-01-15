import { NoiseOverlay } from "../components/NoiseOverlay";
import { RevealOnScroll } from "../components/RevealOnScroll";
import { ScrollReveal } from "../components/ScrollReveal";
import { ThreeLogo } from "../components/ThreeLogo";
import { Navbar } from "../components/Navbar";
import { AkiraText } from "../components/AkiraText";
import { RainbowButton } from "../components/ui/rainbow-button";
import { SpotlightCard } from "../components/SpotlightCard";
import GridMotion from "../components/GridMotion";
import LightRays from "../components/LightRays";
import { ParallaxText } from "../components/text-marquee";
import { Meteors } from "../components/ui/meteors";
import { TextHoverEffect } from "../components/ui/text-hover-effect";
import { ModernCard } from "../components/ModernCard";
import { Link, useLocation } from "react-router-dom";
import yatraVideo from "../assets/video.mp4?url";
import artistPng from "../assets/artist.png?url";
import TiltedCard from "../components/TiltedCard";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { EVENTS } from "../data/events";
import { ChevronDown } from "lucide-react";
import ColorBends from "@/components/ColorBends";
import { useMobile } from "../hooks/use-mobile";
import { useRouteTransition } from "../components/RouteTransitionContext";

const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

// Animated counter component for stats
function AnimatedCounter({ end, duration = 2 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let startTime: number | null = null;
            const animate = (currentTime: number) => {
              if (!startTime) startTime = currentTime;
              const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
              const easeOutQuart = 1 - Math.pow(1 - progress, 4);
              setCount(Math.floor(easeOutQuart * end));
              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCount(end);
              }
            };
            requestAnimationFrame(animate);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}</span>;
}

function ScrollInOut({
  children,
  className,
  offsetY = 28,
  offsetX = 0,
  duration = 0.9,
  delay = 0,
  blur = 8,
  scale = 0.985,
  rotate = 0,
  staggerChildren = 0,
  delayChildren = 0,
}: {
  children: React.ReactNode;
  className?: string;
  offsetY?: number;
  offsetX?: number;
  duration?: number;
  delay?: number;
  blur?: number;
  scale?: number;
  rotate?: number;
  staggerChildren?: number;
  delayChildren?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.35 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: {
          opacity: 0,
          x: offsetX,
          y: offsetY,
          scale,
          rotate,
          filter: `blur(${blur}px)`,
        },
        show: {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotate: 0,
          filter: "blur(0px)",
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      transition={{
        duration,
        ease: EASE_IN_OUT,
        delay,
        opacity: { duration: Math.max(0.3, duration * 0.9) },
        filter: { duration: Math.max(0.3, duration * 0.9) },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HomePage() {
  const location = useLocation();
  const { isMobile } = useMobile();
  const { isTransitioning } = useRouteTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Parallax effect for video
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Scroll-based motion for ColorBends background block
  const { scrollY } = useScroll();
  const colorBendsY = useTransform(scrollY, [200, 1600], [0, 120]);
  const colorBendsOpacity = useTransform(scrollY, [200, 900], [0.42, 0.52]);

  // Get featured events (first 4 events)
  const featuredEvents = EVENTS.slice(0, 4);

  const fadeUpItem = {
    hidden: { opacity: 0, y: 22, scale: 0.97, filter: "blur(7px)" },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.85, ease: EASE_IN_OUT },
    },
  } as const;

  // Gallery images
  const galleryImages = Object.values(
    import.meta.glob('../assets/Gallery/*.{jpg,jpeg,png}', { 
      eager: true, 
      query: '?url', 
      import: 'default' 
    })
  ) as string[];

  // GridMotion items - repeat images to fill the grid
  const gridMotionItems = Array(2) // Reduced multiplier since we have more images now
    .fill(galleryImages)
    .flat()
    .slice(0, 28);

  // Force video to play when component mounts or when navigating back to home
  useEffect(() => {
    const initializeVideo = () => {
      const video = videoRef.current;
      if (video) {
        // Reset video to beginning if it's not already at the start
        if (video.currentTime > 0.5) {
          video.currentTime = 0;
        }
        
        // Ensure video is playing
        if (video.paused || video.readyState < 2) {
          const playPromise = video.play();
          
          // Handle play promise (browsers may require user interaction)
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                // Video is playing successfully
              })
              .catch((error) => {
                // Auto-play was prevented, try again after a short delay
                setTimeout(() => {
                  video.play().catch(() => {
                    // Silent fail - video will play when user interacts
                  });
                }, 100);
              });
          }
        }
      }
    };

    // Wait a bit for page transition to start, then initialize
    const timer1 = setTimeout(initializeVideo, 50);
    const timer2 = setTimeout(initializeVideo, 200);
    const timer3 = setTimeout(initializeVideo, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.key]); // Use location.key which changes on every navigation

  return (
    <div key={`home-page-${location.key}`} className="relative min-h-screen w-full overflow-hidden">
      {/* Enhanced Hero Section with Parallax */}
      <section ref={heroRef} className="relative h-[92vh] min-h-[500px] sm:min-h-[600px] md:min-h-[680px] overflow-hidden z-10">
        {/* Drop shadow on top - prominent gradient */}
        <div className="absolute top-0 left-0 right-0 h-40 sm:h-60 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
        
        {/* Parallax Video Background */}
        <motion.div
          style={{ y: videoY, opacity }}
          className="absolute inset-0"
        >
          <video
            ref={videoRef}
            key={`home-video-${location.key}`}
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
        </motion.div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/55 to-black" />
        <div className="video-grain-overlay absolute inset-0 pointer-events-none" />
        <NoiseOverlay opacity={0.4} />
        <Navbar variant="absolute" />
        
        {/* LightRays Effect behind 3D Logo */}
        <div className="absolute inset-0 z-20 pointer-events-none opacity-60 mix-blend-screen">
          <LightRays 
            raysOrigin="center" 
            raysColor="#d946ef" 
            raysSpeed={0.4} 
            lightSpread={0.6}
            rayLength={1.5}
            fadeDistance={1.2}
          />
        </div>

        <div className="container-max relative flex h-full items-center justify-center px-3 sm:px-4 z-30">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 1.15, delay: 0.2, ease: EASE_IN_OUT }}
            className="flex flex-col items-center justify-center text-center w-full"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: EASE_IN_OUT }}
              className="text-[9px] xs:text-[10px] sm:text-xs font-semibold tracking-[0.2em] xs:tracking-[0.3em] sm:tracking-[0.4em] text-white/70 my-4 sm:my-6 md:my-[33px] px-2"
            >
              RAJALAKSHMI INSTITUTE OF TECHNOLOGY
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 1.15, delay: 0.4, ease: EASE_IN_OUT }}
              className="mt-4 sm:mt-6 md:mt-10 w-full flex justify-center items-center"
            >
              <div className="flex justify-center items-center" key={`three-logo-${location.key}`}>
                {!isTransitioning && <ThreeLogo />}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 1.15, delay: 0.6, ease: EASE_IN_OUT }}
              className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center z-20 relative"
            >
               <Link to="/tickets">
                  <RainbowButton 
                    size="lg" 
                    className="min-w-[160px] font-bold text-lg transition-all duration-300 font-display hover:scale-105"
                    style={{
                      "--color-1": "#ec4899",
                      "--color-2": "#ec4899",
                      "--color-3": "#ec4899",
                      "--color-4": "#ec4899",
                      "--color-5": "#ec4899",
                    } as CSSProperties}
                  >
                    Buy Tickets
                  </RainbowButton>
               </Link>
               <Link to="/events">
                  <RainbowButton 
                    size="lg" 
                    className="min-w-[160px] font-bold text-lg transition-all duration-300 font-display hover:scale-105"
                    style={{
                      "--color-1": "#ec4899",
                      "--color-2": "#ec4899",
                      "--color-3": "#ec4899",
                      "--color-4": "#ec4899",
                      "--color-5": "#ec4899",
                    } as CSSProperties}
                  >
                    Register Events
                  </RainbowButton>
               </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 1.35, duration: 0.9, ease: EASE_IN_OUT }}
          className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/60 text-xs font-medium"
          >
            Scroll to explore
          </motion.div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/60" />
          </motion.div>
        </motion.div>
        
        <div className="absolute bottom-16 sm:bottom-4 left-0 right-0 flex justify-center pb-2 sm:pb-4 md:pb-8 px-4 pointer-events-none">
          <div className="text-[9px] xs:text-[10px] sm:text-xs text-white/60 text-center px-2">Touch & drag the 3D logo to interact.</div>
        </div>
      </section>

      {/* Dynamic Marquee Section */}
      <ScrollInOut offsetY={14} blur={4}>
        <div className="relative z-20 bg-black/80 py-4 border-y border-white/10 backdrop-blur-sm">
          <ParallaxText 
            speed={30}
            className="text-2xl sm:text-3xl md:text-4xl font-akira uppercase tracking-wider text-white"
          >
            YATRA '26 • FEB 14-15 • 
          </ParallaxText>
        </div>
      </ScrollInOut>

      {/* About → Stats → Featured (with ColorBends background) */}
      <div className="relative overflow-hidden">
        {!isTransitioning && (
          <motion.div
            className="absolute inset-0 z-0 mix-blend-screen pointer-events-none"
            style={{ y: colorBendsY, opacity: colorBendsOpacity }}
          >
            <ColorBends
              className="w-full h-full"
              style={{ pointerEvents: "none" }}
              colors={["#ff2aa6", "#ff4fc3", "#ec4899", "#ff77d6"]}
              rotation={0}
              autoRotate={0}
              speed={0.2}
              scale={1}
              frequency={1}
              warpStrength={1}
              mouseInfluence={1}
              parallax={0.5}
              noise={0.1}
              listenOnWindow
              maxPixelRatio={isMobile ? 1 : 1.5}
              transparent
            />
          </motion.div>
        )}

        {/* Darken the shader slightly for readability (without killing it) */}
        <div className="absolute inset-0 z-[1] bg-black/35 pointer-events-none" />

        {/* About YATRA & RIT Section */}
        <section className="relative z-10 py-12 sm:py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent" />
          <div className="container-max relative z-10 px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
              {/* About Yatra */}
              <ScrollInOut className="flex flex-col items-center text-center space-y-8" offsetY={34}>
                <div className="flex flex-col items-center">
                  <AkiraText
                    words={[
                      { text: "ABOUT", variant: "outline-only" },
                      { text: "YATRA", variant: "glow" },
                    ]}
                    animationDelay={0.2}
                  />
                </div>

                <div className="w-full flex justify-center">
                  <ModernCard title="">
                    <p className="leading-relaxed text-sm sm:text-base md:text-lg text-justify">
                      Yatra'26 is a grand intercollege cultural fest at Rajalakshmi Institute of Technology organized by the student community with the support of Faculties, Principal and Management. Main motive of Yatra is involving or concerning the enthusiasm among students with a deep sense of humor which is also a part of Cultural heritage. This enhances the confidence level of the students thereby allowing them to perform better. In fact, students can also leverage the advantage of participating in various activities. Many chief guests are being invited to join us.
                    </p>
                  </ModernCard>
                </div>
              </ScrollInOut>

              {/* About RIT */}
              <ScrollInOut className="flex flex-col items-center space-y-8 h-full" offsetY={34} delay={0.08}>
                <div className="flex flex-col items-center">
                  <AkiraText
                    words={[
                      { text: "ABOUT", variant: "outline-only" },
                      { text: "RIT", variant: "glow" },
                    ]}
                    animationDelay={0.4}
                  />
                </div>

                <div className="w-full flex justify-center">
                  <ModernCard title="">
                    <p className="leading-relaxed text-sm sm:text-base md:text-lg text-justify">
                      Rajalakshmi Institute of Technology is one of the best engineering colleges in Chennai and is part of Rajalakshmi Institutions, which has been synonymous with providing excellence in higher education to students for many years. Rajalakshmi Institute of Technology was established in 2008 and is affiliated with Anna University Chennai. Ours is one among the few Colleges to receive accreditation for Under Graduate Engineering programmes from the National Board of Accreditation (NBA), New Delhi, as soon as attaining the eligibility to apply for accreditation. The College is accredited by the National Assessment and Accreditation Council (NAAC) with 'A++' Grade.
                    </p>
                  </ModernCard>
                </div>
              </ScrollInOut>
            </div>
          </div>
        </section>

        {/* Stats/Highlights Section */}
        <section className="relative z-10 py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="video-grain-overlay absolute inset-0 pointer-events-none opacity-20" />
          <div className="container-max relative z-10 px-4 sm:px-6">
            <ScrollInOut offsetY={26} staggerChildren={0.12} delayChildren={0.12}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
                {[
                  { label: "Events", value: EVENTS.length, suffix: "+" },
                  { label: "Days", value: 2, suffix: "" },
                  { label: "Categories", value: 15, suffix: "+" },
                ].map((stat) => (
                  <motion.div key={stat.label} variants={fadeUpItem}>
                    <SpotlightCard className="text-center p-6 sm:p-8 border-gradient">
                      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-pink-500 mb-2 font-display">
                        <AnimatedCounter end={stat.value} />
                        {stat.suffix}
                      </div>
                      <div className="text-white/70 text-xs sm:text-sm md:text-base font-medium">
                        {stat.label}
                      </div>
                    </SpotlightCard>
                  </motion.div>
                ))}
              </div>
            </ScrollInOut>
          </div>
        </section>

        {/* Featured Events Preview Section */}
        <section className="relative z-10 py-12 sm:py-16 md:py-20 overflow-hidden">
          <div className="container-max relative z-10 px-4 sm:px-6">
            <div className="flex flex-col items-center space-y-8 sm:space-y-12">
              <ScrollInOut offsetY={22}>
                <div className="flex flex-col items-center">
                  <AkiraText
                    words={[
                      { text: "FEATURED", variant: "outline-only" },
                      { text: "EVENTS", variant: "glow" },
                    ]}
                    animationDelay={0.2}
                  />
                </div>
              </ScrollInOut>

              <ScrollInOut className="w-full" offsetY={26} delay={0.08} staggerChildren={0.1} delayChildren={0.12}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {featuredEvents.map((event) => (
                    <motion.div key={event.id} variants={fadeUpItem}>
                      <Link to={`/events/${event.id}`}>
                        <SpotlightCard className="h-full cursor-pointer group hover:scale-105 transition-transform duration-300">
                          <div className="flex flex-col h-full">
                            <div className="flex-1 mb-4">
                              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-display line-clamp-2">
                                {event.name}
                              </h3>
                              <div className="flex items-center gap-2 mb-3">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    event.day === "day1"
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                  }`}
                                >
                                  {event.day === "day1" ? "Day 1" : "Day 2"}
                                </span>
                                <span className="text-xs text-white/60">
                                  {event.participation === "solo" ? "Solo" : "Group"}
                                </span>
                              </div>
                              <p className="text-white/70 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                                {event.description}
                              </p>
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/10">
                              <span className="text-pink-500 text-sm font-medium group-hover:text-pink-400 transition-colors">
                                View Details →
                              </span>
                            </div>
                          </div>
                        </SpotlightCard>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </ScrollInOut>

              <ScrollInOut offsetY={18} delay={0.1}>
                <Link to="/events">
                  <RainbowButton 
                    size="lg" 
                    className="min-w-[200px] font-bold text-base transition-all duration-300 font-display hover:scale-105"
                    style={{
                      "--color-1": "#ec4899",
                      "--color-2": "#ec4899",
                      "--color-3": "#ec4899",
                      "--color-4": "#ec4899",
                      "--color-5": "#ec4899",
                    } as CSSProperties}
                  >
                    View All Events
                  </RainbowButton>
                </Link>
              </ScrollInOut>
            </div>
          </div>
        </section>

        {/* Proshow Section (kept within ColorBends background for seamless look) */}
        <section className="relative z-10">
          <ScrollInOut offsetY={36} blur={10} duration={1.05}>
            <div className="flex flex-col items-center justify-center py-10 sm:py-20 px-4 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="mb-8 sm:mb-12 flex flex-col items-center z-10 w-full h-[150px] sm:h-[200px]">
                <TextHoverEffect text="PROSHOWS" />
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 z-10 w-full max-w-6xl">
                {/* Text Content - Left Side */}
                <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6 order-2 lg:order-1 px-4">
                  <div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-2">
                      AOORA
                    </h2>
                    <h3 className="text-xl sm:text-2xl text-pink-500 font-mono tracking-widest mb-6">
                      LIVE IN CONCERT
                    </h3>
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
                        } as CSSProperties}
                      >
                        VIEW DETAILS
                      </RainbowButton>
                    </Link>
                  </div>
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
          </ScrollInOut>
        </section>
      </div>

      {/* Gallery Preview Section (Moments of Yatra) - kept last */}
      <ScrollInOut offsetY={42} blur={10} duration={1.05}>
        <section className="relative h-screen w-full overflow-hidden bg-black">
          <div className="absolute top-10 left-0 right-0 z-30 flex flex-col items-center pointer-events-none">
            <div className="bg-black/30 backdrop-blur-sm px-6 py-2 rounded-xl">
              <h2 className="text-4xl sm:text-5xl md:text-6xl text-white text-center font-akira">
                MOMENTS OF YATRA
              </h2>
            </div>
          </div>
          <div className="h-full w-full">
            <GridMotion items={gridMotionItems} />
          </div>
        </section>
      </ScrollInOut>
    </div>
  );
}
