import type { SVGProps } from "react";
import { TextHoverEffect } from "./ui/text-hover-effect";
import { NoiseOverlay } from "./NoiseOverlay";
import { useLocation } from "react-router-dom";
import "../styles/mobile-footer.css";
import { useEffect, useState } from "react";

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9A4.75 4.75 0 0 1 16.5 21.25h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M17.25 6.75h.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14 8.5h2V5.75A18 18 0 0 0 13.6 5.6c-2.4 0-4.1 1.46-4.1 4.15V12H7v3h2.5v6h3.1v-6h2.8l.5-3h-3.3V10c0-1 .33-1.5 1.4-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778c-.413 1.566-.417 4.814-.417 4.814s-.004 3.264.406 4.814c.266.978.842 1.74 1.766 1.778 1.582.43 7.831.437 7.831.437s6.265.007 7.831-.403a2.515 2.515 0 0 0 1.767-1.776c.415-1.563.417-4.812.417-4.812s.002-3.265-.415-4.831zM9.996 15.005l-.005-6 5.207 3.005-5.202 2.995z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Footer() {
  const location = useLocation();
  const isEventsPage = location.pathname === "/events" || location.pathname === "/yatraevents" || location.pathname === "/pro-dance-battle";

  // Match SiteLayout mobile breakpoint (phone-only)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 743);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <footer id="footer" className="mobile-footer" aria-label="Footer">
        <div className="mobile-footer-container">
          <div className="mobile-footer-title">YATRA&apos;26</div>

          <div className="mobile-footer-section">
            <div className="mobile-footer-label">ADDRESS</div>
            <div className="mobile-footer-text">Kuthambakkam, Chennai, Tamil Nadu 600124</div>
          </div>

          <div className="mobile-footer-section">
            <div className="mobile-footer-label">WEBSITE</div>
            <a
              className="mobile-footer-link"
              href="https://www.ritchennai.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.ritchennai.org
            </a>
          </div>

          <div className="mobile-footer-section">
            <div className="mobile-footer-label">PHONE</div>
            <div className="mobile-footer-phone-numbers">
              <a className="mobile-footer-link mobile-footer-link--underline" href="tel:+918825910614">
                +91 88259 10614
              </a>
              <a className="mobile-footer-link mobile-footer-link--underline" href="tel:+919884470171">
                +91 98844 70171
              </a>
            </div>
          </div>

          <div className="mobile-footer-social" aria-label="Social links">
            <a
              className="mobile-footer-social-link"
              href="https://www.instagram.com/yatra_rit?igsh=MTYzdDJhbHlnOHhmNQ=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <InstagramIcon className="mobile-footer-social-icon" width={28} height={28} />
            </a>
            <a
              className="mobile-footer-social-link"
              href="https://youtube.com/@rajalakshmiinstituteoftech4448?si=E-E820dMeHNlnfBo"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <YouTubeIcon className="mobile-footer-social-icon" width={28} height={28} />
            </a>
          </div>
        </div>
      </footer>
    );
  }
  
  return (
    <footer id="footer" className="relative mt-20 border-t border-white/10 bg-black pb-24 sm:pb-0">
      {/* Film grain overlay */}
      <NoiseOverlay opacity={0.3} />
      
      <div className="container-max relative py-8 sm:py-10 md:py-12 lg:py-16">
        {/* Main Title - Centered at top */}
        <div className="flex justify-center mb-6 xs:mb-8 sm:mb-10 md:mb-12 lg:mb-16 overflow-hidden px-2">
          <div className="w-full max-w-5xl h-28 xs:h-32 sm:h-36 md:h-44 lg:h-56 xl:h-64 overflow-hidden py-2 xs:py-3 sm:py-4 md:py-5 lg:py-6 flex items-center justify-center">
            {isEventsPage ? (
              <div 
                className="font-akira font-bold tracking-wider uppercase text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
                style={{
                  background: "linear-gradient(0deg, rgb(205, 7, 194) 0%, rgba(205, 7, 194, 0.65) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                YATRA'26
              </div>
            ) : (
              <TextHoverEffect text="YATRA'26" duration={0.15} />
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col md:flex-row md:justify-between gap-6 xs:gap-8 sm:gap-10 md:gap-8 mb-8 xs:mb-10 sm:mb-12">
          {/* Left Column - Address */}
          <div className="flex-1">
            <div className="space-y-1.5 xs:space-y-2 text-sm xs:text-base md:text-lg text-white/90 leading-relaxed text-center md:text-left">
              <div className="font-semibold text-white">
                <a
                  href="https://www.ritchennai.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white/90 underline-offset-4 hover:underline"
                >
                  Rajalakshmi Institute of Technology
                </a>
              </div>
              <div className="text-white/95">Bangalore Highway Road, Kuthambakkam,</div>
              <div className="text-white/95">Chennai, Tamil Nadu - 600124</div>
            </div>
          </div>

          {/* Right Column - Social Media & Contact */}
          <div className="flex-1 text-center md:text-right">
            {/* Social Media Icons */}
            <div className="flex justify-center md:justify-end items-center gap-2 xs:gap-3 mb-4 xs:mb-5 sm:mb-6">
              <a
                href="https://www.facebook.com/ritchennai"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2 xs:p-2.5 text-white hover:text-white hover:border-white/40 active:bg-white/10 transition-colors touch-manipulation"
                aria-label="Facebook"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
              >
                {/* Inline width/height prevents oversized SVG if utility CSS fails to load */}
                <FacebookIcon className="h-5 w-5" width={20} height={20} style={{ width: 20, height: 20, flex: "0 0 auto" }} />
              </a>
              <a
                href="https://www.instagram.com/yatra_rit?igsh=MTYzdDJhbHlnOHhmNQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2 xs:p-2.5 text-white hover:text-white hover:border-white/40 active:bg-white/10 transition-colors touch-manipulation"
                aria-label="Instagram"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
              >
                <InstagramIcon className="h-5 w-5" width={20} height={20} style={{ width: 20, height: 20, flex: "0 0 auto" }} />
              </a>
              <a
                href="https://youtube.com/@rajalakshmiinstituteoftech4448?si=E-E820dMeHNlnfBo"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2 xs:p-2.5 text-white hover:text-white hover:border-white/40 active:bg-white/10 transition-colors touch-manipulation"
                aria-label="YouTube"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
              >
                <YouTubeIcon className="h-5 w-5" width={20} height={20} style={{ width: 20, height: 20, flex: "0 0 auto" }} />
              </a>
            </div>

            {/* Email and Phone */}
            <div className="space-y-1 text-xs xs:text-sm md:text-base text-white/70">
              <div>yatra@ritchennai.edu.in</div>
              <div>
                <a href="tel:+919843656238" className="hover:text-white transition-colors">+91 98436 56238</a>
              </div>
              <div>
                <a href="tel:+919080850106" className="hover:text-white transition-colors">+91 90808 50106</a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright - Bottom Left */}
        <div className="border-t border-white/10 pt-4 xs:pt-5 sm:pt-6">
          <div className="text-[10px] xs:text-xs text-white/40">
            Copyright © 2026 Rajalakshmi Institutions
          </div>
        </div>
      </div>
    </footer>
  );
}


