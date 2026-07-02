"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface Props {
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
  /** Accessible name for the trigger, e.g. "Acciones de Rappi" */
  label?: string;
}

/**
 * Menú "⋯" accesible que consolida Editar y Eliminar en un solo control.
 * Eliminar pide confirmación dentro del mismo menú. Cierra con clic afuera o Escape.
 */
export function RowActions({ onEdit, onDelete, deleting = false, label = "Acciones" }: Props) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    setOpen(false);
    setConfirming(false);
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/6 transition-colors"
      >
        <MoreHorizontal size={16} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-20 min-w-[9rem] rounded-xl border border-border bg-popover shadow-lg p-1"
        >
          {confirming ? (
            <div className="px-2 py-1.5 space-y-2">
              <p className="text-xs text-foreground/60">¿Eliminar?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="flex-1 h-8 rounded-lg bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "..." : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="flex-1 h-8 rounded-lg text-foreground/60 text-xs hover:bg-foreground/6 transition-colors"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => { close(); onEdit(); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-foreground/6 transition-colors"
              >
                <Pencil size={14} strokeWidth={1.5} className="text-foreground/50" />
                Editar
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => setConfirming(true)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/8 transition-colors"
              >
                <Trash2 size={14} strokeWidth={1.5} />
                Eliminar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
