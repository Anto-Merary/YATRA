import React, { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ParallaxTextProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

/**
 * ParallaxText - A simple infinite scrolling marquee with text outline
 *
 * @param {React.ReactNode} children - The text to display
 * @param {number} speed - Animation speed in seconds (lower = faster, default: 30)
 * @param {string} className - Additional CSS classes for styling the text
 */
export function ParallaxText({
  children,
  speed = 30,
  className,
}: ParallaxTextProps) {
  const instanceIdRef = useRef<string>(
    `marquee-${Math.random().toString(36).substr(2, 9)}`
  );
  
  const animationName = useMemo(
    () => `${instanceIdRef.current}-marquee`,
    []
  );

  const animationDuration = `${speed}s`;

  return (
    <div className="relative overflow-hidden whitespace-nowrap w-full">
      <style>{`
        @keyframes ${animationName} {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
      
      <div
        className="flex whitespace-nowrap will-change-transform"
        style={{
          animation: `${animationName} ${animationDuration} linear infinite`,
        }}
      >
        <span className={cn("inline-block whitespace-nowrap", className)} style={{ letterSpacing: 0 }}>{children}</span>
        <span className={cn("inline-block whitespace-nowrap", className)} style={{ letterSpacing: 0 }} aria-hidden="true">{children}</span>
        <span className={cn("inline-block whitespace-nowrap", className)} style={{ letterSpacing: 0 }} aria-hidden="true">{children}</span>
        <span className={cn("inline-block whitespace-nowrap", className)} style={{ letterSpacing: 0 }} aria-hidden="true">{children}</span>
      </div>
    </div>
  );
}

export default function ScrollVelocityText() {
  return (
    <section style={{ padding: "5rem 0", background: "#111", color: "white" }}>
      <ParallaxText speed={30}>Framer Motion</ParallaxText>
      <ParallaxText speed={30}>Scroll Velocity</ParallaxText>
    </section>
  );
}
