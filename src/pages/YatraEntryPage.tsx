import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RegistrationForm } from "@/components/Form";

export function YatraEntryPage() {
  return (
    <div className="container-max py-8 sm:py-12">
      <div className="mx-auto max-w-2xl text-white text-center">
        <div className="text-xs font-semibold tracking-[0.25em] text-yatra-300 mb-6">
          YATRA ENTRY PASS (MANDATORY)
        </div>

        <RegistrationForm />

        <div className="mt-6 flex justify-center">
          <Button
            asChild
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-transparent"
          >
            <Link to="/yatraevents">Browse events</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

