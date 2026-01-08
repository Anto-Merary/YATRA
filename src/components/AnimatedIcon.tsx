import { motion } from "framer-motion";

interface AnimatedIconProps {
  children: React.ReactNode;
  delay?: number;
  color?: string;
  className?: string;
}

export function AnimatedIcon({ children, delay = 0, color = "currentColor", className = "" }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 200,
        damping: 15,
      }}
      whileHover={{
        scale: 1.2,
        rotate: [0, -10, 10, -10, 0],
        transition: { duration: 0.4 },
      }}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ color }}
    >
      {children}
    </motion.div>
  );
}

// SVG Icon Components
export function ArrowIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ChartIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}

export function BuildingIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function LeafIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.734.99A.996.996 0 0119 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L9 5.268l1.254.864a1 1 0 11-.992 1.736L9 7.268l-1.254.568a1 1 0 01-.992-1.736l1.75-1zm6.236 0a1 1 0 01.992 1.736l-1.75 1a1 1 0 11-.992-1.736l1.75-1zM3 11a1 1 0 011 1v1.382l1.27-.343a1 1 0 11.514 1.93l-1.818.49A.996.996 0 013 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a.996.996 0 01-.964.469l-1.818-.49a1 1 0 11.514-1.93l1.27.343V12a1 1 0 011-1zm-7 4a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function LightbulbIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14a1 1 0 100 2h1a1 1 0 100-2h-1z" />
    </svg>
  );
}

export function RainbowIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

export function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      <path d="M15 12a1 1 0 100-2h-3.586l1.293-1.293a1 1 0 10-1.414-1.414L10 8.586V5a1 1 0 10-2 0v3.586L5.707 7.293a1 1 0 00-1.414 1.414L5.586 10H2a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414L8 11.414V15a1 1 0 102 0v-3.586l2.293 2.293a1 1 0 001.414-1.414L12.414 12H15z" />
    </svg>
  );
}

export function AsteriskIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2a1 1 0 011 1v5.586l3.707-3.707a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L9 8.586V3a1 1 0 011-1z" />
      <path d="M5 12a1 1 0 100 2h10a1 1 0 100-2H5z" />
      <path d="M10 18a1 1 0 01-1-1v-5.586l-3.707 3.707a1 1 0 11-1.414-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 11-1.414 1.414L11 11.414V17a1 1 0 01-1 1z" />
    </svg>
  );
}

