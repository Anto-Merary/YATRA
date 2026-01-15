import { useMemo, useRef, useLayoutEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EVENTS, type FestEvent } from "../data/events";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import eventInfoBg1 from "../assets/eventinfo.jpeg?url";
import eventInfoBg2 from "../assets/eventinfo2.jpeg?url";

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
  const [numberOfMembers, setNumberOfMembers] = useState<number>(2);

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
                onClick={() => navigate("/events")}
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
            to="/events"
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
            <div className="min-w-0">
              <div className="text-[10px] xs:text-xs font-semibold tracking-[0.25em] text-yatra-300">
                EVENT DETAILS
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white/95">
                {event.name}
              </h1>

              <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/70">
                {event.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] tracking-[0.22em] text-white/45">
                    VENUE
                  </div>
                  <div className="mt-1 text-sm text-white/85">{event.venue}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] tracking-[0.22em] text-white/45">
                    DATE
                  </div>
                  <div className="mt-1 text-sm text-white/85">
                    {event.date ?? "TBA"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-[11px] tracking-[0.22em] text-white/45">
                    TIME
                  </div>
                  <div className="mt-1 text-sm text-white/85">
                    {event.time ?? "TBA"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => {
                    formRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className={`h-11 rounded-xl px-5 text-sm font-semibold text-white ${accents.cta}`}
                >
                  Register for this event
                </Button>

                <a
                  href={`tel:${event.organizerPhone}`}
                  className={[
                    "inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white/85 backdrop-blur-sm transition-colors hover:bg-white/[0.06]",
                    accents.link,
                  ].join(" ")}
                >
                  Call Event Incharge
                </a>
              </div>
            </div>

            {/* Poster */}
            <div className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                {event.posterUrl ? (
                  <img
                    src={event.posterUrl}
                    alt={`${event.name} poster`}
                    className="h-[340px] w-full object-cover sm:h-[420px]"
                    draggable={false}
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

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
                  CONTACT
                </div>
                <div className="mt-3 grid gap-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-white/50">Event Incharge</span>
                    <span className="text-white/85">{event.organizerName}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-white/50">Phone</span>
                    <a
                      href={`tel:${event.organizerPhone}`}
                      className={[
                        "text-white/85 underline decoration-white/20 underline-offset-4 transition-colors",
                        accents.link,
                      ].join(" ")}
                    >
                      {event.organizerPhone}
                    </a>
                  </div>
                  {event.contactEmail && (
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-white/50">Email</span>
                      <a
                        href={`mailto:${event.contactEmail}`}
                        className={[
                          "text-white/85 underline decoration-white/20 underline-offset-4 transition-colors",
                          accents.link,
                        ].join(" ")}
                      >
                        {event.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
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
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
                WHAT YOU’LL NEED
              </div>
              <div className="mt-3 text-sm leading-relaxed text-white/70">
                This section is a template placeholder. Add event-specific requirements
                like props, dress code, devices, file formats, or team size rules.
              </div>
            </section>
          </div>

          {/* Registration */}
          <section
            ref={formRef}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
                  REGISTRATION
                </div>
                <div className="mt-2 text-lg font-semibold text-white/90">
                  Register for {event.name}
                </div>
                <div className="mt-1 text-sm text-white/60">
                  Form integration coming next — this is the page-ready template.
                </div>
              </div>
            </div>

            <form
              className="mt-5 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              {event.participation === "group" ? (
                <>
                  {/* Team Leader Details Section */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-xs font-semibold tracking-[0.2em] text-yatra-300 mb-4">
                      TEAM LEADER DETAILS
                    </div>
                    <div className="grid gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="leaderName" className="text-white/75">
                            Team Leader Name
                          </Label>
                          <Input
                            id="leaderName"
                            placeholder="Team leader's name"
                            className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="leaderPhone" className="text-white/75">
                            Phone number
                          </Label>
                          <Input
                            id="leaderPhone"
                            placeholder="+91 XXXXX XXXXX"
                            className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="leaderEmail" className="text-white/75">
                          Email
                        </Label>
                        <Input
                          id="leaderEmail"
                          type="email"
                          placeholder="leader@example.com"
                          className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="leaderCollege" className="text-white/75">
                            College
                          </Label>
                          <Input
                            id="leaderCollege"
                            placeholder="College name"
                            className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="leaderDept" className="text-white/75">
                            Department
                          </Label>
                          <Input
                            id="leaderDept"
                            placeholder="Department"
                            className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Number of Team Members */}
                  <div className="grid gap-2">
                    <Label htmlFor="numMembers" className="text-white/75">
                      Number of Team Members
                    </Label>
                    <Input
                      id="numMembers"
                      type="number"
                      min="2"
                      max="20"
                      value={numberOfMembers}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 2;
                        setNumberOfMembers(Math.max(2, Math.min(20, value)));
                      }}
                      placeholder="Enter number of team members"
                      className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                    />
                  </div>

                  {/* Team Members Names */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="text-xs font-semibold tracking-[0.2em] text-yatra-300 mb-4">
                      TEAM MEMBERS
                    </div>
                    <div className="grid gap-3">
                      {Array.from({ length: numberOfMembers }, (_, i) => (
                        <div key={i} className="grid gap-2">
                          <Label htmlFor={`member-${i + 1}`} className="text-white/75">
                            Member {i + 1} Name
                          </Label>
                          <Input
                            id={`member-${i + 1}`}
                            placeholder={`Enter name of member ${i + 1}`}
                            className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="grid gap-2">
                    <Label htmlFor="notes" className="text-white/75">
                      Notes (optional)
                    </Label>
                    <Input
                      id="notes"
                      placeholder="Anything the coordinators should know"
                      className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Solo Event Form */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName" className="text-white/75">
                        Full name
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Your name"
                        className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="text-white/75">
                        Phone number
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+91 XXXXX XXXXX"
                        className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-white/75">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="college" className="text-white/75">
                        College
                      </Label>
                      <Input
                        id="college"
                        placeholder="College name"
                        className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dept" className="text-white/75">
                        Department
                      </Label>
                      <Input
                        id="dept"
                        placeholder="Department"
                        className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes" className="text-white/75">
                      Notes (optional)
                    </Label>
                    <Input
                      id="notes"
                      placeholder="Anything the coordinators should know"
                      className={`border-white/10 bg-white/[0.04] text-white placeholder:text-white/35 ${accents.ring}`}
                    />
                  </div>
                </>
              )}

              <div className="mt-1 grid gap-3">
                <Button
                  type="submit"
                  className={`h-11 rounded-xl text-sm font-semibold text-white ${accents.cta}`}
                >
                  Submit registration
                </Button>
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-center text-sm text-white/65 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
                >
                  Or open the current registration link
                </a>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

