"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface FadeInTextProps {
    text: string;
    className?: string; // Allow passing text styles (size, font, etc.)
    delay?: number;
}

export default function FadeInText({ text, className = "", delay = 0 }: FadeInTextProps) {
    const el = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        gsap.fromTo(
            el.current,
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 2, ease: "power2.out", delay }
        );
    }, [delay]);

    return (
        <span ref={el} className={`inline-block ${className}`}>
            {text}
        </span>
    );
}
