"use client";

import { useEffect, useState, useRef } from "react";

export default function CinematicBars() {
    const [barHeight, setBarHeight] = useState(3); // Start at 3vh
    const animationRef = useRef<number | null>(null);
    const targetHeightRef = useRef(3);

    useEffect(() => {
        // Smooth easing function (ease-out cubic)
        const easeOutCubic = (t: number): number => {
            return 1 - Math.pow(1 - t, 3);
        };

        const handleScroll = () => {
            // Get scroll position
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;

            // Calculate progress (0 to 1) based on first 1.5 viewport scroll for slower growth
            const scrollProgress = Math.min(scrollY / (windowHeight * 1.5), 1);

            // Apply easing for smoother interpolation
            const easedProgress = easeOutCubic(scrollProgress);

            // Interpolate bar height from 3vh to 12vh
            const minHeight = 3;
            const maxHeight = 12;
            targetHeightRef.current = minHeight + (easedProgress * (maxHeight - minHeight));
        };

        // Smooth animation loop using requestAnimationFrame
        const animate = () => {
            setBarHeight(prev => {
                const diff = targetHeightRef.current - prev;
                // Lerp (linear interpolation) for smooth following
                // Lower value = smoother/slower, higher = snappier
                const smoothing = 0.08;
                if (Math.abs(diff) < 0.01) {
                    return targetHeightRef.current;
                }
                return prev + diff * smoothing;
            });
            animationRef.current = requestAnimationFrame(animate);
        };

        // Start animation loop
        animationRef.current = requestAnimationFrame(animate);

        // Initial check
        handleScroll();

        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <>
            {/* Top Letterbox Bar */}
            <div
                className="fixed top-0 left-0 w-full bg-black z-[90] pointer-events-none"
                style={{
                    height: `${barHeight}vh`,
                    borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
                    willChange: "height"
                }}
            />

            {/* Bottom Letterbox Bar */}
            <div
                className="fixed bottom-0 left-0 w-full bg-black z-[90] pointer-events-none"
                style={{
                    height: `${barHeight}vh`,
                    borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                    willChange: "height"
                }}
            />
        </>
    );
}
