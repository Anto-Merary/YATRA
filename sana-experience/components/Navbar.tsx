"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";


export default function Navbar() {
    const navRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(navRef.current, {
                yPercent: -100,
                autoAlpha: 0,
                duration: 1,
                ease: "power4.out",
                delay: 0.2,
            });
        }, navRef);
        return () => ctx.revert();
    }, []);



    return (
        <nav
            ref={navRef}
            className="fixed top-10 left-0 w-full z-[100] px-6 py-4 md:px-12 flex justify-between items-center text-white mix-blend-difference"
        >
            {/* Centered Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <img src="/gv-prakash/logo.png" alt="Sana Logo" className="h-12 w-auto object-contain opacity-80" />
            </div>


        </nav>
    );
}
