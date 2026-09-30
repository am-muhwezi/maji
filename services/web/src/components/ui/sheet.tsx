"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Slide-over panel on desktop, bottom sheet on phones. Built on native <dialog>
 * for focus trapping, Esc to close, and inert background with no extra library.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the panel) closes.
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto h-auto max-h-[92dvh] w-full max-w-none bg-transparent p-0 backdrop:bg-slate-900/40 backdrop:backdrop-blur-[4px] open:animate-sheet-up md:mt-0 md:ml-auto md:h-dvh md:max-h-none md:w-[440px] md:open:animate-sheet-in"
    >
      <div className="flex max-h-[92dvh] flex-col rounded-t-2xl border border-slate-400/40 bg-white shadow-tier3 md:h-dvh md:max-h-none md:rounded-none md:rounded-l-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="sheet-title" className="text-lg font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid size-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-ink">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t border-line bg-canvas px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </dialog>
  );
}
