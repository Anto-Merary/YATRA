import type { SVGProps } from "react";
import { TextHoverEffect } from "./ui/text-hover-effect";
import { NoiseOverlay } from "./NoiseOverlay";

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

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M18.9 2H21l-4.6 5.26L22 22h-5l-3.9-5.1L8.6 22H6.5l5-5.8L2 2h5.1l3.5 4.7L14.7 2h4.2ZM18 20.3h1.2L6.9 3.6H5.6L18 20.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M9.75 12l5.75 3.27V8.73L9.75 12z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Footer() {
  return (
    <footer id="footer" className="relative mt-20 border-t border-white/10 bg-black">
      {/* Film grain overlay */}
      <NoiseOverlay opacity={0.15} />
      
      <div className="container-max relative py-12 md:py-16">
        {/* Main Title - Centered at top */}
        <div className="flex justify-center mb-12 md:mb-16 overflow-visible">
          <div className="w-full max-w-5xl h-40 md:h-52 lg:h-64 xl:h-72 overflow-visible py-6">
            <TextHoverEffect text="YATRA'26" duration={0.15} />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col md:flex-row md:justify-between gap-12 md:gap-8 mb-12">
          {/* Left Column - Address */}
          <div className="flex-1">
            <div className="space-y-2 text-base md:text-lg text-white/90 leading-relaxed text-left">
              <div className="font-semibold text-white">Rajalakshmi Institute of Technology</div>
              <div className="text-white/95">Bangalore Highway Road, Kuthambakkam,</div>
              <div className="text-white/95">Chennai, Tamil Nadu - 600124</div>
            </div>
          </div>

          {/* Right Column - Social Media & Contact */}
          <div className="flex-1 md:text-right">
            {/* Social Media Icons */}
            <div className="flex md:justify-end items-center gap-3 mb-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2.5 text-white hover:text-white hover:border-white/40 transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2.5 text-white hover:text-white hover:border-white/40 transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2.5 text-white hover:text-white hover:border-white/40 transition-colors"
                aria-label="YouTube"
              >
                <YouTubeIcon className="h-5 w-5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/20 bg-black/50 p-2.5 text-white hover:text-white hover:border-white/40 transition-colors"
                aria-label="Twitter"
              >
                <TwitterIcon className="h-5 w-5" />
              </a>
            </div>

            {/* Email and Phone */}
            <div className="space-y-1 text-sm md:text-base text-white/70">
              <div>yatra@ritchennai.edu.in</div>
              <div>+91 XXXXXXXXXX</div>
            </div>
          </div>
        </div>

        {/* Copyright - Bottom Left */}
        <div className="border-t border-white/10 pt-6">
          <div className="text-xs text-white/40">
            © {new Date().getFullYear()} YATRA'26
          </div>
        </div>
      </div>
    </footer>
  );
}


