"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { tintFromColor } from "@/lib/utils/categories";

const PRESET_COLORS = [
  "#F4A261", "#E9C46A", "#457B9D", "#6D6875",
  "#A8DADC", "#E76F51", "#81B29A", "#264653",
  "#CDB4DB", "#2A9D8F", "#BDC3C7", "#E63946",
];

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  is_income: boolean | null;
}

export function CategoryCard({ cat }: { cat: Category }) {
  const router = useRouter();
  const [editing, setEditing]       = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const color = cat.color ?? "#BDC3C7";

  // Edit form state
  const [name,     setName]     = useState(cat.name);
  const [icon,     setIcon]     = useState(cat.icon ?? "📦");
  const [editColor, setEditColor] = useState(color);
  const [isIncome, setIsIncome] = useState(cat.is_income ?? false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), icon, color: editColor, is_income: isIncome }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Card */}
      <div
        className="group relative rounded-2xl p-4 flex flex-col gap-2 h-full border"
        style={{ backgroundColor: tintFromColor(color), borderColor: tintFromColor(color, 34) }}
      >
        <CategoryIcon slug={cat.slug} size={18} strokeWidth={1.5} style={{ color }} />
        <p className="font-display text-[11px] font-medium text-foreground/70 uppercase tracking-widest truncate">
          {cat.name}
        </p>
        <p className="text-xs text-foreground/40">
          {cat.is_income ? "Ingreso" : "Gasto"}
        </p>

        {confirming ? (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-card/90 backdrop-blur rounded-lg px-2 py-1">
            <span className="text-[10px] text-foreground/60">¿Eliminar?</span>
            <button onClick={handleDelete} disabled={deleting} className="text-[10px] font-medium text-destructive">{deleting ? "..." : "Sí"}</button>
            <button onClick={() => setConfirming(false)} className="text-[10px] text-foreground/50">No</button>
          </div>
        ) : (
          <div className="absolute top-2 right-2 flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground/60 hover:text-foreground transition-colors"
              aria-label={`Editar ${cat.name}`}
            >
              <Pencil size={12} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1 rounded-lg bg-foreground/10 hover:bg-destructive/20 text-foreground/60 hover:text-destructive transition-colors"
              aria-label={`Eliminar ${cat.name}`}
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-normal text-foreground">Editar categoría</h2>
              <button
                onClick={() => setEditing(false)}
                aria-label="Cerrar"
                className="p-1.5 rounded-lg hover:bg-foreground/6 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Name + Icon */}
              <div className="flex gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-foreground/40">Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={4}
                    className="w-16 h-11 px-2 text-center text-xl rounded-xl bg-background border border-foreground/8 outline-none focus:border-foreground/30 transition-colors"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-foreground/40">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
                  />
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110 shrink-0"
                      style={{
                        backgroundColor: c,
                        outline: editColor === c ? "2px solid currentColor" : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Is income toggle */}
              <button
                type="button"
                onClick={() => setIsIncome(!isIncome)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  isIncome ? "bg-foreground text-background" : "bg-foreground/8 text-foreground/60 hover:bg-foreground/12"
                }`}
              >
                {isIncome ? "✓ Es un ingreso" : "Marcar como ingreso"}
              </button>

              {/* Preview */}
              <div
                className="rounded-xl p-3 flex items-center gap-3 text-sm font-medium text-[#1A1A1A]"
                style={{ backgroundColor: editColor }}
              >
                <span className="text-xl">{icon}</span>
                <span>{name || "Vista previa"}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-11 rounded-full border border-foreground/10 text-sm text-foreground/60 hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
