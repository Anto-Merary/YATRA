"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MarqueeProps {
    text: string;
    repeat?: number;
    speed?: number;
    className?: string;
}

export default function Marquee({ text, repeat = 10, speed = 10, className = "" }: MarqueeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !textRef.current) return;

        const containerWidth = textRef.current.offsetWidth;

        gsap.to(textRef.current, {
            x: -containerWidth / 2,
            duration: speed,
            ease: "none",
            repeat: -1,
        });
    }, [speed, text]);

    return (
        <div ref={containerRef} className={`overflow-hidden whitespace-nowrap flex ${className}`}>
            <div ref={textRef} className="flex">
                {Array.from({ length: repeat }).map((_, i) => (
                    <span key={i} className="mx-4 uppercase font-mono tracking-widest">
                        {text}
                    </span>
                ))}
            </div>
        </div>
    );
}
