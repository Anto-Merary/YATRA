import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PaymentResultPage() {
  const { result } = useParams<{ result: string }>();
  const [searchParams] = useSearchParams();

  const view = useMemo(() => {
    const normalized = (result ?? "").toLowerCase();
    const ok = normalized === "success";
    return {
      ok,
      title: ok ? "Payment successful" : "Payment not completed",
      subtitle: ok
        ? "Your registration has been recorded. You can continue browsing events."
        : "If your payment failed/was cancelled, please try again.",
    };
  }, [result]);

  const orderId = searchParams.get("order_id");
  const eventId = searchParams.get("event_id");
  const purpose = searchParams.get("purpose");
  const trackingId = searchParams.get("tracking_id");

  return (
    <div className="container-max py-10 sm:py-14">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 text-white">
        <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
          PAYMENT STATUS
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold">
          {view.title}
        </h1>
        <p className="mt-3 text-sm text-white/70">{view.subtitle}</p>

        {(orderId || purpose || eventId || trackingId) && (
          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            {purpose && (
              <div>
                <span className="text-white/50">Purpose:</span> {purpose}
              </div>
            )}
            {eventId && (
              <div>
                <span className="text-white/50">Event:</span> {eventId}
              </div>
            )}
            {orderId && (
              <div>
                <span className="text-white/50">Order ID:</span> {orderId}
              </div>
            )}
            {trackingId && (
              <div>
                <span className="text-white/50">Tracking ID:</span> {trackingId}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-white text-black hover:bg-white/90">
            <Link to="/yatraevents">Browse events</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Link to="/yatra-entry">Yatra Entry Pass</Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

