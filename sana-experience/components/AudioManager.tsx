"use client";

import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { Howl } from "howler";

export default function AudioManager() {
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.value = 50; // Low drone

        filter.type = "lowpass";
        filter.frequency.value = 200;

        gain.gain.value = 0; // Start silent

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();

        // Expose control to toggle
        (window as any).toggleAudio = () => {
            if (ctx.state === "suspended") ctx.resume();

            if (gain.gain.value > 0) {
                gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
                setIsPlaying(false);
            } else {
                gain.gain.setTargetAtTime(0.1, ctx.currentTime, 2);
                setIsPlaying(true);
            }
        };

        return () => {
            osc.stop();
            ctx.close();
        };
    }, []);

    return (
        <div className="fixed bottom-8 right-8 z-50 flex items-center font-mono text-[10px] tracking-widest text-accent/80 gap-2 mix-blend-difference">
            <span className={`w-2 h-2 ${isPlaying ? 'bg-accent animate-pulse' : 'bg-gray-800'}`}></span>
            <button
                onClick={() => (window as any).toggleAudio()}
                className="hover:bg-accent hover:text-black px-1 border border-transparent hover:border-accent transition-none"
            >
                {isPlaying ? "SYS.AUDIO: ON" : "SYS.AUDIO: OFF"}
            </button>
        </div>
    );
}
