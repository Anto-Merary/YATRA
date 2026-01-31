
import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, useSpring } from 'framer-motion';
import { Lock, Zap, Clock } from 'lucide-react';
import './Hero.css'; // Ensure we have access to hero styles if needed

// Mock Data
const ARTISTS = [
    {
        id: 0,
        status: 'countdown',
        name: "REVEAL TIMER",
        role: "DROPPING SOON",
        image: "/gvbackcard (1).webp",
        color: "#ff3333" // Red
    },
    {
        id: 1,
        name: "GV PRAKASH",
        role: "THE HEADLINER",
        image: "/gvfrontcard.webp",
        status: "revealed",
        color: "#FFD700", // Gold
        description: "The Musical Mastro"
    },
    {
        id: 2,
        name: "MYSTERY PRO",
        role: "PRO SHOW",
        image: null,
        status: "locked",
        color: "#9b1799", // Purple
        unlockDate: "FEB 14"
    },
    {
        id: 3,
        name: "DJ NIGHT",
        role: "AFTER PARTY",
        image: null,
        status: "locked",
        color: "#00f0ff", // Cyan
        unlockDate: "FEB 15"
    },
    {
        id: 4,
        name: "CULTURALS",
        role: "DANCE BATTLE",
        image: null,
        status: "locked",
        color: "#ff0055", // Pink
        unlockDate: "FEB 16"
    },
    {
        id: 5,
        name: "SPECIAL ACT",
        role: "COMING SOON",
        image: null,
        status: "locked",
        color: "#00ff88", // Green
        unlockDate: "SOON"
    }
];

const CARD_WIDTH = 280;
const CARD_GAP = 20;

export default function LineupReveal() {
    const [activeIndex, setActiveIndex] = useState(0);
    const x = useMotionValue(0);
    const containerRef = useRef(null);

    // Countdown Logic
    const [countdown, setCountdown] = useState("48 : 00 : 00");

    useEffect(() => {
        // Set target to 48 hours from now (mock) or fixed date
        const target = Date.now() + 48 * 60 * 60 * 1000;

        const interval = setInterval(() => {
            const now = Date.now();
            const distance = target - now;

            if (distance < 0) {
                setCountdown("00 : 00 : 00");
                clearInterval(interval);
                return;
            }

            const h = Math.floor(distance / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);

            setCountdown(`${h.toString().padStart(2, '0')} : ${m.toString().padStart(2, '0')} : ${s.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Smooth spring for the x value to snap to
    const xSpring = useSpring(x, { stiffness: 300, damping: 30 });

    // Dynamic Background Color based on active index
    const activeColor = ARTISTS[activeIndex].color;

    // Parallax Text
    const textX = useTransform(x, [-1000, 1000], [200, -200]);

    // Handle Drag End to Snap
    const handleDragEnd = (event, info) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;
        const direction = velocity < 0 || offset < -100 ? 1 : velocity > 0 || offset > 100 ? -1 : 0;

        let newIndex = activeIndex + direction;
        newIndex = Math.max(0, Math.min(newIndex, ARTISTS.length - 1));

        setActiveIndex(newIndex);

        const newX = -newIndex * (CARD_WIDTH + CARD_GAP);
        animate(x, newX, { type: "spring", stiffness: 300, damping: 30 });
    };

    // Center the initial card
    useEffect(() => {
        // Center logic if needed, but simple drag snap is fine
        // We start at 0
    }, []);

    return (
        <div
            className="relative flex flex-col items-center justify-center overflow-hidden"
            style={{ width: '100%', height: '100vh', backgroundColor: '#000', position: 'relative', zIndex: 50 }}
        >
            {/* Ambient Lighting */}
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                animate={{
                    background: `radial-gradient(circle at 50% 50%, ${activeColor}40 0%, transparent 70%)`
                }}
                transition={{ duration: 0.8 }}
            />

            {/* Kinetic Typography */}
            <div className="absolute top-1/2 left-0 w-full z-0 overflow-hidden pointer-events-none flex justify-center items-center opacity-10 -translate-y-1/2">
                <motion.div style={{ x: textX }} className="whitespace-nowrap">
                    <h1 className="text-[25vw] font-black text-transparent stroke-text" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.5)" }}>
                        LINEUP
                    </h1>
                </motion.div>
            </div>

            {/* 3D Carousel */}
            <div className="relative z-10 w-full flex items-center justify-center perspective-1000">
                <motion.div
                    className="flex items-center cursor-grab active:cursor-grabbing"
                    style={{ x: x, gap: CARD_GAP, marginLeft: `calc(50% - ${CARD_WIDTH / 2}px)` }} // Center the first card
                    drag="x"
                    dragConstraints={{ left: -((ARTISTS.length - 1) * (CARD_WIDTH + CARD_GAP)), right: 0 }}
                    onDragEnd={handleDragEnd}
                >
                    {ARTISTS.map((artist, index) => (
                        <Card
                            key={artist.id}
                            artist={artist}
                            index={index}
                            x={x}
                            isActive={index === activeIndex}
                            countdown={countdown}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Bottom info (optional, instructions) */}
            <div className="absolute bottom-10 z-20 text-white/50 text-xs tracking-widest uppercase animate-pulse">
                {ARTISTS[activeIndex].status === 'locked' ? 'Tap to Inspect' : 'Swipe to Explore'}
            </div>
        </div>
    );
}

function Card({ artist, index, x, isActive, countdown }) {
    // Calculate relative position of card to the center
    // But wait, x is the container scroll. 
    // We need to map container x to card transform individually?
    // Easier: simpler transform based on isActive prop + distance
    // But for smooth swiping we want continous value.

    const position = index * (CARD_WIDTH + CARD_GAP);
    const range = [-(position + CARD_WIDTH), -position, -(position - CARD_WIDTH)]; // When x is making this card centered

    // Ideally: when x = -position, this card is at 0 (center)
    const center = -position;
    const distance = CARD_WIDTH + CARD_GAP;

    // Custom Transforms
    const scale = useTransform(x, [center - distance, center, center + distance], [0.85, 1.1, 0.85]);
    const opacity = useTransform(x, [center - distance, center, center + distance], [0.5, 1, 0.5]);
    const rotateY = useTransform(x, [center - distance, center, center + distance], [15, 0, -15]);
    const zIndex = isActive ? 10 : 0;

    // Reflection style
    const reflectionStyle = isActive ? {
        WebkitBoxReflect: `below 10px linear-gradient(transparent 70%, rgba(0,0,0,0.4))`
    } : {};

    return (
        <motion.div
            style={{
                width: CARD_WIDTH,
                height: CARD_WIDTH * 1.4, // Aspect Ratio
                scale,
                opacity,
                rotateY,
                zIndex
            }}
            className="relative shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border border-white/10"
        >
            <div className="w-full h-full relative" style={reflectionStyle}>
                {/* Image / Locked State */}
                {artist.status === 'revealed' ? (
                    <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                ) : artist.status === 'countdown' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 relative overflow-hidden">
                        <img src={artist.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-1 font-mono text-white text-lg font-bold">
                                {countdown.split(' : ').map((part, i, arr) => (
                                    <React.Fragment key={i}>
                                        <div className="bg-black/80 border border-white/10 p-2 rounded shadow-[0_0_15px_rgba(255,51,51,0.4)] min-w-[3rem] text-center">
                                            {part}
                                        </div>
                                        {i < arr.length - 1 && <span className="animate-pulse text-red-500">:</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                            <p className="text-white/40 text-[10px] tracking-[0.3em] mt-3 animate-pulse uppercase">Reveal Dropping</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 relative overflow-hidden group">
                        {/* Glitch / Locked BG */}
                        <div className="absolute inset-0 bg-noise opacity-20"></div>
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
                            >
                                <Lock className="w-8 h-8 text-white/70" />
                            </motion.div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-white tracking-widest font-akira glitch-text-effect" data-text="LOCKED">LOCKED</h3>
                                <p className="text-xs text-white/50 mt-1 tracking-widest font-mono border border-white/20 px-2 py-1 rounded inline-block">
                                    {artist.unlockDate}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Overlay Info (Glassmorphism) */}
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/50 to-transparent pt-12">
                    <div className="backdrop-blur-md bg-white/10 border border-white/10 p-4 rounded-xl">
                        <h3 className="text-white font-bold text-lg tracking-wider font-akira truncate">{artist.name}</h3>
                        <p className="text-xs text-white/70 tracking-widest uppercase mt-1 flex items-center gap-2">
                            {artist.status === 'revealed' ? <Zap size={12} fill="currentColor" /> : <Clock size={12} />}
                            {artist.role}
                        </p>
                    </div>
                </div>

                {/* Flash Effect on Active */}
                {isActive && artist.status === 'revealed' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.4, 0] }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="absolute inset-0 bg-white pointer-events-none mix-blend-overlay"
                    />
                )}
            </div>
        </motion.div>
    );
}
