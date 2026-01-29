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
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 text-white text-center">
        <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
          EVENT REGISTRATION
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold">{event.name}</h1>

        <div className="mt-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Will be updated soon
          </h2>
        </div>

        <div className="mt-6 flex justify-center">
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

