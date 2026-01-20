import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { Button } from "../components/ui/button";
import { useMobile } from "../hooks/use-mobile";

import ritLogoImage from "../assets/RIT WHITE LOGO.png?url";
import posterImage from "../assets/mrmrs.webp?url";
import rulesImage from "../assets/mrrules.webp?url";

const EVENT_NAME = "MR & MRS YATRA";
const PRIZE_POOL = "₹5000";
const ENTRY_FEE = "₹300";
const EVENT_DATE = "TBA";

export function MrMsYatraPage() {
  const { prefersReducedMotion } = useMobile();
  const [rulesOpen, setRulesOpen] = useState(false);

  const infoCards = useMemo(
    () => [
      { label: "PRIZE POOL", value: PRIZE_POOL, accent: "from-cyan-400/25 to-indigo-500/10" },
      { label: "ENTRY FEE", value: ENTRY_FEE, accent: "from-fuchsia-500/20 to-rose-500/10" },
      { label: "DATE", value: EVENT_DATE, accent: "from-purple-500/20 to-cyan-400/10" },
    ],
    [],
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#070814] via-black to-black">
        {/* Premium background */}
        {!prefersReducedMotion && (
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 20% 15%, rgba(34,211,238,0.22), transparent 55%)",
                "radial-gradient(circle at 80% 20%, rgba(236,72,153,0.18), transparent 55%)",
                "radial-gradient(circle at 65% 80%, rgba(168,85,247,0.16), transparent 60%)",
                "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px)",
                "linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
              ].join(","),
              backgroundSize: "100% 100%, 100% 100%, 100% 100%, 22px 22px, 22px 22px",
            }}
          />
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/35 via-black/55 to-black/80" />

        <div className="relative z-10">
          <div className="container-max px-4 sm:px-6 py-6 sm:py-10 md:py-12">
            {/* Top row */}
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <img
                  src={ritLogoImage}
                  alt="RIT Logo"
                  className="h-9 w-auto opacity-85"
                  draggable={false}
                />
                <div className="hidden sm:block text-xs tracking-[0.22em] text-white/55">
                  RAJALAKSHMI INSTITUTE OF TECHNOLOGY
                </div>
              </div>
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-emerald-200">
                REGISTRATION OPEN
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.05 }}
              className="mt-6"
            >
              <h1 className="font-victory-striker text-[46px] leading-none sm:text-6xl md:text-7xl text-white uppercase">
                {EVENT_NAME}
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-white/70">
                Step into the spotlight. A premium stage for confidence, personality, and presence — made to crown the best.
              </p>
            </motion.div>

            {/* Main layout */}
            <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              {/* Poster (left) */}
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12 }}
                className="relative"
              >
                <div
                  className="absolute -inset-6 rounded-[28px] blur-2xl opacity-60 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 20%, rgba(236,72,153,0.22), transparent 55%), radial-gradient(circle at 70% 70%, rgba(34,211,238,0.18), transparent 55%)",
                  }}
                />
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_25px_70px_rgba(0,0,0,0.6)]">
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <img
                    src={posterImage}
                    alt={`${EVENT_NAME} poster`}
                    className="h-[420px] w-full object-cover sm:h-[520px] lg:h-[600px]"
                    draggable={false}
                    loading="eager"
                  />
                </div>
              </motion.div>

              {/* Right side */}
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.18 }}
                className="min-w-0"
              >
                {/* 3 info rectangles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {infoCards.map((c) => (
                    <div
                      key={c.label}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${c.accent} opacity-70`} />
                      <div className="relative">
                        <div className="text-[11px] font-semibold tracking-[0.22em] text-white/65">
                          {c.label}
                        </div>
                        <div className="mt-2 text-xl sm:text-2xl font-semibold text-white">
                          {c.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* About */}
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 backdrop-blur-sm">
                  <div className="text-[11px] font-semibold tracking-[0.22em] text-white/65">
                    ABOUT
                  </div>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/75">
                    MR &amp; MRS YATRA is a premium spotlight event designed to celebrate confidence, charisma, and stage presence.
                    Come prepared to introduce yourself, show your personality, and own the stage — in front of an energetic crowd.
                  </p>
                </div>

                {/* CTAs */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <a
                    href="https://formbuilder.ccavenue.com/live/icici-bank/rajalakshmi-institue-of-technology-2/yatra-2026-reg-fees-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      className="w-full sm:w-auto h-12 rounded-2xl px-6 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 shadow-[0_18px_60px_rgba(236,72,153,0.25)]"
                    >
                      REGISTER NOW
                    </Button>
                  </a>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRulesOpen(true)}
                    className="w-full sm:w-auto h-12 rounded-2xl border border-white/10 bg-white/[0.05] text-white/85 hover:bg-white/[0.08]"
                  >
                    RULES
                  </Button>
                </div>

                <div className="mt-3 text-xs text-white/45">
                  Tip: Bring your college ID and arrive early to avoid last-minute rush.
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Rules modal */}
        <Modal open={rulesOpen} onOpenChange={setRulesOpen} title={`${EVENT_NAME} — Rules`}>
          <div className="grid gap-3">
            <div className="text-sm text-white/70">Here are the official rules for the event.</div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
              <img
                src={rulesImage}
                alt={`${EVENT_NAME} rules`}
                className="w-full h-auto"
                draggable={false}
              />
            </div>
            <a
              href={rulesImage}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
            >
              Open rules in new tab
            </a>
          </div>
        </Modal>
      </div>
    </div>
  );
}
