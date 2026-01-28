import { motion } from "framer-motion";
import { useMemo, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../components/Modal";
import { Button } from "../components/ui/button";
import { useMobile } from "../hooks/use-mobile";

import posterImage from "../assets/dance.webp?url";
import rulesImage from "../assets/mrrules.webp?url";

const EVENT_NAME = "DANCE BATTLE";

export function ProDanceBattlePage() {
  const { prefersReducedMotion } = useMobile();
  const [rulesOpen, setRulesOpen] = useState(false);
  const navigate = useNavigate();

  // Ensure scroll to top when navigating to this page
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const handleBack = () => {
    // Prefer history back, but fall back to Events hub if user landed here directly.
    if (window.history.length > 1) navigate(-1);
    else navigate("/events");
  };

  const categoryCards = useMemo(
    () => [
      {
        label: "GROUP DANCE",
        details: [
          { label: "Prize Pool", value: "₹10,000" },
          { label: "Entry Fee", value: "₹800 per team" },
          { label: "Date", value: "21/01/26" },
        ],
        accent: "from-yellow-500/25 to-orange-500/10",
      },
      {
        label: "SOLO",
        details: [
          { label: "Prize Pool", value: "₹3,000" },
          { label: "Entry Fee", value: "₹250" },
          { label: "Date", value: "21/01/26" },
        ],
        accent: "from-red-500/25 to-pink-500/10",
      },
    ],
    [],
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-yellow-900 via-red-900 to-black">
        {/* Premium background */}
        {!prefersReducedMotion && (
          <div
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage: [
                "radial-gradient(circle at 20% 15%, rgba(234,179,8,0.25), transparent 55%)",
                "radial-gradient(circle at 80% 20%, rgba(239,68,68,0.22), transparent 55%)",
                "radial-gradient(circle at 65% 80%, rgba(220,38,38,0.18), transparent 60%)",
                "radial-gradient(circle at 50% 50%, rgba(234,179,8,0.15), transparent 70%)",
                "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px)",
                "linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
              ].join(","),
              backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%, 22px 22px, 22px 22px",
            }}
          />
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/30 via-black/50 to-black/75" />

        <div className="relative z-10">
          <div className="container-max px-4 sm:px-6 py-6 sm:py-10 md:py-12">
            {/* Back button (requested for Pro Dance Battle page) */}
            <motion.button
              type="button"
              onClick={handleBack}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold tracking-[0.14em] text-white/85 backdrop-blur-sm hover:bg-white/[0.10] hover:text-white active:scale-[0.99]"
              aria-label="Go back"
            >
              <span aria-hidden="true">←</span>
              <span>BACK</span>
            </motion.button>

            {/* Top row */}
            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-4 flex items-center justify-end gap-4"
            >
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
                      "radial-gradient(circle at 30% 20%, rgba(234,179,8,0.25), transparent 55%), radial-gradient(circle at 70% 70%, rgba(239,68,68,0.22), transparent 55%)",
                  }}
                />
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_25px_70px_rgba(0,0,0,0.6)]">
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <img
                    src={posterImage}
                    alt={`${EVENT_NAME} poster`}
                    className="w-full h-auto object-contain"
                    draggable={false}
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      console.error("Failed to load poster image");
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
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
                {/* Category cards - Group Dance & Solo */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryCards.map((card) => (
                    <div
                      key={card.label}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-70`} />
                      <div className="relative">
                        <div className="text-[11px] font-semibold tracking-[0.22em] text-white/65 mb-3">
                          {card.label}
                        </div>
                        <div className="space-y-2">
                          {card.details.map((detail, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-xs text-white/60">{detail.label}:</span>
                              <span className="text-sm sm:text-base font-semibold text-white">
                                {detail.value}
                              </span>
                            </div>
                          ))}
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
                    DANCE BATTLE is a premium spotlight event designed to celebrate confidence, charisma, and stage presence.
                    Come prepared to introduce yourself, show your personality, and own the stage — in front of an energetic crowd.
                  </p>
                </div>

                {/* CTAs */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    onClick={() => window.location.assign("/events/dance-battle/register")}
                    className="w-full sm:w-auto h-12 rounded-2xl px-6 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 shadow-[0_18px_60px_rgba(236,72,153,0.25)]"
                  >
                    REGISTER NOW
                  </Button>

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
                className="w-full h-auto object-contain"
                draggable={false}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  console.error("Failed to load rules image");
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
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
  );
}
