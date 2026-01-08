type NoiseOverlayProps = {
  className?: string;
  opacity?: number;
  animated?: boolean;
};

export function NoiseOverlay({
  className,
  opacity = 0.18,
  animated = true,
}: NoiseOverlayProps) {
  // Generate unique filter ID to avoid conflicts
  const filterId = `yatra-noise-${Math.random().toString(36).slice(2, 11)}`;
  
  return (
    <div
      className={[
        "pointer-events-none absolute inset-0",
        "mix-blend-overlay",
        className ?? "",
      ].join(" ")}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg className={["absolute inset-0 h-full w-full", animated ? "yatra-noise-static" : ""].join(" ")}>
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves={4}
            stitchTiles="stitch"
            seed={Math.floor(Math.random() * 1000)}
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} opacity="1" />
      </svg>
    </div>
  );
}


