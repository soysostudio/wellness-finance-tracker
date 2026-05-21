"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SYSTEM_CATEGORIES } from "@/lib/utils/categories";

interface SystemCat { slug: string; name: string }
interface CustomCat  { id: string; slug: string; name: string }

interface Props {
  systemCategories: SystemCat[];
  customCategories: CustomCat[];
}

const ALERT_OPTIONS = [
  { value: 0.7,  label: "70%" },
  { value: 0.8,  label: "80%" },
  { value: 0.9,  label: "90%" },
];

export function NewBudgetForm({ systemCategories, customCategories }: Props) {
  const router = useRouter();
  const [open, setOpen]               = useState(false);
  const [categorySlug, setCategorySlug] = useState(systemCategories[0]?.slug ?? "");
  const [amountLimit, setAmountLimit] = useState("");
  const [alertAt, setAlertAt]         = useState(0.8);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(amountLimit.replace(/\D/g, ""));
    if (!amount || !categorySlug) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_slug: categorySlug, amount_limit: amount, alert_at: alertAt }),
      });
      if (res.ok) {
        setAmountLimit("");
        setCategorySlug(systemCategories[0]?.slug ?? "");
        setAlertAt(0.8);
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Error al crear presupuesto");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold border border-dashed border-border rounded-2xl px-4 py-3 w-full hover:bg-card transition-colors text-muted-foreground"
      >
        <span className="text-lg">+</span>
        Nuevo presupuesto
      </button>
    );
  }

  const allCategories = [
    ...systemCategories.map((c) => ({ slug: c.slug, name: c.name })),
    ...customCategories.map((c) => ({ slug: c.slug, name: `${c.name} (personal)` })),
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 space-y-4 border border-foreground/5">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm text-foreground">Nuevo presupuesto</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-foreground/40 hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Categoría</label>
        <select
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
        >
          {allCategories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Límite mensual (COP)</label>
        <input
          type="number"
          value={amountLimit}
          onChange={(e) => setAmountLimit(e.target.value)}
          placeholder="ej: 300000"
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
          required
        />
      </div>

      {/* Alert threshold */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Alerta cuando alcance</label>
        <div className="flex gap-2">
          {ALERT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAlertAt(opt.value)}
              className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
                alertAt === opt.value
                  ? "bg-foreground text-background"
                  : "bg-foreground/6 text-foreground/60 hover:bg-foreground/10"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving || !amountLimit}
        className="w-full h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Crear presupuesto"}
      </button>
    </form>
  );
}
