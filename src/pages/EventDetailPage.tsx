import { useMemo, useRef, useLayoutEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EVENTS, type FestEvent } from "../data/events";
import { Button } from "../components/ui/button";
import { EVENT_FEES, formatFee } from "../data/eventFees";
import eventInfoBg1 from "../assets/eventinfo.webp?url";
import eventInfoBg2 from "../assets/eventinfo2.webp?url";

function dayLabel(day: FestEvent["day"]) {
  return day === "day1" ? "Day 1" : "Day 2";
}

function participationLabel(p: FestEvent["participation"]) {
  return p === "solo" ? "Solo Event" : "Group Event";
}

type BgVariant = "eventinfo" | "eventinfo2";

function accentClasses(bgVariant: BgVariant) {
  // Match the wallpaper:
  // - eventinfo.jpeg: warm pink + floral → magenta/rose accents
  // - eventinfo2.jpeg: deep blue pattern → cyan/indigo accents
  return bgVariant === "eventinfo"
    ? {
      pill: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-100",
      ring: "focus-visible:ring-fuchsia-400/55",
      cta:
        "bg-gradient-to-r from-fuchsia-500 to-rose-500 hover:from-fuchsia-400 hover:to-rose-400 hover:shadow-[0_10px_30px_rgba(217,70,239,0.32)]",
      link: "hover:text-fuchsia-100",
    }
    : {
      pill: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
      ring: "focus-visible:ring-cyan-300/55",
      cta:
        "bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 hover:shadow-[0_10px_30px_rgba(34,211,238,0.26)]",
      link: "hover:text-cyan-100",
    };
}

const DEFAULT_RULES: string[] = [
  "Reporting time: be present at least 15 minutes before your slot.",
  "Carry your college ID card for verification.",
  "Any form of misconduct may lead to disqualification.",
  "The judges’ decision will be final and binding.",
];

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement | null>(null);

  // Resolve event synchronously on every render - useMemo ensures it updates when eventId changes
  const { event, bgVariant } = useMemo(() => {
    if (!eventId) {
      return { event: null as FestEvent | null, bgVariant: "eventinfo" as BgVariant };
    }

    const found = EVENTS.find((e) => e.id === eventId) ?? null;
    if (!found) {
      return { event: null as FestEvent | null, bgVariant: "eventinfo" as BgVariant };
    }

    // Auto-assign backgrounds ~50/50 across events (deterministic),
    // unless the event explicitly specifies a backgroundVariant.
    const idx = EVENTS.findIndex((e) => e.id === found.id);
    const auto: BgVariant = idx % 2 === 0 ? "eventinfo" : "eventinfo2";
    const chosen: BgVariant = found.backgroundVariant ?? auto;

    return { event: found, bgVariant: chosen };
  }, [eventId]);

  // Ensure scroll to top when navigating to this page
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [eventId]);

  const bg = bgVariant === "eventinfo" ? eventInfoBg1 : eventInfoBg2;
  const accents = accentClasses(bgVariant);

  if (!event) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />
        <div className="container-max relative z-10 py-10 sm:py-14">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-sm">
            <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
              EVENT NOT FOUND
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-semibold text-white/90">
              This event page doesn’t exist (yet).
            </div>
            <div className="mt-3 text-sm text-white/60">
              Go back to the events list and try another event.
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate("/yatraevents")}
                className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Back to Events
              </Button>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rules = event.rules?.length ? event.rules : DEFAULT_RULES;
  const fee = EVENT_FEES[event.id];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black" style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Background wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bg})`,
          // Let the wallpaper be visible; we’ll handle readability via tinted overlays.
          filter: "brightness(0.85) contrast(1.05) saturate(1.15)",
          opacity: 0.9,
        }}
      />
      {/* Fixed readability overlays */}
      <div
        className="fixed inset-0 z-[-1] pointer-events-none"
        style={{
          background:
            bgVariant === "eventinfo"
              ? "linear-gradient(to bottom, rgba(20,0,10,0.55) 0%, rgba(0,0,0,0.72) 55%, rgba(0,0,0,0.9) 100%)"
              : "linear-gradient(to bottom, rgba(0,8,22,0.62) 0%, rgba(0,0,0,0.78) 55%, rgba(0,0,0,0.92) 100%)",
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
        }}
      />
      <div
        className="fixed inset-0 z-[-1] pointer-events-none"
        style={{
          background:
            bgVariant === "eventinfo"
              ? "radial-gradient(circle at top, rgba(244,114,182,0.22), transparent 55%)"
              : "radial-gradient(circle at top, rgba(34,211,238,0.18), transparent 55%)",
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
        }}
      />

      <div className="container-max relative z-10 py-6 sm:py-8 md:py-12">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/yatraevents"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/[0.06]"
          >
            <span aria-hidden="true">←</span>
            Back to Events
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em] ${accents.pill}`}
            >
              {dayLabel(event.day)}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em] ${accents.pill}`}
            >
              {participationLabel(event.participation)}
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7 backdrop-blur-sm">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* Poster - on top for mobile, on the right for large screens */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {event.posterUrl ? (
                  <img
                    src={event.posterUrl}
                    alt={`${event.name} poster`}
                    className="h-[340px] w-full object-cover sm:h-[420px]"
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : null}
                {!event.posterUrl && (
                  <div className="flex h-[340px] w-full items-center justify-center sm:h-[420px]">
                    <div className="text-center">
                      <div className="text-3xl">📸</div>
                      <div className="mt-2 text-xs text-white/55">
                        Poster placeholder
                      </div>
                      <div className="mt-1 text-[11px] text-white/40">
                        Add <span className="font-mono text-white/60">posterUrl</span>{" "}
                        for this event
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Register Now Button */}
              <div
                ref={formRef}
                className="mt-4"
              >
                <div className="inline-block w-full">
                  <div className="mb-2 text-xs text-white/70">
                    {fee ? formatFee(fee) : "Fee: TBA"}
                  </div>
                  <Button
                    onClick={() => {
                      window.open("https://formbuilder.ccavenue.com/live/icici-bank/rajalakshmi-institue-of-technology-2/yatra-event-reg-fees-link", "_blank");
                    }}
                    className={`w-full h-10 rounded-xl text-sm font-semibold text-white ${accents.cta}`}
                  >
                    Register & Pay
                  </Button>
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="order-2 lg:order-1 min-w-0">
              <div className="text-[10px] xs:text-xs font-semibold tracking-[0.25em] text-yatra-300">
                EVENT DETAILS
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white/95">
                {event.name}
              </h1>

              <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/70">
                {event.description}
              </p>

              {/* Rules & Regulations */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
                  RULES & REGULATIONS
                </div>
                <ul className="mt-4 space-y-2 text-sm text-white/75">
                  {rules.map((r, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

