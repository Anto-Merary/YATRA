"use client";

import { useEffect, useState } from "react";
import AudioManager from "@/components/AudioManager";
import Preloader from "@/components/Preloader";
import Scanline from "@/components/Scanline";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";

import Biography from "@/components/Biography";
import Footer from "@/components/Footer";
import CinematicBars from "@/components/CinematicBars";

export default function Home() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <Preloader onComplete={() => setLoading(false)} />}

      <Navbar />

      <CinematicBars />

      <div className="grid-overlay"></div>
      <Scanline />

      {/* Vertical Borders for Brutalist Structure */}
      <div className="fixed inset-0 pointer-events-none z-40 flex justify-between px-6 md:px-24">
        <div className="w-px h-full bg-white/10"></div>
        <div className="w-px h-full bg-white/10 hidden md:block"></div>
        <div className="w-px h-full bg-white/10"></div>
      </div>

      <main className={`bg-black text-white min-h-screen selection:bg-white selection:text-black ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-2000`}>
        <AudioManager />

        <HeroSection />

        <div className="relative z-20 bg-black">

          <Biography />
          <Footer />
        </div>

      </main>
    </>
  );
}
