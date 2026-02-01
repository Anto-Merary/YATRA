import { useState, useEffect } from "react";
import { RegistrationForm } from "@/components/Form";

function OneDayCountdown() {
  const [endTime] = useState(() => Date.now() + 24 * 60 * 60 * 1000);
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);

  const tick = () => {
    const now = Date.now();
    const diff = Math.max(0, endTime - now);
    if (diff <= 0) {
      setLeft({ d: 0, h: 0, m: 0, s: 0 });
      return;
    }
    setLeft({
      d: Math.floor(diff / (24 * 60 * 60 * 1000)),
      h: Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
      m: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
      s: Math.floor((diff % (60 * 1000)) / 1000),
    });
  };

  useEffect(() => {
    setMounted(true);
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  if (!mounted) return null;

  return (
    <div className="mb-8 inline-block rounded-xl border border-yatra-400/40 bg-black/40 px-6 py-4 backdrop-blur-sm">
      <div className="text-xs font-semibold tracking-[0.2em] text-yatra-300 mb-2">
        OFFER ENDS IN
      </div>
      <div className="flex items-center justify-center gap-2 sm:gap-3 font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
        <span className="flex flex-col items-center">
          <span className="text-yatra-400">{String(left.d).padStart(2, "0")}</span>
          <span className="text-[10px] font-normal text-white/60 uppercase">Days</span>
        </span>
        <span className="text-white/50">:</span>
        <span className="flex flex-col items-center">
          <span className="text-yatra-400">{String(left.h).padStart(2, "0")}</span>
          <span className="text-[10px] font-normal text-white/60 uppercase">Hrs</span>
        </span>
        <span className="text-white/50">:</span>
        <span className="flex flex-col items-center">
          <span className="text-yatra-400">{String(left.m).padStart(2, "0")}</span>
          <span className="text-[10px] font-normal text-white/60 uppercase">Min</span>
        </span>
        <span className="text-white/50">:</span>
        <span className="flex flex-col items-center">
          <span className="text-yatra-400">{String(left.s).padStart(2, "0")}</span>
          <span className="text-[10px] font-normal text-white/60 uppercase">Sec</span>
        </span>
      </div>
    </div>
  );
}

export function YatraEntryPage() {
  return (
    <div className="container-max py-8 sm:py-12">
      <div className="mx-auto max-w-2xl text-white text-center">
        <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300 mb-6">
          YATRA ENTRY PASS (MANDATORY)
        </div>

        <OneDayCountdown />

        <RegistrationForm />
      </div>
    </div>
  );
}

