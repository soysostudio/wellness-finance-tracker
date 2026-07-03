"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryColor, tintFromColor } from "@/lib/utils/categories";

export interface CategoryOption {
  slug: string;
  name: string;
  color?: string;
}

interface Props {
  systemCategories: CategoryOption[];
  customCategories: CategoryOption[];
  value: string;
  onChange: (slug: string) => void;
}

/**
 * Selector de categoría con ícono a color en vez de un <select> nativo de
 * texto plano — así las categorías personalizadas (agrupadas aparte, con su
 * propio color/ícono) son igual de visibles que las del sistema.
 */
export function CategorySelect({ systemCategories, customCategories, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const all = [...systemCategories, ...customCategories];
  const selected = all.find((c) => c.slug === value);
  const selectedColor = selected?.color ?? getCategoryColor(value);

  function Row({ cat }: { cat: CategoryOption }) {
    const color = cat.color ?? getCategoryColor(cat.slug);
    return (
      <button
        type="button"
        role="option"
        aria-selected={cat.slug === value}
        onClick={() => { onChange(cat.slug); setOpen(false); }}
        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
          cat.slug === value ? "bg-foreground/8 text-foreground" : "text-foreground/80 hover:bg-foreground/6"
        }`}
      >
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: tintFromColor(color) }}
        >
          <CategoryIcon slug={cat.slug} name={cat.name} size={13} strokeWidth={1.5} style={{ color }} />
        </span>
        <span className="truncate">{cat.name}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full h-11 px-3 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors flex items-center gap-2.5"
      >
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: tintFromColor(selectedColor) }}
        >
          <CategoryIcon slug={value} name={selected?.name} size={13} strokeWidth={1.5} style={{ color: selectedColor }} />
        </span>
        <span className="flex-1 text-left truncate">{selected?.name ?? "Elige una categoría"}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="text-foreground/40 shrink-0" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-20 max-h-72 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg p-1.5 space-y-0.5"
        >
          {systemCategories.length > 0 && (
            <>
              <p className="px-3 pt-1.5 pb-1 text-[10px] uppercase tracking-widest text-foreground/40">Categorías</p>
              {systemCategories.map((c) => <Row key={c.slug} cat={c} />)}
            </>
          )}
          {customCategories.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-foreground/40">Tus categorías</p>
              {customCategories.map((c) => <Row key={c.slug} cat={c} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
