import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

type InstitutionType = "rit" | "rec" | "rsb" | "rsa" | "other";

const INSTITUTION_OPTIONS: Array<{ value: InstitutionType; label: string }> = [
  { value: "rit", label: "Rajalakshmi Institute of Technology (RIT)" },
  { value: "rec", label: "Rajalakshmi Engineering College (REC)" },
  { value: "rsb", label: "Rajalakshmi School of Business (RSB)" },
  { value: "rsa", label: "Rajalakshmi School of Architecture (RSA)" },
  { value: "other", label: "Other (type your college)" },
];

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

export function YatraEntryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [institutionType, setInstitutionType] = useState<InstitutionType>("rit");
  const [otherCollege, setOtherCollege] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amountInr = useMemo(
    () => (institutionType === "other" ? 800 : 500),
    [institutionType],
  );

  const selectedLabel = useMemo(
    () => INSTITUTION_OPTIONS.find((o) => o.value === institutionType)?.label ?? "",
    [institutionType],
  );

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (digitsOnly(phone).length !== 10) return false;
    if (institutionType === "other" && !otherCollege.trim()) return false;
    return true;
  }, [name, email, phone, institutionType, otherCollege]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");

      const payload = {
        purpose: "yatra_entry",
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: digitsOnly(phone),
        institution_type: institutionType,
        college: institutionType === "other" ? otherCollege.trim() : selectedLabel,
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
      if (j?.already_paid) {
        toast({
          title: "Already paid",
          description: "This email already has a paid Yatra Entry Pass.",
        });
        navigate("/payment/success?purpose=yatra_entry&already_paid=1", { replace: true });
        return;
      }
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

  return (
    <div className="container-max py-8 sm:py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 text-white text-center">
        <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
          YATRA ENTRY PASS (MANDATORY)
        </div>
        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold">
          Buy your Yatra Entry Pass
        </h1>

        <div className="mt-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Will be updated soon
          </h2>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            asChild
            variant="secondary"
            className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Link to="/yatraevents">Browse events</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

