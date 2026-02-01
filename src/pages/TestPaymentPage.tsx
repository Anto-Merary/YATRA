import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function TestPaymentPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [minimalPayload, setMinimalPayload] = useState(true); // Try minimal first to fix 31002

    const handleTestPayment = async () => {
        setLoading(true);
        try {
            const payload = {
                purpose: "yatra_entry",
                name: "Test User",
                email: `test_user_${Date.now()}@ritchennai.edu.in`,
                phone: "9999999999",
                institution_type: "rit",
                college: "Rajalakshmi Institute of Technology",
                response_mode: "json",
                ...(minimalPayload && { minimal_payload: true }),
            };

            console.log("Initiating test payment with:", payload);

            console.log("Initiating test payment with:", payload);

            // Using Vercel API Function instead of Supabase Edge Function
            const res = await fetch("/api/ccavenue-init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to initiate payment");
            }

            const responseData = await res.json();
            // fnError is no longer relevant here
            if (responseData.error) throw new Error(responseData.error);

            if (responseData.already_paid) {
                toast({
                    title: "Simulation: Already Paid",
                    description: "This dummy user is already marked as paid.",
                    variant: "default",
                });
                return;
            }

            if (responseData.mode === "form" && responseData.action) {
                // Auto-submit form
                const form = document.createElement("form");
                form.method = "POST";
                form.action = responseData.action;

                const addField = (name: string, value: string) => {
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = name;
                    input.value = value;
                    form.appendChild(input);
                };

                addField("encRequest", responseData.encRequest);
                addField("access_code", responseData.access_code);

                document.body.appendChild(form);

                toast({
                    title: "Redirecting...",
                    description: "Sending request to CCAvenue...",
                });

                form.submit();
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (error) {
            console.error("Test failed:", error);
            toast({
                title: "Test Failed",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full text-center">
                <h1 className="text-2xl font-bold mb-4 font-mono">PAYMENT GATEWAY TEST</h1>
                <p className="mb-6 text-gray-600">
                    Initiates a real <b>₹1</b> transaction using dummy data.
                </p>

                <div className="bg-gray-100 p-4 rounded text-left text-xs font-mono mb-6 overflow-x-auto">
                    <p>Name: Test User</p>
                    <p>Email: test_user_[timestamp]@ritchennai.edu.in</p>
                    <p>Phone: 9999999999</p>
                    <p>Inst: RIT</p>
                </div>

                <label className="flex items-center gap-2 mb-4 text-sm text-left cursor-pointer">
                    <input
                        type="checkbox"
                        checked={minimalPayload}
                        onChange={(e) => setMinimalPayload(e.target.checked)}
                        className="rounded"
                    />
                    <span>Minimal payload (7 params only) — use to debug 31002</span>
                </label>

                <Button
                    onClick={handleTestPayment}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3"
                >
                    {loading ? "PROCESSING..." : "PROCEED TO PAY ₹1"}
                </Button>

                <p className="mt-4 text-xs text-red-500">
                    * Ensure you are running on rityatra.in or have SITE_URL configured correctly.
                </p>
            </div>
        </div>
    );
}
