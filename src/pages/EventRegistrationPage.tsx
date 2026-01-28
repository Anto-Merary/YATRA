import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EVENTS } from "@/data/events";
import { EVENT_FEES, formatFee } from "@/data/eventFees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function submitCcavenueForm(action: string, encRequest: string, accessCode: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;

  const enc = document.createElement("input");
  enc.type = "hidden";
  enc.name = "encRequest";
  enc.value = encRequest;

  const ac = document.createElement("input");
  ac.type = "hidden";
  ac.name = "access_code";
  ac.value = accessCode;

  form.appendChild(enc);
  form.appendChild(ac);
  document.body.appendChild(form);
  form.submit();
}

export function EventRegistrationPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const event = useMemo(() => EVENTS.find((e) => e.id === eventId) ?? null, [eventId]);
  const fee = eventId ? EVENT_FEES[eventId] : undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [college, setCollege] = useState("");
  const [variant, setVariant] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    if (!eventId) return false;
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (digitsOnly(phone).length !== 10) return false;
    if (!college.trim()) return false;
    return true;
  }, [eventId, name, email, phone, college]);

  const variantOptions = useMemo(() => {
    if (!eventId) return [] as Array<{ value: string; label: string }>;
    if (eventId === "group-dance") {
      return [
        { value: "age_11_16", label: "Group Dance (Age: 11 to 16)" },
        { value: "age_16_plus", label: "Group Dance (Age: 16 above)" },
      ];
    }
    if (eventId === "solo-dance") {
      return [
        { value: "under_18", label: "Solo Dance (Under 18)" },
        { value: "above_18", label: "Solo Dance (Above 18)" },
      ];
    }
    if (fee?.unit === "per_sport") {
      return [{ value: "esports", label: "E-Sports / Game" }];
    }
    return [];
  }, [eventId, fee?.unit]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting || !eventId || !event) return;
    setSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");

      const payload = {
        purpose: "event",
        event_id: eventId,
        event_display_name: event.name,
        event_variant: variant || undefined,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: digitsOnly(phone),
        college: college.trim(),
      };

      const res = await fetch(`${supabaseUrl}/functions/v1/ccavenue_create_order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${anonKey || ""}`,
        },
        body: JSON.stringify({ ...payload, response_mode: "json" }),
      });

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();

      if (!res.ok) {
        let msg = text;
        try {
          if (contentType.includes("application/json")) {
            const j = JSON.parse(text);
            msg = j?.error || j?.message || msg;
          }
        } catch {
          // ignore
        }
        throw new Error(msg || "Failed to start payment");
      }

      if (!contentType.includes("application/json")) {
        throw new Error("Unexpected response from payment service");
      }

      const j = JSON.parse(text);
      if (j?.redirect) {
        window.location.href = String(j.redirect);
        return;
      }
      if (j?.mode === "form" && j?.action && j?.encRequest && j?.access_code) {
        submitCcavenueForm(String(j.action), String(j.encRequest), String(j.access_code));
        return;
      }

      throw new Error("Invalid payment response");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment initialization failed";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!eventId || !event) {
    return (
      <div className="container-max py-10 sm:py-14">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 text-white">
          <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
            EVENT NOT FOUND
          </div>
          <div className="mt-2 text-2xl font-semibold">Invalid event</div>
          <div className="mt-5">
            <Button asChild className="bg-white text-black hover:bg-white/90">
              <Link to="/yatraevents">Back to events</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max py-10 sm:py-14">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 text-white">
        <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
          EVENT REGISTRATION
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold">{event.name}</h1>
        <p className="mt-3 text-sm text-white/70">
          You must have a paid Yatra Entry Pass (same email) before event registration.
        </p>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
          <div>
            <span className="text-white/50">Fee:</span>{" "}
            {fee ? formatFee(fee) : "TBA"}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold tracking-[0.22em] text-white/70">
              FULL NAME
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold tracking-[0.22em] text-white/70">
              EMAIL (MUST MATCH YATRA ENTRY)
            </div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold tracking-[0.22em] text-white/70">
              PHONE
            </div>
            <Input
              value={phone}
              onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 10))}
              placeholder="10-digit mobile number"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold tracking-[0.22em] text-white/70">
              COLLEGE
            </div>
            <Input
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="Your college name"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {variantOptions.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold tracking-[0.22em] text-white/70">
                CATEGORY / VARIANT
              </div>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 text-sm text-white outline-none"
              >
                <option value="" className="bg-black">
                  Select…
                </option>
                {variantOptions.map((o) => (
                  <option key={o.value} value={o.value} className="bg-black">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="bg-white text-black hover:bg-white/90 disabled:opacity-50"
          >
            {submitting ? "Redirecting…" : "Proceed to payment"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/events/${eventId}`)}
            className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Back to event
          </Button>
        </div>
      </div>
    </div>
  );
}

