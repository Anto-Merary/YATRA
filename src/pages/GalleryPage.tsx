import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Masonry from "@/components/Masonry";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Transform gallery items for carousel
  const carouselCards = GALLERY_ITEMS.map((item) => ({
    src: item.img || "https://via.placeholder.com/400x600/6A5CFF/FFFFFF?text=" + encodeURIComponent(item.placeholder),
    title: item.placeholder,
    category: "Gallery",
    content: (
      <div className="text-white">
        <p className="text-sm text-white/70">{item.placeholder}</p>
        {item.url && item.url !== "#" && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            View Full Image →
          </a>
        )}
      </div>
    ),
  }));

  const carouselItems = carouselCards.map((card, index) => (
    <Card key={index} card={card} index={index} />
  ));

  return (
    <div className="relative min-h-screen w-full bg-black pb-28 sm:pb-0">
      {/* Drop shadow on top - prominent gradient */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-black/90 via-black/60 to-transparent pointer-events-none z-20" />
      
      {/* Content Layer */}
      <div className="container-max py-6 sm:py-8 md:py-12 lg:py-14 relative z-10 px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-[10px] xs:text-xs sm:text-sm font-semibold tracking-[0.15em] xs:tracking-[0.2em] sm:tracking-[0.25em] text-yatra-300">GALLERY</div>
          <div className="mt-1.5 xs:mt-2 sm:mt-3 font-display text-xl xs:text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.02em]">
            Moments from Yatra
          </div>
          <div className="mt-1.5 xs:mt-2 max-w-2xl text-xs sm:text-sm text-white/70">
            Relive the memories and experiences from previous editions
          </div>
        </motion.div>

        {/* Mobile: Apple Cards Carousel, Desktop: Masonry Gallery */}
        {isMobile ? (
          <div className="mt-6 xs:mt-8 sm:mt-10 md:mt-12 mb-24 sm:mb-0">
            <Carousel items={carouselItems} />
          </div>
        ) : (
          <div className="mt-6 xs:mt-8 sm:mt-10 md:mt-12 min-h-[300px] xs:min-h-[400px] sm:min-h-[600px] md:min-h-[800px] relative">
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
        )}

        {/* Coming Soon Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-6 xs:mt-8 sm:mt-10 md:mt-14 lg:mt-16 mb-28 sm:mb-0 text-center px-3"
        >
          <div className="inline-block rounded-lg xs:rounded-xl border border-yatra-400/30 bg-yatra-500/10 px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3">
            <p className="text-xs sm:text-sm text-white/70 font-medium">
              Gallery content will be updated soon
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

