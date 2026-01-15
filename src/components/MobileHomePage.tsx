import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';
import '../mobile/components/Hero.css';

// Import assets from src/mobile/assets
import heroBg from '../mobile/assets/herobg.jpg';
import yatraText from '../mobile/assets/yatratxt.png';
import torriGate from '../mobile/assets/torrigate.png';
import yearText from '../mobile/assets/2026txt.png';
import videoSrc from '../mobile/assets/video.mp4';
import purpleBg from '../mobile/assets/purple.jpeg'; // Used in CSS, but imported here just in case or if I need to inline it? No, CSS handles it. Wait, CSS uses relative paths.
import eventImage from '../mobile/assets/event.jpeg';
import performanceImage from '../mobile/assets/performance.jpeg';
import artistPng from '../assets/artist.png?url';

// Import components for PRO SHOW section
import { TextHoverEffect } from './ui/text-hover-effect';
import { RainbowButton } from './ui/rainbow-button';
import TiltedCard from './TiltedCard';

// Helper for dynamic imports of gallery images
const galleryModules = import.meta.glob('../mobile/assets/gal/*.{jpg,jpeg,png,webp,gif}', {
  eager: true,
  import: 'default',
});

interface GlitchTextProps {
  koreanText?: string;
  englishText: string;
  className?: string;
  delay?: number;
  shouldStart?: boolean;
  variant?: 'glitch' | 'blur';
}

function GlitchText({ koreanText, englishText, className = '', delay = 0, shouldStart = false, variant = 'glitch' }: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);

  useEffect(() => {
    let glitchTimer = 0;
    let transitionTimer = 0;

    // When the section leaves view, reset so the effect can replay next time.
    if (!shouldStart) {
      setIsGlitching(false);
      setShowEnglish(false);
      return () => {
        if (glitchTimer) clearTimeout(glitchTimer);
        if (transitionTimer) clearTimeout(transitionTimer);
      };
    }

    if (variant === 'glitch') {
      // Start glitch effect after delay
      glitchTimer = window.setTimeout(() => {
        setIsGlitching(true);
      }, 1000 + delay);

      // Transition to English after glitch
      transitionTimer = window.setTimeout(() => {
        setShowEnglish(true);
        setIsGlitching(false);
      }, 2500 + delay);
    } else {
      // Blur-only crossfade (no glitch)
      transitionTimer = window.setTimeout(() => {
        setShowEnglish(true);
        setIsGlitching(false);
      }, 900 + delay);
    }

    return () => {
      clearTimeout(glitchTimer);
      clearTimeout(transitionTimer);
    };
  }, [delay, shouldStart, variant]);

  return (
    <span
      className={`glitch-text-wrapper ${variant === 'blur' ? 'glitch-text-wrapper--blur' : ''} ${className} ${isGlitching ? 'is-glitching' : ''} ${showEnglish ? 'show-english' : ''}`}
    >
      {koreanText && (
        <span className="glitch-text-korean">{koreanText}</span>
      )}
      <span className="glitch-text-english">{englishText}</span>
    </span>
  );
}

export function MobileHomePage() {
  const navigate = useNavigate();
  // Single global loader (App-level) handles loading UI.
  // Keep internal preloading logic non-blocking (no overlay + no hidden stage).
  const TOTAL_IMAGES = 0;
  const doneKeysRef = useRef(new Set<string>());
  const [doneCount, setDoneCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isScrollReady, setIsScrollReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const aboutTitleRef = useRef<HTMLHeadingElement>(null);
  const aboutContentRef = useRef<HTMLParagraphElement>(null);
  const featuresSectionRef = useRef<HTMLElement>(null);
  const proshowSectionRef = useRef<HTMLElement>(null);
  const blastSectionRef = useRef<HTMLElement>(null);
  const blastCollageRef = useRef<HTMLDivElement>(null);
  const blastPhotoElsRef = useRef<(HTMLImageElement | null)[]>([]);
  const [aboutStep, setAboutStep] = useState(0); // 0 = ABOUT RIT, 1 = ABOUT YATRA'26
  const hasAboutEnteredRef = useRef(false);
  const [isFeaturesSectionVisible, setIsFeaturesSectionVisible] = useState(false);
  const [isProshowSectionVisible, setIsProshowSectionVisible] = useState(false);
  const [isBlastSectionVisible, setIsBlastSectionVisible] = useState(false);

  const blastImages = useMemo(() => {
    const srcs = Object.keys(galleryModules)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => galleryModules[k] as string);

    // Never reuse a photo. If fewer than 6 exist, we render fewer than 6.
    return srcs.slice(0, 6);
  }, []);

  // Lantern (lamp) glow hotspots placed over the background art.
  const lamps = useMemo(
    () => [
      { id: 'lamp-0', x: 4.5, y: 18.2 },
      { id: 'lamp-1', x: 16.0, y: 20.1 },
      { id: 'lamp-2', x: 30.2, y: 19.4 },
      { id: 'lamp-3', x: 44.2, y: 20.0 },
      { id: 'lamp-4', x: 58.0, y: 20.1 },
      { id: 'lamp-5', x: 71.6, y: 20.4 },
      { id: 'lamp-6', x: 85.0, y: 20.0 },
      { id: 'lamp-7', x: 96.0, y: 18.6 },
    ],
    []
  );

  // Incrementing "sequence" values let us re-trigger a one-shot CSS animation per lamp.
  const [lampSeq, setLampSeq] = useState<{ [key: string]: number }>(() => 
    Object.fromEntries(lamps.map((l) => [l.id, 0]))
  );

  const markDone = useCallback((key: string) => {
    if (doneKeysRef.current.has(key)) return;
    doneKeysRef.current.add(key);
    setDoneCount((c) => c + 1);
  }, []);

  const img = useMemo(() => {
    const make = (key: string) => ({
      ref: (node: HTMLImageElement | null) => {
        // If the image is already in cache, `onLoad` may not fire reliably across all cases.
        if (node && node.complete) markDone(key);
      },
      onLoad: () => markDone(key),
      onError: () => markDone(key),
    });

    return {
      bleedBg: make('bleed-bg'),
      bg: make('bg'),
      year: make('year'),
      yatra: make('yatra'),
      torii: make('torii'),
    };
  }, [markDone]);

  const isLoading = doneCount < TOTAL_IMAGES;

  // Safety timeout to ensure loader doesn't stick forever
  // This is critical for animations to start if an image fails to load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (doneCount < TOTAL_IMAGES) {
        setDoneCount(TOTAL_IMAGES);
      }
    }, 3500);
    return () => clearTimeout(timer);
  }, [doneCount]);

  // Trigger entrance animations exactly once, right after we finish loading.
  useEffect(() => {
    if (hasLoaded || isLoading) return;

    // Start animations AFTER the loader finishes fading out,
    // so the motion is visible (not hidden behind the overlay).
    const t = window.setTimeout(() => setHasLoaded(true), 260);
    return () => window.clearTimeout(t);
  }, [hasLoaded, isLoading]);

  // After the entrance animation finishes, enable the scroll-based "settle" transforms.
  useEffect(() => {
    if (!hasLoaded) return;
    const t = window.setTimeout(() => setIsScrollReady(true), 1200);
    return () => window.clearTimeout(t);
  }, [hasLoaded]);

  const runAboutReveal = useCallback(() => {
    // Wait for React to finish mounting new elements when step changes
    const attemptReveal = (attempts = 0) => {
      const titleEl = aboutTitleRef.current;
      const contentEl = aboutContentRef.current;
      
      if (!titleEl || !contentEl) {
        // If elements aren't ready yet, try again (max 5 attempts)
        if (attempts < 5) {
          window.requestAnimationFrame(() => attemptReveal(attempts + 1));
        }
        return;
      }

      // Reset classes so we can replay the reveal on step change.
      titleEl.classList.remove('is-visible', 'is-exiting');
      contentEl.classList.remove('is-visible', 'is-exiting');

      // Wait one more frame to ensure classes are reset, then start reveal
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          titleEl.classList.add('is-visible');
          window.setTimeout(() => contentEl.classList.add('is-visible'), 180);
        });
      });
    };

    attemptReveal();
  }, []);

  // About section: reveal when it enters view (and remember it's been seen).
  useEffect(() => {
    const sectionEl = aboutRef.current;
    if (!sectionEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        hasAboutEnteredRef.current = true;
        runAboutReveal();
        observer.disconnect();
      },
      { threshold: 0.28, rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(sectionEl);
    return () => {
      observer.disconnect();
    };
  }, [runAboutReveal]);

  // Features section: trigger glitch animation when section enters view
  useEffect(() => {
    const sectionEl = featuresSectionRef.current;
    if (!sectionEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        // Hysteresis prevents flicker + avoids awkward mid-section resets:
        // - Enter once ~20% visible
        // - Reset only when almost gone (~5% visible)
        const ratio = entry.intersectionRatio || 0;

        setIsFeaturesSectionVisible((prev) => {
          if (!prev && ratio >= 0.2) return true;
          if (prev && ratio <= 0.05) return false;
          return prev;
        });
      },
      { threshold: [0, 0.05, 0.2], rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(sectionEl);
    return () => {
      observer.disconnect();
    };
  }, []);

  // PRO SHOW section: trigger blur reveal when section enters view
  useEffect(() => {
    const sectionEl = proshowSectionRef.current;
    if (!sectionEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        // Hysteresis prevents flicker + avoids awkward mid-section resets:
        // - Enter once ~20% visible
        // - Reset only when almost gone (~5% visible)
        const ratio = entry.intersectionRatio || 0;

        setIsProshowSectionVisible((prev) => {
          if (!prev && ratio >= 0.2) return true;
          if (prev && ratio <= 0.05) return false;
          return prev;
        });
      },
      { threshold: [0, 0.05, 0.2], rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(sectionEl);
    return () => {
      observer.disconnect();
    };
  }, []);

  // BLAST INTO PAST section: trigger blur crossfade when section enters view
  useEffect(() => {
    const sectionEl = blastSectionRef.current;
    if (!sectionEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const ratio = entry.intersectionRatio || 0;
        setIsBlastSectionVisible((prev) => {
          if (!prev && ratio >= 0.2) return true;
          if (prev && ratio <= 0.05) return false;
          return prev;
        });
      },
      { threshold: [0, 0.05, 0.2], rootMargin: '0px 0px -10% 0px' }
    );

    observer.observe(sectionEl);
    return () => {
      observer.disconnect();
    };
  }, []);

  // BLAST collage: scroll-driven convergence (no timers, fully reversible).
  useEffect(() => {
    const sectionEl = blastSectionRef.current;
    const collageEl = blastCollageRef.current;
    if (!sectionEl || !collageEl) return;

    const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
    // const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    let raf = 0;
    let cachedW = 0;
    let cachedH = 0;
    let finalPositions: {x: number, y: number}[] = [];
    let startPositions: {x: number, y: number}[] = [];
    let cachedCount = 0;

    const computeLayout = () => {
      const r = collageEl.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);
      const count = blastPhotoElsRef.current.filter(Boolean).length || blastImages.length || 0;

      if (
        Math.abs(w - cachedW) < 1 &&
        Math.abs(h - cachedH) < 1 &&
        finalPositions.length === count &&
        count === cachedCount
      )
        return;
      cachedW = w;
      cachedH = h;
      cachedCount = count;

      // Randomly-stacked (but evenly spread) end-state (relative to collage center).
      // Matches the "overlapping stack" vibe from your reference.
      const s = Math.min(w, h);
      const spreadX = s * 0.33;
      // Use more of the available vertical space (especially on mobile).
      const spreadY = Math.min(h * 0.34, s * 0.52);

      const baseFinal = [
        { x: -spreadX * 0.92, y: -spreadY * 0.05 },
        { x: spreadX * 0.12, y: -spreadY * 0.98 },
        { x: spreadX * 0.98, y: spreadY * 0.08 },
        { x: spreadX * 0.52, y: spreadY * 0.92 },
        { x: -spreadX * 0.62, y: spreadY * 1.02 },
        { x: -spreadX * 1.02, y: spreadY * 0.42 },
      ];
      finalPositions = baseFinal.slice(0, count);

      // Start positions: come in from different sides, larger travel.
      const baseDirs = [
        { x: -1, y: -0.15 },
        { x: 1, y: -0.25 },
        { x: 1, y: 0.2 },
        { x: 0.75, y: 0.9 },
        { x: -0.6, y: 1 },
        { x: -1, y: 0.55 },
      ];
      const startDirs = baseDirs.slice(0, count);

      const amp = s * 0.9;
      startPositions = finalPositions.map((p, i) => ({
        x: p.x + (startDirs[i]?.x ?? 0) * amp,
        y: p.y + (startDirs[i]?.y ?? 0) * amp,
      }));
    };

    const update = () => {
      raf = 0;
      computeLayout();

      const rect = sectionEl.getBoundingClientRect();
      const vh = Math.max(1, window.innerHeight);

      // Mobile-friendly gating:
      // Start revealing just after the title is comfortably in view (not halfway down the section).
      // This avoids "scrolling and seeing nothing" on smaller mobile viewports.
      const gateY = vh * 0.55; // start when section top passes ~55% viewport height
      const afterGate = Math.max(0, gateY - rect.top);

      // One "step" per image. Smaller on mobile so 1 swipe/scroll ≈ 1 image.
      const step = Math.max(90, vh * 0.12);

      const els = blastPhotoElsRef.current;
      for (let i = 0; i < els.length; i += 1) {
        const el = els[i];
        if (!el) continue;

        const base = finalPositions[i] || { x: 0, y: 0 };
        const start = startPositions[i] || { x: 0, y: 0 };

        // Local progress for each image: one-by-one sequence tied to scroll.
        const t = clamp01((afterGate - i * step) / step);
        const e = easeInOutCubic(t);

        const opacity = e;
        const scale = lerp(1.55, 1.0, e); // big -> smaller
        const x = lerp(start.x, base.x, e);
        const y = lerp(start.y, base.y, e);

        el.style.opacity = `${opacity}`;
        el.style.transform = `translate3d(-50%, -50%, 0) translate3d(${x.toFixed(2)}px, ${y.toFixed(
          2
        )}px, 0) scale(${scale.toFixed(4)})`;
        el.style.zIndex = `${10 + i}`;
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [blastImages]);

  // Re-run reveal when we swap step content (only after the user has reached the section once).
  useEffect(() => {
    if (!hasAboutEnteredRef.current) return;
    
    // Wait for exit animation to finish (260ms) before revealing new content
    const timeoutId = window.setTimeout(() => {
      runAboutReveal();
    }, 280);
    
    return () => window.clearTimeout(timeoutId);
  }, [aboutStep, runAboutReveal]);

  // Sticky scroll progression inside About:
  // - Keep ABOUT RIT for ~one viewport of scroll within the section
  // - Then swap to ABOUT YATRA'26
  // Scrolling back up swaps back to ABOUT RIT.
  useEffect(() => {
    const sectionEl = aboutRef.current;
    if (!sectionEl) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      // Only run after the section has been seen (so we don't animate offscreen on load).
      if (!hasAboutEnteredRef.current) return;

      const rect = sectionEl.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;

      // How far we've scrolled through this section (0..total)
      const scrolled = Math.min(total, Math.max(0, -rect.top));

      // Swap quickly (about ~2 wheel "steps" on typical mice):
      // Use a small absolute scroll distance with hysteresis to avoid flicker.
      const enterAt = Math.min(total, Math.max(180, window.innerHeight * 0.18));
      const exitAt = Math.max(0, enterAt * 0.55);

      setAboutStep((prev) => {
        if (prev === 0 && scrolled >= enterAt) return 1;
        if (prev === 1 && scrolled <= exitAt) return 0;
        return prev;
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Scroll-based settle interaction - continuous and proportional to scroll distance,
  // but visually smoothed so it feels cinematic (no jitter/snapping).
  // Progress is 0 at top of hero, 1 when hero has fully scrolled out of view.
  useEffect(() => {
    if (!hasLoaded) return;
    const el = stageRef.current;
    const heroEl = heroRef.current;
    if (!el || !heroEl) return;

    let raf = 0;
    let lastTs = 0;
    let target = 0;
    let current = 0;
    let isAnimating = false;

    const update = (ts = performance.now()) => {
      raf = 0;
      const dt = Math.min(50, ts - (lastTs || ts));
      lastTs = ts;

      // Improved smoothing: faster response while maintaining smoothness
      // Using a higher base value for more responsive animation
      const alpha = 1 - Math.pow(0.85, dt / 16.67); // ~0.15–0.25 typical, more responsive
      current = current + (target - current) * alpha;

      el.style.setProperty('--settle', current.toFixed(6));

      // Keep animating until we're very close to target
      const diff = Math.abs(target - current);
      if (diff > 0.0001) {
        raf = window.requestAnimationFrame(update);
        isAnimating = true;
      } else {
        current = target;
        el.style.setProperty('--settle', current.toFixed(6));
        isAnimating = false;
      }
    };

    const onScroll = () => {
      const rect = heroEl.getBoundingClientRect();
      // When rect.top = 0 => progress 0
      // When rect.top = -rect.height => progress 1 (hero fully scrolled past)
      const raw = (-rect.top) / Math.max(1, rect.height);
      target = Math.min(1, Math.max(0, raw));

      // Always start animation if not already running
      if (!isAnimating && raf === 0) {
        raf = window.requestAnimationFrame(update);
      }
    };

    // Init target/current from current scroll position
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [hasLoaded]);

  // Random lamp blooms (random order / random timing).
  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;
    let timeoutId = 0;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const schedule = () => {
      if (cancelled) return;

      // Next bloom in 300ms–1200ms
      const nextIn = Math.round(rand(300, 1200));
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        // Bloom 1–2 random lamps (sometimes 2 for simultaneous glow)
        const bloomCount = Math.random() < 0.4 ? 2 : 1;
        const picked = new Set<string>();
        while (picked.size < bloomCount) {
          picked.add(lamps[Math.floor(Math.random() * lamps.length)].id);
        }

        setLampSeq((prev) => {
          const next = { ...prev };
          picked.forEach((id) => {
            next[id] = (next[id] || 0) + 1;
          });
          return next;
        });

        schedule();
      }, nextIn);
    };

    schedule();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isLoading, lamps]);

  return (
    <>
    <section className="hero" ref={heroRef}>
      {/* Full-bleed background (blurred) so the stage can keep a fixed aspect ratio */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="hero-bleed-bg"
        {...img.bleedBg}
      />

      {/* Fixed-aspect "stage" that scales uniformly across all mobile sizes */}
      <div
        ref={stageRef}
        className={`hero-stage ${isLoading ? 'is-loading' : ''} ${hasLoaded ? 'is-loaded' : ''} ${isScrollReady ? 'is-scroll-ready' : ''}`}
        aria-busy={isLoading}
      >
        {/* Background Layer - Base */}
        <div className="hero-background">
          <img src={heroBg} alt="Hero Background" className="hero-bg-image" {...img.bg} />
        </div>

        {/* Lamp glow overlay (maps to the lanterns in the background image) */}
        <div className="hero-lamps" aria-hidden="true">
          {lamps.map((lamp) => {
            const seq = lampSeq[lamp.id] || 0;
            const amp = (0.85 + Math.random() * 0.6).toFixed(2);
            // Wider duration range: sometimes fast (800ms), sometimes slow (3500ms) for graceful variation
            const dur = `${Math.round(800 + Math.random() * 2700)}ms`;

            return (
              <span
                key={`${lamp.id}-${seq}`}
                className="hero-lamp-glow"
                style={{
                  left: `${lamp.x}%`,
                  top: `${lamp.y}%`,
                  // @ts-ignore - custom properties
                  '--x': `${lamp.x}%`,
                  '--y': `${lamp.y}%`,
                  '--amp': amp,
                  '--bloom-dur': dur,
                  '--bloom-delay': `${Math.round(Math.random() * 200)}ms`,
                }}
              />
            );
          })}
        </div>

        {/* Video Container - Center Focus */}
        <div className="hero-video-container">
          <video className="hero-video" autoPlay loop muted playsInline>
            <source src={videoSrc} type="video/mp4" />
          </video>
        </div>

        {/* "2026" Text - Behind Torii gate */}
        <div className="hero-year-text">
          <img src={yearText} alt="2026" className="year-text-image" {...img.year} />
        </div>

        {/* Action Buttons - Below 2026 text */}
        <div className="hero-buttons">
          <Link 
            to="/tickets" 
            className="hero-button buy-tickets" 
            style={{ textDecoration: 'none', display: 'block', cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <span className="hero-button-text">BUY TICKETS</span>
            <span className="star-icon" aria-hidden="true">
              ✦
            </span>
          </Link>
          <Link 
            to="/events" 
            className="hero-button join-events" 
            style={{ textDecoration: 'none', display: 'block', cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <span className="hero-button-text">JOIN EVENTS</span>
          </Link>
        </div>

        {/* YATRA Text - Mid Layer (behind Torii gate) */}
        <div className="hero-yatra-text">
          <img src={yatraText} alt="YATRA" className="yatra-text-image" {...img.yatra} />
        </div>

        {/* Torii Gate Overlay - Foreground Mask (Topmost) */}
        <div className="hero-torri-gate">
          <img src={torriGate} alt="Torii Gate" className="torri-gate-image" {...img.torii} />
        </div>
      </div>

      {/* Section Divider - Bottom of Hero */}
      <div className="hero-section-divider">
        <div className="hero-divider-scroll">
          <div className="hero-divider-track" aria-label="Event dates">
            <div className="hero-divider-content">
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
            </div>
            <div className="hero-divider-content" aria-hidden="true">
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
              <span className="hero-divider-text">FEB 13 & 14</span>
              <span className="hero-divider-star">✦</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    {/* Black Background Section - After Divider */}
    <section className="hero-black-section" aria-label="About section" ref={aboutRef}>
      <div className="about-sticky">
        <div className="about-container">
        {aboutStep === 0 ? (
          <div key="about-rit">
            <h2 className="about-title reveal" ref={aboutTitleRef}>
              <span className="about-title-about">ABOUT</span>{' '}
              <span className="about-title-rit">RIT</span>
            </h2>
            <p className="about-content reveal" ref={aboutContentRef}>
              Rajalakshmi Institute of Technology is one of the best engineering colleges in Chennai and is part of
              Rajalakshmi Institutions, which has been synonymous with providing excellence in higher education to
              students for many years. Rajalakshmi Institute of Technology was established in 2008 and is affiliated
              with Anna University Chennai. Ours is one among the few Colleges to receive accreditation for Under
              Graduate Engineering programmes from the National Board of Accreditation (NBA), New Delhi, as soon as
              attaining the eligibility to apply for accreditation. The College is accredited by the National
              Assessment and Accreditation Council (NAAC) with 'A++' Grade.
            </p>
          </div>
        ) : (
          <div key="about-yatra">
            <h2 className="about-title reveal" ref={aboutTitleRef}>
              <span className="about-title-about">ABOUT</span>{' '}
              <span className="about-title-rit">YATRA'26</span>
            </h2>
            <p className="about-content reveal" ref={aboutContentRef}>
              Yatra'26 is a grand intercollege cultural fest at Rajalakshmi Institute of Technology organized by
              the student community with the support of Faculties, Principal and Management. Main motive of Yatra is
              involving or concerning the enthusiasm among students with a deep sense of humor which is also a part
              of Cultural heritage. This enhance the confidence level of the students thereby allowing them to
              perform better. In fact, students can also leverage the advantage of participating in various
              activities. Many chief guests are being invited to join us
            </p>
          </div>
        )}
        </div>
      </div>
    </section>

    {/* Features Divider */}
    <div className="features-section-divider" aria-hidden="true">
      <div className="hero-divider-scroll">
        <div className="hero-divider-track">
          <div className="hero-divider-content">
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
          </div>
          <div className="hero-divider-content" aria-hidden="true">
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
            <span className="hero-divider-text">FEATURES OF YATRA</span>
            <span className="hero-divider-star">✦</span>
          </div>
        </div>
      </div>
    </div>

    {/* FEATURES OF YATRA section (content coming next) */}
    <section
      className={`features-section ${isFeaturesSectionVisible ? 'is-visible' : ''}`}
      aria-label="Features of Yatra"
      ref={featuresSectionRef}
    >
      <div className="features-container">
        <h2 className="features-title">
          <GlitchText 
            koreanText="야트라의 특징" 
            englishText="FEATURES OF" 
            className="features-title-features" 
            delay={0}
            shouldStart={isFeaturesSectionVisible}
            variant="blur"
          />
          <br />
          <GlitchText 
            koreanText="" 
            englishText="YATRA" 
            className="features-title-rest" 
            delay={500}
            shouldStart={isFeaturesSectionVisible}
            variant="blur"
          />
        </h2>
        <div className="features-event-media features-event-media--left">
          <div className="features-event-badge">
            50+ Events with CASH PRICE
          </div>
          <img src={eventImage} alt="Yatra Event" className="features-event-image" />
          <button 
            className="features-show-more-btn" 
            onClick={() => navigate('/events')}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            SHOW MORE
          </button>
        </div>
        <div className="features-event-media features-event-media--right">
          <div className="features-event-badge">
            ELECTRIFYING PERFORMANCES
          </div>
          <img src={performanceImage} alt="Electrifying Performance" className="features-event-image" />
          <button className="features-show-more-btn" onClick={() => navigate('/events')}>SHOW MORE</button>
        </div>
      </div>
    </section>

    {/* PRO SHOW section */}
    <section 
      className={`proshow-section ${isProshowSectionVisible ? 'is-visible' : ''}`}
      aria-label="Pro Show"
      ref={proshowSectionRef}
    >
      <div className="proshow-container">
        {/* PROSHOWS Title */}
        <div className="proshow-title-container">
          <TextHoverEffect text="PROSHOWS" />
        </div>

        {/* Content Container */}
        <div className="proshow-content">
          {/* Artist Image - Mobile First */}
          <div className="proshow-image-wrapper">
            <Link to="/proshow" className="proshow-image-link">
              <div style={{ position: 'relative' }}>
                <div className="proshow-image-glow" />
                <div className="proshow-image-container">
                  <TiltedCard
                    imageSrc={artistPng}
                    altText="Pro Show Artist AOORA"
                    captionText="AOORA - LIVE IN CONCERT"
                    containerHeight="350px"
                    containerWidth="280px"
                    imageHeight="350px"
                    imageWidth="280px"
                    rotateAmplitude={8}
                    scaleOnHover={1.03}
                    showMobileWarning={false}
                    showTooltip={false}
                    displayOverlayContent={false}
                  />
                </div>
              </div>
            </Link>
          </div>

          {/* Text Content */}
          <div className="proshow-text-content">
            <h2 className="proshow-artist-name">
              AOORA
            </h2>
            <h3 className="proshow-subtitle">
              LIVE IN CONCERT
            </h3>
            <p className="proshow-description">
              Get ready for an electrifying performance by the K-Pop sensation AOORA! Known for his unique blend of energetic EDM and pop, he's set to light up the stage with his neon-fueled fashion and high-octane performance. Don't miss this chance to witness the "Indo-Korean" genre pioneer live at YATRA '26!
            </p>
            <Link to="/proshow" className="proshow-button-wrapper">
              <RainbowButton 
                size="lg" 
                className="font-bold text-base transition-all duration-300 font-display"
                style={{
                  "--color-1": "#ec4899",
                  "--color-2": "#ec4899",
                  "--color-3": "#ec4899",
                  "--color-4": "#ec4899",
                  "--color-5": "#ec4899",
                  minWidth: "160px",
                } as CSSProperties}
              >
                VIEW DETAILS
              </RainbowButton>
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* BLAST INTO PAST section */}
    <section
      className={`blast-section ${isBlastSectionVisible ? 'is-visible' : ''}`}
      aria-label="Blast into Past"
      ref={blastSectionRef}
    >
      <div className="blast-sticky">
        <div className="features-container">
          <h2 className="features-title">
            <GlitchText
              koreanText="과거 속으로 돌진하다"
              englishText="BLAST INTO THE"
              className="blast-title-prefix"
              delay={0}
              shouldStart={isBlastSectionVisible}
              variant="blur"
            />
            <br />
            <GlitchText
              koreanText=""
              englishText="PAST"
              className="blast-title-highlight"
              delay={500}
              shouldStart={isBlastSectionVisible}
              variant="blur"
            />
          </h2>

          <div className="blast-collage" ref={blastCollageRef} aria-hidden="true">
            {blastImages.map((src, idx) => (
              <img
                key={`${src}-${idx}`}
                ref={(el) => {
                  blastPhotoElsRef.current[idx] = el;
                }}
                src={src}
                alt=""
                className="blast-photo"
                draggable="false"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
