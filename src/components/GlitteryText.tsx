import { motion } from "framer-motion";

interface GlitteryTextProps {
  text: string;
  className?: string;
  animationDelay?: number;
}

export function GlitteryText({ 
  text, 
  className = "", 
  animationDelay = 0 
}: GlitteryTextProps) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: animationDelay }}
      className={`glittery-text inline-block ${className}`}
      style={{
        background: `linear-gradient(
          135deg,
          #06b6d4 0%,
          #14b8a6 20%,
          #22d3ee 40%,
          #06b6d4 60%,
          #14b8a6 80%,
          #06b6d4 100%
        )`,
        backgroundSize: "200% auto",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        filter: "drop-shadow(0 0 8px rgba(6, 182, 212, 0.6)) drop-shadow(0 0 16px rgba(20, 184, 166, 0.4))",
        animation: "shimmer 3s linear infinite",
      }}
    >
      {text}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 0% center;
            filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6)) drop-shadow(0 0 16px rgba(20, 184, 166, 0.4));
          }
          50% {
            background-position: 100% center;
            filter: drop-shadow(0 0 12px rgba(6, 182, 212, 0.9)) drop-shadow(0 0 24px rgba(20, 184, 166, 0.7));
          }
          100% {
            background-position: 0% center;
            filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.6)) drop-shadow(0 0 16px rgba(20, 184, 166, 0.4));
          }
        }
      `}</style>
    </motion.span>
  );
}
