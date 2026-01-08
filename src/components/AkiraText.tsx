import { motion } from "framer-motion";

interface AkiraTextProps {
  words: Array<{
    firstLetter: string;
    rest: string;
    variant: "outline-only" | "glow";
  }>;
  className?: string;
  animationDelay?: number;
}

export function AkiraText({ words, className = "", animationDelay = 0.2 }: AkiraTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: animationDelay, ease: "easeIn" }}
      className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-akira tracking-tight text-akira-outline text-center flex items-baseline justify-center flex-wrap gap-x-8 gap-y-1 ${className}`}
    >
      {words.map((word, index) => (
        <span key={index} className="inline-flex items-baseline">
          <span className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none text-akira-${word.variant}`}>
            {word.firstLetter}
          </span>
          <span className={`text-akira-${word.variant}`}>{word.rest}</span>
        </span>
      ))}
    </motion.div>
  );
}

