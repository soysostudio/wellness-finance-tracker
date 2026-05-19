"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const PRESET_COLORS = [
  "#F4A261", "#E9C46A", "#457B9D", "#6D6875",
  "#A8DADC", "#E76F51", "#81B29A", "#264653",
  "#CDB4DB", "#2A9D8F", "#BDC3C7", "#E63946",
];

interface Props {
  userId: string;
}

export function NewCategoryForm({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#BDC3C7");
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

    const supabase = createClient();
    const { error: err } = await supabase.from("categories").insert({
      user_id: userId,
      name: name.trim(),
      slug,
      icon,
      color,
      is_income: isIncome,
    });

    setLoading(false);
    if (err) {
      setError("No se pudo crear la categoría. Intenta con otro nombre.");
      return;
    }

    setName("");
    setIcon("📦");
    setColor("#BDC3C7");
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

      <div className="flex gap-3">
        <Input
          placeholder="Emoji (ej: 🎮)"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-24 text-center text-xl h-11"
          maxLength={4}
        />
        <Input
          placeholder="Nombre de la categoría"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 h-11"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Color</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
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

      <div
        className="rounded-xl p-3 flex items-center gap-3 text-sm font-semibold text-black"
        style={{ backgroundColor: color }}
      >
        <span className="text-xl">{icon}</span>
        <span>{name || "Vista previa"}</span>
      </div>

      <Button type="submit" className="w-full h-11" disabled={loading || !name.trim()}>
        {loading ? "Guardando..." : "Crear categoría"}
      </Button>
    </form>
  );
}
