"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function DataHUD() {
    const [time, setTime] = useState("");
    const audioBarsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Update local time
        const updateTime = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);

        // Animate audio bars randomly
        const ctx = gsap.context(() => {
            const bars = gsap.utils.toArray<HTMLElement>(".audio-bar");
            bars.forEach(bar => {
                gsap.to(bar, {
                    height: "random(10%, 100%)",
                    duration: "random(0.2, 0.5)",
                    repeat: -1,
                    yoyo: true,
                    ease: "power1.inOut"
                });
            });
        }, audioBarsRef);

        return () => {
            clearInterval(timer);
            ctx.revert();
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden mix-blend-exclusion">

            {/* Top Left: System Status */}
            <div className="absolute top-24 left-6 md:left-12 flex flex-col gap-1 font-mono text-[9px] md:text-[10px] text-white opacity-70">
                <div className="flex gap-2">
                    <span className="text-accent">CPU</span>
                    <span className="animate-pulse">ONLINE</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-accent">MEM</span>
                    <span>OPTIMAL</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-accent">NET</span>
                    <span>SECURE</span>
                </div>
            </div>

            {/* Top Right: Time & Coordinates */}
            <div className="absolute top-24 right-6 md:right-12 text-right font-mono text-[9px] md:text-[10px] text-white opacity-70">
                <div>{time} // IST</div>
                <div className="mt-1">LAT: 13.0827° N</div>
                <div>LNG: 80.2707° E</div>
            </div>

            {/* Bottom Left: Audio Visualizer Bars */}
            <div ref={audioBarsRef} className="absolute bottom-24 left-6 md:left-12 flex items-end gap-1 h-12">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="audio-bar w-1 bg-white opacity-80" style={{ height: '20%' }}></div>
                ))}
            </div>

            {/* Bottom Right: Mode Indicator */}
            <div className="absolute bottom-24 right-6 md:right-12 text-right font-mono text-[9px] md:text-[10px] text-white opacity-70">
                <span className="border border-white/30 px-2 py-1 bg-white/5">MODE: IMMERSIVE</span>
            </div>

            {/* Center Crosshair - Subtle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/20 opacity-20">
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/50"></div>
                <div className="absolute top-0 left-1/2 h-full w-px bg-white/50"></div>
            </div>

        </div>
    );
}
