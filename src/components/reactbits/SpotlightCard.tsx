import React, { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
  onClick?: () => void;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.25)",
  onClick,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastPositionRef = useRef<Position>({ x: 0, y: 0 });
  const isTouchDeviceRef = useRef(false);

  // Detect touch device
  useEffect(() => {
    isTouchDeviceRef.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const updatePosition = useCallback((newPosition: Position) => {
    if (rafRef.current !== null) return;
    
    rafRef.current = requestAnimationFrame(() => {
      setPosition(newPosition);
      rafRef.current = null;
    });
  }, []);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = useCallback((e) => {
    if (!divRef.current || isFocused || isTouchDeviceRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    const newPosition = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    
    // Throttle updates - only update if position changed significantly
    const dx = Math.abs(newPosition.x - lastPositionRef.current.x);
    const dy = Math.abs(newPosition.y - lastPositionRef.current.y);
    
    if (dx > 5 || dy > 5) {
      lastPositionRef.current = newPosition;
      updatePosition(newPosition);
    }
  }, [isFocused, updatePosition]);

  const handleFocus = () => {
    setIsFocused(true);
    if (!isTouchDeviceRef.current) {
      setOpacity(0.6);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    if (!isTouchDeviceRef.current) {
      setOpacity(0.6);
    }
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 p-8",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
};

export default SpotlightCard;
