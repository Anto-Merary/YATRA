import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type GuestRevealProps = {
  title?: string;
  guestName: string;
  description: string;
  /** Optional image URL; if omitted, a silhouette placeholder is shown */
  imageUrl?: string;
  /** When the guest is revealed (countdown runs until this moment) */
  revealAt: Date;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${days}d ${hours}h ${mins}m ${secs}s`;
}

function formatCountdownDigits(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return { days, hours, mins, secs };
}

function Silhouette() {
  return (
    <svg
      viewBox="0 0 256 256"
      className="h-full w-full"
      aria-label="Guest silhouette"
      role="img"
    >
      <defs>
        <linearGradient id="sil" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>
      <path
        d="M128 20c-30 0-54 24-54 54 0 19 10 36 25 46-29 12-49 40-49 73v23h156v-23c0-33-20-61-49-73 15-10 25-27 25-46 0-30-24-54-54-54Z"
        fill="url(#sil)"
      />
    </svg>
  );
}

export function GuestReveal({
  title = "THE GUEST OF HONNOR",
  guestName,
  description,
  imageUrl,
  revealAt,
}: GuestRevealProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const remainingMs = Math.max(0, revealAt.getTime() - now);
  const isRevealed = remainingMs === 0;
  const countdown = formatCountdownDigits(remainingMs);

  // A simple 7-day progress window for the countdown bar.
  const progress = useMemo(() => {
    const windowMs = 7 * 24 * 60 * 60 * 1000;
    return clamp01(1 - remainingMs / windowMs);
  }, [remainingMs]);

  return (
    <section className="container-max py-14">
      <div className="text-center text-sm font-semibold tracking-[0.25em] text-yatra-300 mb-12">
        {title}
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-fr">
        {/* Large Image Card - Spans 2 columns, 2 rows */}
        <motion.div
          className="md:col-span-2 md:row-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 overflow-hidden backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ borderColor: "rgba(255,255,255,0.2)" }}
        >
          <div className="h-full w-full rounded-xl overflow-hidden border border-white/10 bg-white/[0.04]">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={guestName}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-10">
                <Silhouette />
              </div>
            )}
          </div>
        </motion.div>

        {/* Guest Name Card - Spans 2 columns */}
        <motion.div
          className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex items-center backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ borderColor: "rgba(255,255,255,0.2)", scale: 1.02 }}
        >
          <div className="font-display text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white">
            {guestName}
          </div>
        </motion.div>

        {/* Countdown Card - Spans 2 columns */}
        <motion.div
          className="md:col-span-2 rounded-2xl border border-white/10 bg-gradient-to-br from-yatra-500/10 via-yatra-400/5 to-transparent p-6 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ borderColor: "rgba(168,85,247,0.4)", scale: 1.02 }}
        >
          {!isRevealed ? (
            <>
              <div className="mb-4 text-xs font-semibold tracking-widest text-yatra-300 uppercase">
                Reveal In
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: countdown.days, label: "Days" },
                  { value: countdown.hours, label: "Hours" },
                  { value: countdown.mins, label: "Mins" },
                  { value: countdown.secs, label: "Secs" },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] p-3"
                  >
                    <motion.div
                      key={item.value}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="font-mono text-2xl font-bold text-white"
                    >
                      {String(item.value).padStart(2, "0")}
                    </motion.div>
                    <div className="mt-1 text-[10px] font-medium text-white/50 uppercase tracking-wider">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-yatra-500 to-yatra-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">Revealed!</div>
                <div className="mt-2 text-sm text-white/60">Guest information is now available</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Description Card - Spans 2 columns */}
        <motion.div
          className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
          style={{ width: '1124px' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ borderColor: "rgba(255,255,255,0.2)", scale: 1.02 }}
        >
          <div className="mb-3 text-xs font-semibold tracking-widest text-white/40 uppercase">
            About
          </div>
          <p className="text-sm leading-relaxed text-white/70">{description}</p>
        </motion.div>
      </div>
    </section>
  );
}


