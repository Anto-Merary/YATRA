import { motion } from "framer-motion";
import { useMobile } from "../hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import blackBgImage from "../assets/blackbg.webp?url";
import proEventImage from "../assets/pro.webp?url";
import yatraEventImage from "../assets/yatraevents.webp?url";

export function EventsPage() {
  const { prefersReducedMotion } = useMobile();
  const navigate = useNavigate();

  // Category Selection View
    return (
      <div className="relative min-h-screen w-full bg-black overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${blackBgImage})`,
            backgroundAttachment: 'fixed',
          }}
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 z-0 bg-black/40" />

        <div className="relative z-10 min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-12">
            {/* Header Section */}
            <div className="text-center">
              <h1 className="font-victory-striker text-[44px] leading-none sm:text-6xl md:text-7xl font-bold text-white uppercase">
                EVENTS
              </h1>
              <p className="mt-2 font-poppins text-[13px] leading-snug sm:text-base text-white/85 max-w-[22rem] mx-auto">
                Choose the Type of Event you want to participate in
              </p>
            </div>

            {/* Category Cards - match reference spacing */}
            <div className="mt-8 sm:mt-10">
              <div className="mx-auto w-full max-w-[420px] space-y-6 md:max-w-5xl md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
                {/* PRO EVENTS Card */}
                <motion.button
                  type="button"
                  onClick={() => navigate("/pro-dance-battle")}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  className="relative w-full overflow-hidden rounded-[28px] shadow-[0_18px_55px_rgba(0,0,0,0.65)] ring-1 ring-white/10 touch-manipulation"
                >
                  <div className="relative w-full aspect-square">
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-no-repeat"
                      style={{
                        backgroundImage: `url(${proEventImage})`,
                        backgroundPosition: "center top",
                      }}
                    />

                    {/* Dark Gradient Overlay (reference-like) */}
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 30%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.25) 70%, transparent 100%)'
                      }}
                    />

                    {/* Content - tight bottom-left */}
                    <div className="absolute bottom-0 left-0 p-5 sm:p-6 text-left">
                      <h2 className="font-akira text-[30px] leading-[0.95] sm:text-[40px] font-bold text-white uppercase">
                        DANCE<br />
                        BATTLE
                      </h2>
                      <p className="mt-2 text-[11px] sm:text-xs text-white/85 leading-snug max-w-[18rem]">
                        Flagship competitions held separately from the main cultural stage. Winners get a chance to perform on the main stage and win Cash prize
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* YATRA EVENTS Card */}
                <motion.button
                  type="button"
                  onClick={() => navigate("/yatraevents")}
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  className="relative w-full overflow-hidden rounded-[28px] shadow-[0_18px_55px_rgba(0,0,0,0.65)] ring-1 ring-white/10 touch-manipulation"
                >
                  <div className="relative w-full aspect-square">
                    {/* Background Image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: `url(${yatraEventImage})`,
                      }}
                    />

                    {/* Dark Gradient Overlay (reference-like) */}
                    <div 
                      className="absolute inset-0" 
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.75) 30%, rgba(0,0,0,0.50) 50%, rgba(0,0,0,0.25) 70%, transparent 100%)'
                      }}
                    />

                    {/* Content - tight bottom-left */}
                    <div className="absolute bottom-0 left-0 p-5 sm:p-6 text-left">
                      <h2 className="font-akira text-[30px] leading-[0.95] sm:text-[40px] font-bold text-white uppercase">
                        YATRA<br />
                        EVENTS
                      </h2>
                      <p className="mt-2 text-[11px] sm:text-xs text-white/85 leading-snug max-w-[18rem]">
                        50+ events across games, dance, music, and more. Solo & duo events across both days.
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}


