"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

export const TextHoverEffect = ({
  text = "YATRA'26",
  duration,
}: {
  text?: string;
  duration?: number;
  automatic?: boolean;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  // Intersection Observer to detect when footer is in view
  useEffect(() => {
    // Try to find footer element first, otherwise use container
    const footerElement = document.getElementById("footer");
    const targetElement = footerElement || containerRef.current;
    
    if (!targetElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% is visible
        rootMargin: "200px 0px 0px 0px", // Start 200px before element enters viewport
        root: null, // Use viewport as root
      }
    );

    observer.observe(targetElement);

    return () => {
      observer.unobserve(targetElement);
    };
  }, []);

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  // Auto-start animation when footer comes into view
  useEffect(() => {
    if (isInView) {
      // Start the hover effect automatically
      setHovered(true);
      
      // Set initial cursor position to center with a small delay to ensure SVG is rendered
      const timer = setTimeout(() => {
        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          setCursor({ x: centerX, y: centerY });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-visible py-8">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 -60 1000 320"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={(e) => {
          setCursor({ x: e.clientX, y: e.clientY });
          setHovered(true);
        }}
        className="select-none overflow-visible"
        style={{ overflow: "visible" }}
      >
      <defs>
        {/* White gradient with varying brightness/opacity */}
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          cx="50%"
          cy="50%"
          r="25%"
        >
          {hovered && (
            <>
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="25%" stopColor="rgba(255, 255, 255, 1)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.95)" />
              <stop offset="75%" stopColor="rgba(255, 255, 255, 1)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.9)" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>
      <text
        x="500"
        y="100"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="1.5"
        fontSize="180"
        className="fill-transparent stroke-white font-akira font-bold tracking-wider uppercase"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="500"
        y="100"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="1.5"
        fontSize="180"
        className="fill-transparent stroke-white font-akira font-bold tracking-wider uppercase"
        initial={{ strokeDashoffset: 3000, strokeDasharray: 3000 }}
        animate={isInView ? {
          strokeDashoffset: 0,
          strokeDasharray: 3000,
        } : {
          strokeDashoffset: 3000,
          strokeDasharray: 3000,
        }}
        transition={{
          duration: 4,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.text>
      <text
        x="500"
        y="100"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="1.5"
        fontSize="180"
        mask="url(#textMask)"
        className="fill-transparent font-akira font-bold tracking-wider uppercase"
      >
        {text}
      </text>
    </svg>
    </div>
  );
};
