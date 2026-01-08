import type { ReactNode } from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
};

export function Modal({ open, onOpenChange, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#070814] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="text-sm font-semibold tracking-wide text-white/80">{title}</div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}


