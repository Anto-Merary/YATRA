import { motion } from "framer-motion";

interface NeonGlowTextProps {
  text: string;
  className?: string;
  animationDelay?: number;
  outlinedText?: string; // Large outlined text (e.g., "YATRA'26")
  scriptText?: string; // Smaller script text overlay (e.g., "Yatra'26")
}

export function NeonGlowText({ 
  text, 
  className = "", 
  animationDelay = 0.2,
  outlinedText,
  scriptText
}: NeonGlowTextProps) {
  // If outlinedText and scriptText are provided, use font pairing
  if (outlinedText && scriptText) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: animationDelay, ease: "easeIn" }}
        className={`font-pairing-container ${className}`}
      >
        {/* Large outlined sans-serif text */}
        <div className="font-pairing-outlined">
          {outlinedText}
        </div>
        {/* Smaller script text overlay */}
        <div className="font-pairing-script">
          {scriptText}
        </div>
      </motion.div>
    );
  }

  // Default: original neon glow text
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: animationDelay, ease: "easeIn" }}
      className={`neon-glow-text ${className}`}
    >
      {text.split(' ').map((word, index) => (
        <span key={index} className="neon-glow-word">
          {word}
        </span>
      ))}
    </motion.div>
  );
}
