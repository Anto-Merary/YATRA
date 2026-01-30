"use client";

import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

export default function Preloader({ onComplete }: { onComplete: () => void }) {
    const [progress, setProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const lineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const tl = gsap.timeline({
            onComplete: () => {
                // Fade out animation
                gsap.to(containerRef.current, {
                    yPercent: -100,
                    duration: 1.5,
                    ease: "power4.inOut",
                    onComplete: onComplete
                });
            }
        });

        // Animate progress 0 to 100
        const progressObj = { value: 0 };

        tl.to(progressObj, {
            value: 100,
            duration: 4,
            ease: "expo.inOut",
            onUpdate: () => {
                setProgress(Math.round(progressObj.value));
            }
        });

        // Initial revealing animations
        gsap.from(lineRef.current, {
            scaleX: 0,
            duration: 1.5,
            ease: "power3.out"
        });

        return () => {
            tl.kill();
        };
    }, [onComplete]);

    return (
        <div ref={containerRef} className="fixed inset-0 bg-black z-[9999] flex flex-col justify-center items-center overflow-hidden">

            <div className="relative w-full max-w-[90vw] flex flex-col items-center justify-center leading-none select-none">
                {/* YATRA */}
                <h1 className="text-[15vw] md:text-[18vw] font-black tracking-tighter opacity-100"
                    style={{
                        WebkitTextStroke: "1px #d946ef", // fuchsia-500 hex
                        color: "transparent"
                    }}>
                    YATRA
                </h1>

                {/* Center Line & Loading Text */}
                <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 flex items-center justify-center z-10">
                    <div ref={lineRef} className="w-full h-px bg-fuchsia-600/50 absolute left-0 top-1/2 -translate-y-1/2"></div>
                    <div ref={textRef} className="relative bg-black px-4 flex gap-4 items-center">
                        <span className="font-mono text-[10px] md:text-xs tracking-[0.3em] text-fuchsia-500 uppercase">
                            Loading Festival
                        </span>
                        <span className="font-mono text-lg md:text-xl font-bold text-fuchsia-500">
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* 2026 */}
                <h1 className="text-[15vw] md:text-[18vw] font-black tracking-tighter opacity-100 -mt-[2vw]"
                    style={{
                        WebkitTextStroke: "1px #d946ef", // fuchsia-500 hex
                        color: "transparent"
                    }}>
                    2026
                </h1>
            </div>

        </div>
    );
}
