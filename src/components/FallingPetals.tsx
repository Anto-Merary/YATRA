import { useEffect, useState } from "react";

interface Petal {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  fallSpeed: number;
  opacity: number;
  delay: number;
}

interface FallingPetalsProps {
  count?: number;
  className?: string;
}

export function FallingPetals({ count = 30, className = "" }: FallingPetalsProps) {
  const [petals] = useState<Petal[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -100 - 10,
      size: Math.random() * 6 + 3,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 1.5,
      fallSpeed: Math.random() * 0.4 + 0.2,
      opacity: Math.random() * 0.4 + 0.2,
      delay: Math.random() * 2,
    }))
  );

  useEffect(() => {
    const updatePetals = () => {
      const petalElements = document.querySelectorAll(".falling-petal");
      petalElements.forEach((el, i) => {
        const petal = petals[i];
        if (!petal) return;

        const element = el as HTMLElement;
        let currentY = parseFloat(element.style.top) || petal.y;
        let currentX = parseFloat(element.style.left) || petal.x;
        let currentRotation = parseFloat(element.style.transform.match(/rotate\(([^)]+)\)/)?.[1] || "0") || petal.rotation;

        currentY += petal.fallSpeed;
        currentX += Math.sin((currentRotation * Math.PI) / 180) * 0.15;
        currentRotation += petal.rotationSpeed;

        if (currentY > 110) {
          currentY = -10;
          currentX = Math.random() * 100;
        }

        element.style.top = `${currentY}%`;
        element.style.left = `${currentX}%`;
        element.style.transform = `rotate(${currentRotation}deg)`;
      });
    };

    const interval = setInterval(updatePetals, 100);
    return () => clearInterval(interval);
  }, [petals]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    >
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="falling-petal absolute"
          style={{
            left: `${petal.x}%`,
            top: `${petal.y}%`,
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            opacity: petal.opacity,
            transform: `rotate(${petal.rotation}deg)`,
            transition: "opacity 0.3s ease",
            animationDelay: `${petal.delay}s`,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `radial-gradient(ellipse at center, rgba(255, 182, 193, 0.7) 0%, rgba(255, 192, 203, 0.3) 50%, transparent 100%)`,
              borderRadius: "50% 0 50% 0",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      ))}
    </div>
  );
}
