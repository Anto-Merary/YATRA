import { useEffect, useRef, useState } from "react";

interface IridescentTextProps {
  text: string;
  className?: string;
}

export function IridescentText({ text, className = "" }: IridescentTextProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5, distance: 1 });
  const [time, setTime] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!textRef.current) return;

      const rect = textRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Calculate distance from center for glow intensity
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = Math.max(rect.width, rect.height) * 0.8;
      const normalizedDistance = Math.min(distance / maxDistance, 1);
      
      setMousePosition({ x, y, distance: normalizedDistance });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 0.01);
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, []);

  // Create animated white gradient wave effect
  // Multiple waves flowing across the text
  const wave1 = Math.sin(time * 0.5) * 0.5 + 0.5;
  const wave2 = Math.sin(time * 0.7 + Math.PI / 3) * 0.5 + 0.5;
  const wave3 = Math.sin(time * 0.6 + Math.PI / 2) * 0.5 + 0.5;

  // White color with varying brightness/opacity
  const brightness1 = 70 + wave1 * 30; // 70-100%
  const brightness2 = 80 + wave2 * 20; // 80-100%
  const brightness3 = 75 + wave3 * 25; // 75-100%
  const brightness4 = 85 + wave1 * 15; // 85-100%
  const brightness5 = 90 + wave2 * 10; // 90-100%

  // Create flowing white gradient with animated brightness stops
  const gradientStops = [
    `hsl(0, 0%, ${brightness1}%)`,
    `hsl(0, 0%, ${brightness2}%)`,
    `hsl(0, 0%, ${brightness3}%)`,
    `hsl(0, 0%, ${brightness4}%)`,
    `hsl(0, 0%, ${brightness5}%)`,
  ];

  // Animated gradient position
  const gradientPosition = (wave1 * 100 + wave2 * 50) % 100;

  const gradient = `linear-gradient(90deg, ${gradientStops.join(", ")})`;
  const backgroundSize = "200% 100%";
  const backgroundPosition = `${gradientPosition}% 0%`;

  // Cursor-responsive glow intensity
  const cursorGlowIntensity = 1 - mousePosition.distance; // Closer = more intense
  const proximityMultiplier = Math.max(0, 1 - mousePosition.distance * 1.5); // Stronger when close
  
  // Calculate glow position based on cursor relative to text
  const glowX = (mousePosition.x - 0.5) * 30; // Subtle offset
  const glowY = (mousePosition.y - 0.5) * 30;
  
  // Enhanced glow parameters
  const baseGlowOpacity = 0.7 + cursorGlowIntensity * 0.3; // 0.7 to 1.0
  const animatedGlowOpacity = 0.5 + wave1 * 0.3; // 0.5 to 0.8
  
  // Create multiple layered text-shadows for a strong, diffused glow
  const textShadows = [
    // Outer glow layers (largest blur, lower opacity)
    `0px 0px ${40 + proximityMultiplier * 20}px rgba(255, 255, 255, ${0.3 + proximityMultiplier * 0.2})`,
    `0px 0px ${30 + proximityMultiplier * 15}px rgba(255, 255, 255, ${0.4 + proximityMultiplier * 0.2})`,
    // Cursor-responsive glow (follows cursor)
    `${glowX * 0.5}px ${glowY * 0.5}px ${25 + proximityMultiplier * 15}px rgba(255, 255, 255, ${baseGlowOpacity * 0.6})`,
    // Middle glow layers
    `0px 0px ${20 + wave1 * 8}px rgba(255, 255, 255, ${animatedGlowOpacity * 0.7})`,
    `0px 0px ${15 + wave2 * 6}px rgba(255, 255, 255, ${animatedGlowOpacity * 0.6})`,
    // Inner glow layers (smaller blur, higher opacity)
    `0px 0px ${12 + wave3 * 4}px rgba(255, 255, 255, ${animatedGlowOpacity * 0.8})`,
    `0px 0px ${8}px rgba(255, 255, 255, ${0.9 + proximityMultiplier * 0.1})`,
    // Tight inner glow for definition
    `0px 0px ${4}px rgba(255, 255, 255, 1)`,
  ].join(", ");

  return (
    <div className="relative inline-block">
      {/* Glow layer behind text */}
      <div
        className={`absolute inset-0 ${className}`}
        style={{
          color: "white",
          WebkitTextFillColor: "white",
          textShadow: textShadows,
          filter: `blur(2px) brightness(${1.1 + proximityMultiplier * 0.2})`,
          opacity: 0.4 + proximityMultiplier * 0.3,
          zIndex: -1,
          willChange: "text-shadow, filter, opacity",
          transition: "text-shadow 0.15s ease-out, filter 0.15s ease-out, opacity 0.15s ease-out",
        }}
        aria-hidden="true"
      >
        {text.toUpperCase()}
      </div>
      
      {/* Main text with gradient and glow */}
      <div
        ref={textRef}
        className={`iridescent-text relative inline-block ${className}`}
        style={{
          background: gradient,
          backgroundSize: backgroundSize,
          backgroundPosition: backgroundPosition,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent",
          display: "inline-block",
          filter: `brightness(${1 + wave1 * 0.1 + cursorGlowIntensity * 0.15}) contrast(${1 + proximityMultiplier * 0.1})`,
          textShadow: textShadows,
          willChange: "background-position, filter, text-shadow",
          transition: "text-shadow 0.15s ease-out, filter 0.15s ease-out",
        }}
      >
        {text.toUpperCase()}
      </div>
    </div>
  );
}
