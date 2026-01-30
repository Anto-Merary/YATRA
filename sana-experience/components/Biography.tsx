"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Section from "./Section";

gsap.registerPlugin(ScrollTrigger);

export default function Biography() {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(textRef.current, {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                    end: "bottom bottom",
                    scrub: 1,
                },
                y: 100,
                autoAlpha: 0,
                duration: 1
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <Section id="about" className="py-24 md:py-32 border-t border-white/10 relative overflow-hidden bg-black">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/noise.png')]"></div>

            <div ref={containerRef} className="container mx-auto px-6 md:px-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">

                    {/* Left Column: Image / Graphic (5 cols) */}
                    <div className="md:col-span-5 relative min-h-[50vh] md:h-[70vh] w-full tech-border bg-white/5 overflow-hidden group aspect-[3/4] md:aspect-auto">
                        <div className="absolute inset-0 bg-neutral-900/50 mix-blend-multiply"></div>

                        {/* Artist Image */}
                        <div className="absolute inset-0 transition-opacity duration-700">
                            <img
                                src="/gv-prakash/GV PRAKASH 1.webp"
                                alt="GV Prakash"
                                className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
                            />
                        </div>

                        <div className="absolute top-4 right-4 flex flex-col items-end">
                            <div className="w-2 h-2 bg-accent animate-pulse"></div>
                            <span className="font-mono text-[10px] text-accent mt-1">LIVE_FEED</span>
                        </div>

                        <div className="absolute bottom-6 left-6 z-20">
                            <div className="font-mono text-xs text-white bg-black px-2 py-1 inline-block mb-2">
                                SUBJ: GV_PRAKASH
                            </div>
                            <h3 className="text-3xl font-serif text-white uppercase leading-none mix-blend-difference">
                                The<br />Origin
                            </h3>
                        </div>
                    </div>

                    {/* Right Column: Content (7 cols) */}
                    <div ref={textRef} className="md:col-span-7 flex flex-col justify-center pl-0 md:pl-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px w-12 bg-accent"></div>
                            <h2 className="text-sm font-mono text-accent tracking-[0.3em] uppercase">
                                Biography
                            </h2>
                        </div>

                        <h3 className="text-5xl md:text-7xl font-serif leading-[0.9] uppercase text-white mb-12">
                            Redefining<br />
                            <span className="stroke-text">Soundscape</span>
                        </h3>

                        <div className="prose prose-invert prose-lg md:prose-xl font-light text-gray-400 max-w-2xl border-l border-white/10 pl-8">
                            <p className="mb-8 first-letter:text-5xl first-letter:font-serif first-letter:text-white first-letter:mr-3 first-letter:float-left">
                                GV Prakash Kumar is a force of nature. From the rustic brilliance of <em className="text-white not-italic">Veyil</em> to the raw intensity of <em className="text-white not-italic">Asuran</em>, his music defines the emotional core of modern Tamil cinema.
                            </p>
                            <p>
                                Bridging traditional folk with global synthetics, creating anthems that don't just play—they resonate.
                            </p>
                        </div>

                        <div className="mt-16 grid grid-cols-2 gap-12 border-t border-white/10 pt-12">
                            <div>
                                <span className="block text-5xl md:text-6xl font-serif font-bold text-white mb-2">100+</span>
                                <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Films Scored</span>
                            </div>
                            <div>
                                <span className="block text-5xl md:text-6xl font-serif font-bold text-white mb-2">20Y</span>
                                <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Legacy</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </Section>
    );
}
