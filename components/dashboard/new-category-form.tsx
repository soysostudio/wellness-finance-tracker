"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { SYSTEM_CATEGORIES, CUSTOM_CATEGORY_COLORS, guessCategoryEmoji } from "@/lib/utils/categories";

interface Props {
  userId: string;
}

export function NewCategoryForm({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CUSTOM_CATEGORY_COLORS[0]);
  const [isIncome, setIsIncome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const slug = name
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      setError("Usa al menos una letra o número en el nombre.");
      setLoading(false);
      return;
    }

    if (SYSTEM_CATEGORIES.some((c) => c.slug === slug)) {
      setError("Ya existe una categoría con ese nombre. Elige otro.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase.from("categories").insert({
      user_id: userId,
      name: name.trim(),
      slug,
      icon: guessCategoryEmoji(name),
      color,
      is_income: isIncome,
    });

    setLoading(false);
    if (err) {
      setError("No se pudo crear la categoría. Intenta con otro nombre.");
      return;
    }

    setName("");
    setColor(CUSTOM_CATEGORY_COLORS[0]);
    setIsIncome(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold border border-dashed border-border rounded-2xl px-4 py-3 w-full hover:bg-card transition-colors text-muted-foreground"
      >
        <span className="text-lg">+</span>
        Nueva categoría
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm">Nueva categoría</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          Cancelar
        </button>
      </div>

      <div className="space-y-1">
        <Input
          placeholder="Nombre de la categoría"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground px-1">
          Luca le busca un ícono relacionado automáticamente
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Color</p>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? "2px solid currentColor" : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsIncome(!isIncome)}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
            isIncome
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isIncome ? "✓ Es un ingreso" : "Marcar como ingreso"}
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" className="w-full h-11" disabled={loading || !name.trim()}>
        {loading ? "Guardando..." : "Crear categoría"}
      </Button>
    </form>
  );
}
