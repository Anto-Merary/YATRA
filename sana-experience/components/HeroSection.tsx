"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ImageSequence, { ImageSequenceHandle } from "@/components/ImageSequence";
import FadeInText from "@/components/FadeInText";
import GlitchText from "@/components/GlitchText";
import DataHUD from "@/components/DataHUD";

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const sequenceRef = useRef<ImageSequenceHandle>(null);

    // Section Refs
    const heroRef = useRef<HTMLDivElement>(null);
    const manifestoRef = useRef<HTMLDivElement>(null);
    const soundRef = useRef<HTMLDivElement>(null);
    const energyRef = useRef<HTMLDivElement>(null);
    const globalRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Main Timeline
            // Compressed for punchier, brutalist feel
            const totalScrollHeight = 6000;

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: `+=${totalScrollHeight}`,
                    scrub: 0, // Instant scrubbing for raw feel
                    pin: true,
                    onUpdate: (self) => {
                        // Global Frame Driver: 0 to 1 mapping
                        if (sequenceRef.current) {
                            sequenceRef.current.drawFrame(self.progress);
                        }
                    }
                }
            });

            // --- NARRATIVE SYNC ---
            // Much tighter windows. Overlapping transitions.

            // 1. HERO (Immediate Dissolve: 0 -> 5%)
            // Starts fading immediately, gone by 5%
            tl.to(heroRef.current, { autoAlpha: 0, scale: 1.1, duration: 0.05, ease: "power2.in" }, 0);

            // 2. MANIFESTO (Hard Cut In: 8% -> 25%)
            tl.fromTo(manifestoRef.current,
                { autoAlpha: 0, scale: 0.9, filter: "blur(20px)" },
                { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.05, ease: "expo.out" }, 0.08)
                .to(manifestoRef.current, { autoAlpha: 0, filter: "blur(10px)", duration: 0.05 }, 0.25);

            // 3. SOUND (30% -> 45%)
            tl.fromTo(soundRef.current,
                { autoAlpha: 0, x: -50 },
                { autoAlpha: 1, x: 0, duration: 0.05, ease: "steps(5)" }, 0.3)
                .to(soundRef.current, { autoAlpha: 0, x: 50, duration: 0.05 }, 0.45);

            // 4. ENERGY (50% -> 65%)
            tl.fromTo(energyRef.current,
                { autoAlpha: 0, scale: 1.1, filter: "blur(10px)" },
                { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.1, ease: "power2.out" }, 0.5)
                .to(energyRef.current, { autoAlpha: 0, scale: 0.9, filter: "blur(10px)", duration: 0.1 }, 0.65);

            // 5. GLOBAL (70% -> 85%)
            tl.fromTo(globalRef.current,
                { autoAlpha: 0, y: 50 },
                { autoAlpha: 1, y: 0, duration: 0.05, ease: "power4.out" }, 0.7)
                .to(globalRef.current, { autoAlpha: 0, y: -50, duration: 0.05 }, 0.85);

            // 6. STAGE (90% -> 100%)
            tl.fromTo(stageRef.current,
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.05, ease: "none" }, 0.9);

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black text-white">

            {/* CINEMATIC LAYERS */}
            <div className="absolute inset-0 z-0 opacity-60 mix-blend-screen">
                <ImageSequence
                    ref={sequenceRef}
                    frameCount={144}
                    folderPath="/frames"
                    fileNamePrefix="ezgif-frame-"
                    fileNameSuffix=".jpg"
                />
            </div>

            <div className="vignette"></div>
            <div className="grid-overlay"></div>
            <div className="film-grain"></div>

            <DataHUD />

            {/* CONTENT LAYERS - POINTER EVENTS NONE EXCEPT INTERACTIVE ELEMENTS */}
            <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">

                {/* 1. HERO */}
                <div ref={heroRef} className="absolute inset-0 flex flex-col items-center justify-center p-6">
                    <div className="tech-border p-8 bg-black/40 backdrop-blur-sm max-w-full">
                        <div className="font-mono text-accent text-xs md:text-sm tracking-[0.5em] mb-4 text-center">[ SYSTEM_BOOT_SEQUENCE ]</div>
                        <h1 className="text-[12vw] md:text-[9rem] font-serif leading-[0.85] tracking-tighter text-center uppercase mix-blend-difference break-words">
                            GV<br />Prakash
                        </h1>
                        <div className="mt-8 flex justify-between w-full text-[10px] md:text-xs font-mono text-gray-400">
                            <span>/// AUDIO_CORE_ACTIVE</span>
                            <span>VOL_100</span>
                        </div>
                    </div>
                </div>

                {/* 2. MANIFESTO (Brutalist Blocks) */}
                <div ref={manifestoRef} className="absolute inset-0 flex items-center justify-center p-6 md:p-12 opacity-0">
                    <div className="max-w-4xl w-full relative">
                        <div className="absolute -top-10 -left-10 md:-top-20 md:-left-20 text-[20vw] md:text-[12rem] font-serif text-white/5 pointer-events-none">01</div>
                        <h2 className="text-4xl md:text-6xl font-serif uppercase leading-tight mb-8 relative z-10 break-words">
                            The <span className="text-accent italic">Alchemy</span> of<br />Pure Emotion
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/20 pt-8">
                            <p className="font-mono text-xs md:text-sm leading-relaxed text-gray-300">
                                &gt; INITIALIZING NARRATIVE PROTOCOL<br />
                                &gt; FROM VEYIL TO SOORARAI POTTRU<br />
                                &gt; A LEGACY OF SOULFUL STRINGS
                            </p>
                            <div className="bg-white/10 p-4 border-l-2 border-accent">
                                <GlitchText text="MUSIC IS THE WEAPON" intensity="high" className="font-bold text-lg md:text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. SOUND (Technical HUD) */}
                <div ref={soundRef} className="absolute inset-0 flex items-center justify-end p-6 md:p-12 md:pr-24 opacity-0">
                    <div className="text-right w-full md:w-auto">
                        <div className="font-mono text-accent mb-2 text-xs md:text-base">/// FREQUENCY_MODULATION</div>
                        <h2 className="text-[12vw] md:text-8xl font-serif uppercase stroke-text leading-none">Sonic</h2>
                        <h2 className="text-[12vw] md:text-8xl font-serif uppercase text-white leading-none -mt-2 md:-mt-4">Maestro</h2>
                        <div className="mt-6 flex justify-end gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-2 h-10 md:h-16 bg-white/20 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. ENERGY (Large Scale Typography) */}
                <div ref={energyRef} className="absolute inset-0 flex items-center justify-center opacity-0 overflow-hidden">
                    <div className="absolute inset-0 flex flex-col justify-center items-center py-12 gap-4">
                        <h2 className="text-[18vw] leading-none font-serif opacity-80 text-center" style={{ WebkitTextStroke: "1px #9b1799", color: "transparent" }}>RHYTHM</h2>
                        <h2 className="text-[18vw] leading-none font-serif text-white text-center">ENERGY</h2>
                    </div>
                    <div className="relative z-10 bg-accent text-black px-6 py-2 font-mono font-bold text-lg md:text-2xl uppercase transform -rotate-2">
                        Heart & Soul
                    </div>
                </div>

                {/* 5. GLOBAL (Data Intensive) */}
                <div ref={globalRef} className="absolute inset-0 flex items-center justify-center p-8 opacity-0">
                    <div className="w-full max-w-6xl border border-white/20 bg-black/80 backdrop-blur-md p-8">
                        <div className="flex justify-between items-end border-b border-white/10 pb-6 mb-6">
                            <h2 className="text-5xl font-serif uppercase">Global<br />Impact</h2>
                            <div className="font-mono text-right text-sm text-gray-400">
                                DATA_STREAM: ACTIVE<br />
                                SOURCE: EXTERNAL
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { k: "FILMS", v: "100+" },
                                { k: "EXP", v: "20Y" },
                                { k: "AWARDS", v: "INF" },
                                { k: "STATUS", v: "LEGEND" }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 p-6 border border-white/5 hover:border-accent transition-colors group">
                                    <div className="text-xs font-mono text-gray-500 mb-2 group-hover:text-accent">stat_{i}</div>
                                    <div className="text-4xl font-serif">{stat.v}</div>
                                    <div className="text-sm font-mono opacity-50">{stat.k}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 6. STAGE (Call to Action) */}
                <div ref={stageRef} className="absolute inset-0 flex flex-col items-center justify-center opacity-0 pointer-events-auto">
                    <GlitchText text="THE_MILESTONE_EVENT" intensity="medium" className="font-mono text-accent mb-6 tracking-widest" />
                    <h2 className="text-5xl md:text-8xl font-serif uppercase text-center mb-12">
                        Buy Passes<br />Now
                    </h2>

                    <button className="relative px-12 py-4 bg-white text-black font-mono font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all duration-300 group">
                        <span className="relative z-10">Get Tickets</span>
                        <div className="absolute top-0 left-0 w-full h-full bg-accent transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 z-0"></div>
                    </button>

                    <div className="mt-12 font-mono text-xs text-gray-500 uppercase tracking-[0.5em]">
                        Live at Yatra x RIT
                    </div>
                </div>

            </div>
        </div>
    );
}
