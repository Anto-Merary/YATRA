import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import PixelBlast from "@/components/PixelBlast";

type TicketCard = {
  name: string;
  perks: string[];
  isEarlyBird?: boolean;
  originalPrice?: string;
  discountedPrice?: string;
  timerEndDate?: Date;
};

// Set the Early Bird timer end date (adjust as needed)
const EARLY_BIRD_END_DATE = new Date("2026-02-15T23:59:59");

const TICKETS: TicketCard[] = [
  {
    name: "Early Bird",
    perks: [
      "Yatra Entry Pass",
      "Access to 2 DAYS",
      "Proshow",
      "DJ Night",
    ],
    isEarlyBird: true,
    originalPrice: "₹500",
    discountedPrice: "₹300",
    timerEndDate: EARLY_BIRD_END_DATE,
  },
  {
    name: "Event",
    perks: [
      "Event entry pass",
      "Select your specific Events",
      "Only access to events",
    ],
  },
];

function formatCountdownDigits(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return { days, hours, mins, secs };
}

function CountdownTimer({ endDate }: { endDate: Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const remainingMs = Math.max(0, endDate.getTime() - now);
  const countdown = formatCountdownDigits(remainingMs);

  return (
    <div className="mb-4 sm:mb-6 rounded-xl border border-yatra-400/30 bg-yatra-500/10 p-3 sm:p-4">
      <div className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold tracking-widest text-yatra-300 uppercase">
        Offer Ends In <span className="text-pink-400/80">할인 종료</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { value: countdown.days, label: "Days" },
          { value: countdown.hours, label: "Hours" },
          { value: countdown.mins, label: "Mins" },
          { value: countdown.secs, label: "Secs" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] p-1.5 sm:p-2"
          >
            <motion.div
              key={item.value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-base sm:text-lg md:text-xl font-bold text-white"
            >
              {String(item.value).padStart(2, "0")}
            </motion.div>
            <div className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] font-medium text-white/50 uppercase tracking-wider">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedPrice({
  originalPrice,
  discountedPrice,
}: {
  originalPrice: string;
  discountedPrice: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <motion.span
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative text-xl font-semibold text-white/50"
      >
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute inset-0 flex items-center"
        >
          <span className="h-0.5 w-full bg-white/70" />
        </motion.span>
        {originalPrice}
      </motion.span>
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="text-2xl font-black tracking-tight text-yatra-400"
      >
        {discountedPrice}
      </motion.span>
    </div>
  );
}

export function TicketsPage() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Drop shadow on top - prominent gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {/* PixelBlast Background - covers entire page */}
      <div className="absolute inset-0 z-0 opacity-40 w-full h-full">
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#ec4899"
          patternScale={2}
          patternDensity={0.8}
          enableRipples={true}
          rippleIntensityScale={0.8}
          rippleThickness={0.15}
          rippleSpeed={0.25}
          pixelSizeJitter={0.1}
          edgeFade={0.3}
          transparent={true}
          speed={0.3}
        />
      </div>

      {/* Content Layer */}
      <div className="container-max py-8 sm:py-12 md:py-14 relative z-10 px-4">
        <div className="text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-yatra-300">TICKETS <span className="text-pink-400/80">티켓</span></div>
        <div className="mt-2 sm:mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
          <span className="text-pink-400">티켓</span> Choose your pass
        </div>
        <div className="mt-2 max-w-2xl text-xs sm:text-sm text-white/70">
          <span className="text-pink-300/80">선택</span> Select the perfect ticket option for your Yatra <span className="text-pink-300/80">경험</span> experience
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10 grid gap-4 sm:gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {TICKETS.map((ticket) => (
            <SpotlightCard
              key={ticket.name}
              className="flex flex-col border-white/10 bg-white/[0.04] p-4 sm:p-5"
              spotlightColor="rgba(106, 92, 255, 0.28)"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-lg sm:text-xl font-semibold">{ticket.name}</div>
                {ticket.isEarlyBird && ticket.originalPrice && ticket.discountedPrice && (
                  <AnimatedPrice
                    originalPrice={ticket.originalPrice}
                    discountedPrice={ticket.discountedPrice}
                  />
                )}
              </div>

              {ticket.isEarlyBird && ticket.timerEndDate && (
                <div className="mt-4">
                  <CountdownTimer endDate={ticket.timerEndDate} />
                </div>
              )}

              <div className="mt-4 h-px bg-white/10" />

              <ul className="mt-4 flex-1 space-y-2 text-sm text-white/75">
                {ticket.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yatra-400" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              {ticket.name === "Event" ? (
                <Link
                  to="/events"
                  className="mt-4 sm:mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 sm:px-4 sm:py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors touch-manipulation w-full sm:w-auto"
                  style={{ minHeight: "44px" }}
                >
                  <span className="text-pink-600">예매</span> Register now
                </Link>
              ) : (
                <a
                  href="/"
                  className="mt-4 sm:mt-6 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 sm:px-4 sm:py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors touch-manipulation w-full sm:w-auto"
                  style={{ minHeight: "44px" }}
                >
                  <span className="text-pink-600">구매</span> Buy now
                </a>
              )}
            </SpotlightCard>
          ))}
        </div>
      </div>
    </div>
  );
}
