"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SYSTEM_CATEGORIES } from "@/lib/utils/categories";

const expenseCategories = SYSTEM_CATEGORIES.filter((c) => !c.isIncome);
const incomeCategories  = SYSTEM_CATEGORIES.filter((c) => c.isIncome);

export function NewTransactionForm() {
  const router = useRouter();
  const [open, setOpen]               = useState(false);
  const [type, setType]               = useState<"expense" | "income">("expense");
  const [amount, setAmount]           = useState("");
  const [merchant, setMerchant]       = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("otros");
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  function handleTypeChange(t: "expense" | "income") {
    setType(t);
    setCategorySlug(t === "expense" ? "otros" : "ingreso");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:           amt,
          transaction_type: type,
          merchant:         merchant || undefined,
          description:      description || undefined,
          category_slug:    categorySlug || undefined,
          occurred_at:      new Date(date + "T12:00:00").toISOString(),
        }),
      });

      if (res.ok) {
        setAmount(""); setMerchant(""); setDescription("");
        setCategorySlug(type === "expense" ? "otros" : "ingreso");
        setDate(new Date().toISOString().slice(0, 10));
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Error al guardar");
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
        Agregar transacción
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 space-y-4 border border-foreground/5">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm text-foreground">Nueva transacción</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-foreground/40 hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Type toggle */}
      <div className="flex gap-2">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
              type === t
                ? "bg-foreground text-background"
                : "bg-foreground/6 text-foreground/60 hover:bg-foreground/10"
            }`}
          >
            {t === "expense" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Monto (COP)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="ej: 45000"
          required
          autoFocus
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {/* Merchant */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Comercio (opcional)</label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="ej: Rappi, D1, Uber..."
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Descripción (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ej: almuerzo, gasolina..."
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Categoría</label>
        <select
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving || !amount}
        className="w-full h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar transacción"}
      </button>
    </form>
  );
}
