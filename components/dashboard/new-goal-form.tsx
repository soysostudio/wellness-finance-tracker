"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatAmountInput, parseAmountInput } from "@/lib/utils/currency";

export function NewGoalForm() {
  const router = useRouter();
  const [open, setOpen]               = useState(false);
  const [name, setName]               = useState("");
  const [icon, setIcon]               = useState("🎯");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate]   = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseAmountInput(targetAmount);
    if (!name.trim() || !amount) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           name.trim(),
          icon,
          description:    description || undefined,
          target_amount:  amount,
          current_amount: parseAmountInput(currentAmount),
          target_date:    targetDate ? new Date(targetDate).toISOString() : null,
        }),
      });

      if (res.ok) {
        setName(""); setIcon("🎯"); setDescription("");
        setTargetAmount(""); setCurrentAmount(""); setTargetDate("");
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Error al crear la meta");
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
        Nueva meta
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 space-y-4 border border-foreground/5">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm text-foreground">Nueva meta</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-foreground/40 hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>

      {/* Icon + Name */}
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
          <label className="text-[10px] uppercase tracking-widest text-foreground/40">Nombre de la meta</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej: Vacaciones, fondo de emergencia..."
            required
            autoFocus
            className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Descripción (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ej: Viaje a Cartagena en diciembre"
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {/* Target amount */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Meta de ahorro (COP)</label>
        <input
          type="text"
          inputMode="numeric"
          value={targetAmount}
          onChange={(e) => setTargetAmount(formatAmountInput(e.target.value))}
          placeholder="ej: 2,000,000"
          required
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {/* Current amount (optional) */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Ya tengo ahorrado (opcional)</label>
        <input
          type="text"
          inputMode="numeric"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(formatAmountInput(e.target.value))}
          placeholder="ej: 500,000"
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {/* Target date */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Fecha límite (opcional)</label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={saving || !name.trim() || !targetAmount}
        className="w-full h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Crear meta"}
      </button>
    </form>
  );
}
