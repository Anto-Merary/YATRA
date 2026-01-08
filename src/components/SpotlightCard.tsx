import type { ReactNode, MouseEvent } from "react";
import { useCallback, useMemo, useRef } from "react";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  /** px radius of spotlight */
  radius?: number;
};

export function SpotlightCard({ children, className, radius = 360 }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const style = useMemo(
    () => ({ ["--spot-radius" as any]: `${radius}px` }),
    [radius],
  );

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--spot-x", `${x}px`);
    el.style.setProperty("--spot-y", `${y}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={[
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]",
        "before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition-opacity before:duration-200",
        "before:bg-[radial-gradient(circle_at_var(--spot-x)_var(--spot-y),rgba(106,92,255,0.35),rgba(106,92,255,0.0)_var(--spot-radius))]",
        "hover:before:opacity-100",
        className ?? "",
      ].join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}


