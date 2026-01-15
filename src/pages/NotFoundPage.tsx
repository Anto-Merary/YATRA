import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-sm text-center">
        <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300">
          404
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-white/90">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-white/60">
          No route matches{" "}
          <span className="font-mono text-white/75">{location.pathname}</span>.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/">Go to Home</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto border border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

