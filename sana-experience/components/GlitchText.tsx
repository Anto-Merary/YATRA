"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface GlitchTextProps {
    text: string;
    intensity?: "low" | "medium" | "high";
    className?: string;
    triggerOnView?: boolean;
}

export default function GlitchText({ text, intensity = "medium", className = "", triggerOnView = true }: GlitchTextProps) {
    const [displayText, setDisplayText] = useState(text);
    const elementRef = useRef<HTMLDivElement>(null);
    const originalText = text;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const duration = intensity === "high" ? 2000 : intensity === "medium" ? 1000 : 500;
        const speed = intensity === "high" ? 30 : intensity === "medium" ? 50 : 80;

        const glitch = () => {
            let iteration = 0;

            clearInterval(interval);
            interval = setInterval(() => {
                setDisplayText(
                    originalText
                        .split("")
                        .map((letter, index) => {
                            if (index < iteration) {
                                return originalText[index];
                            }
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join("")
                );

                if (iteration >= originalText.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 2; // Slow down the resolution
            }, speed);
        };

        if (triggerOnView) {
            const ctx = gsap.context(() => {
                gsap.to(elementRef.current, {
                    scrollTrigger: {
                        trigger: elementRef.current,
                        start: "top 80%",
                        onEnter: glitch,
                    },
                });
            }, elementRef);
            return () => ctx.revert();
        } else {
            // Continuous glitch or hover effect logic could go here
            glitch();
        }

        return () => clearInterval(interval);
    }, [text, intensity, triggerOnView, originalText]);

    return (
        <div ref={elementRef} className={`relative inline-block ${className}`}>
            <span className="relative z-10">{displayText}</span>
            <span className="absolute top-0 left-[0.5px] -z-10 opacity-50 text-red-500 clip-text animate-pulse">
                {displayText}
            </span>
            <span className="absolute top-0 -left-[0.5px] -z-10 opacity-50 text-blue-500 clip-text animate-pulse delay-75">
                {displayText}
            </span>
        </div>
    );
}
