import { motion } from "framer-motion";
import Masonry from "@/components/Masonry";

// Gallery items with placeholders - replace img with actual image URLs when ready
const GALLERY_ITEMS = [
  { id: "1", img: "", url: "#", height: 600, placeholder: "Image 1" },
  { id: "2", img: "", url: "#", height: 500, placeholder: "Image 2" },
  { id: "3", img: "", url: "#", height: 700, placeholder: "Image 3" },
  { id: "4", img: "", url: "#", height: 550, placeholder: "Image 4" },
  { id: "5", img: "", url: "#", height: 650, placeholder: "Image 5" },
  { id: "6", img: "", url: "#", height: 480, placeholder: "Image 6" },
  { id: "7", img: "", url: "#", height: 620, placeholder: "Image 7" },
  { id: "8", img: "", url: "#", height: 540, placeholder: "Image 8" },
  { id: "9", img: "", url: "#", height: 580, placeholder: "Image 9" },
  { id: "10", img: "", url: "#", height: 520, placeholder: "Image 10" },
  { id: "11", img: "", url: "#", height: 600, placeholder: "Image 11" },
  { id: "12", img: "", url: "#", height: 560, placeholder: "Image 12" },
];

export function GalleryPage() {
  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Drop shadow on top - prominent gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {/* Content Layer */}
      <div className="container-max py-8 sm:py-12 md:py-14 relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-yatra-300">GALLERY</div>
          <div className="mt-2 sm:mt-3 font-display text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
            Moments from Yatra
          </div>
          <div className="mt-2 max-w-2xl text-xs sm:text-sm text-white/70">
            Relive the memories and experiences from previous editions
          </div>
        </motion.div>

        {/* Masonry Gallery */}
        <div className="mt-8 sm:mt-10 md:mt-12 min-h-[400px] sm:min-h-[600px] md:min-h-[800px]">
          <Masonry
            items={GALLERY_ITEMS}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={true}
            hoverScale={0.95}
            blurToFocus={true}
            colorShiftOnHover={false}
          />
        </div>

        {/* Coming Soon Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-10 sm:mt-14 md:mt-16 text-center"
        >
          <div className="inline-block rounded-xl border border-yatra-400/30 bg-yatra-500/10 px-4 sm:px-6 py-2.5 sm:py-3">
            <p className="text-xs sm:text-sm text-white/70 font-medium">
              Gallery content will be updated soon
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

