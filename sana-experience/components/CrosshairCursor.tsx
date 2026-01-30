"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CrosshairCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        const onMouseMove = (e: MouseEvent) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: "power2.out",
            });
        };

        const onMouseEnter = () => setIsHovering(true);
        const onMouseLeave = () => setIsHovering(false);

        // Add event listeners for interactive elements
        const interactiveElements = document.querySelectorAll("a, button, .interactive");
        interactiveElements.forEach((el) => {
            el.addEventListener("mouseenter", onMouseEnter);
            el.addEventListener("mouseleave", onMouseLeave);
        });

        window.addEventListener("mousemove", onMouseMove);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            interactiveElements.forEach((el) => {
                el.removeEventListener("mouseenter", onMouseEnter);
                el.removeEventListener("mouseleave", onMouseLeave);
            });
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className={`fixed top-0 left-0 w-8 h-8 pointer-events-none z-[99999] mix-blend-difference transition-transform duration-300 ${isHovering ? "scale-150" : "scale-100"
                }`}
            style={{ transform: "translate(-50%, -50%)" }}
        >
            {/* Horizontal Line */}
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white transform -translate-y-1/2" />
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-0 h-full w-[2px] bg-white transform -translate-x-1/2" />
        </div>
    );
}
