"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatAmountInput, parseAmountInput } from "@/lib/utils/currency";

export function GoalContributionForm({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [kind, setKind]     = useState<"aporte" | "retiro">("aporte");
  const [amount, setAmount] = useState("");
  const [note, setNote]     = useState("");
  const [error, setError]   = useState("");
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseAmountInput(amount);
    if (!value) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/goals/${goalId}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: kind === "aporte" ? value : -value, note: note || undefined }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "No se pudo guardar");
        return;
      }
      setAmount("");
      setNote("");
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || isPending;

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 space-y-4 border border-foreground/5">
      <p className="text-[10px] uppercase tracking-widest text-foreground/40">Registrar movimiento</p>

      <div className="flex gap-2">
        {(["aporte", "retiro"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            aria-pressed={kind === k}
            className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
              kind === k ? "bg-foreground text-background" : "bg-foreground/6 text-foreground/60 hover:bg-foreground/10"
            }`}
          >
            {k === "aporte" ? "Aporte" : "Retiro"}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Monto (COP)</label>
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(formatAmountInput(e.target.value))}
          placeholder="ej: 200,000"
          required
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-foreground/40">Nota (opcional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ej: ahorro de la quincena"
          className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={busy || !amount}
        className="w-full h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {busy ? "Guardando..." : kind === "aporte" ? "Agregar aporte" : "Registrar retiro"}
      </button>
    </form>
  );
}
