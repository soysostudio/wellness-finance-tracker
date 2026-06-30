"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryColor } from "@/lib/utils/categories";
import { formatCOP, formatAmountInput, parseAmountInput } from "@/lib/utils/currency";

interface Budget {
  id: string;
  amount_limit: number;
  alert_at: number | null;
  period: string | null;
  categories: { name: string; slug: string; color: string | null } | { name: string; slug: string; color: string | null }[] | null;
}

const ALERT_OPTIONS = [
  { value: 0.7, label: "70%" },
  { value: 0.8, label: "80%" },
  { value: 0.9, label: "90%" },
];

export function BudgetRow({ budget, spent }: { budget: Budget; spent: number }) {
  const router = useRouter();
  const [editing, setEditing]       = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const cat      = Array.isArray(budget.categories) ? budget.categories[0] : budget.categories;
  const slug     = cat?.slug ?? "otros";
  const color    = getCategoryColor(slug);
  const pct      = Math.min(Math.round((spent / budget.amount_limit) * 100), 100);
  const remaining = budget.amount_limit - spent;
  const alertPct = Math.round((budget.alert_at ?? 0.8) * 100);

  const barColor =
    pct >= 100 ? "#E76F51" :
    pct >= alertPct ? "#F4A261" :
    "var(--foreground)";

  // Edit form state
  const [amountLimit, setAmountLimit] = useState(formatAmountInput(String(budget.amount_limit)));
  const [alertAt, setAlertAt]         = useState(budget.alert_at ?? 0.8);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    const amount = parseAmountInput(amountLimit);
    if (!amount) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_limit: amount, alert_at: alertAt }),
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
      <div className="rounded-2xl group">
      <div className="bg-card border border-foreground/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: color + "26" }}
          >
            <CategoryIcon slug={slug} size={16} strokeWidth={1.5} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{cat?.name ?? "Categoría"}</p>
            <p className="text-xs text-foreground/40 capitalize">{budget.period}</p>
          </div>
          {confirming ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-foreground/50">¿Eliminar?</span>
              <button onClick={handleDelete} disabled={deleting} className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50">{deleting ? "..." : "Sí"}</button>
              <button onClick={() => setConfirming(false)} className="text-xs text-foreground/40 hover:text-foreground">No</button>
            </div>
          ) : (
            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg hover:bg-foreground/6 text-foreground/40 hover:text-foreground transition-colors"
                title="Editar"
              >
                <Pencil size={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-foreground/40 hover:text-red-500 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          )}
          <div className="text-right shrink-0">
            <p className="font-amount text-xl font-medium text-foreground">{pct}%</p>
            <p className="text-[10px] text-foreground/40 uppercase tracking-widest">usado</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-1.5 bg-foreground/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="leader-row text-xs text-foreground/40">
            <span className="font-amount shrink-0">{formatCOP(spent)} gastado</span>
            <span className="leader-fill" />
            <span className="font-amount shrink-0">límite {formatCOP(budget.amount_limit)}</span>
          </div>
        </div>

        {pct >= 100 ? (
          <p className="text-xs text-[#E76F51] font-medium">
            🚨 Superaste tu presupuesto por <span className="font-amount">{formatCOP(Math.abs(remaining))}</span>
          </p>
        ) : pct >= alertPct ? (
          <p className="text-xs text-[#F4A261] font-medium">
            ⚠️ Quedan <span className="font-amount">{formatCOP(remaining)}</span> — cerca del límite
          </p>
        ) : (
          <p className="text-xs text-foreground/40">
            <span className="font-amount">{formatCOP(remaining)}</span> disponibles
          </p>
        )}
      </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-normal text-foreground">Editar presupuesto</h2>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg hover:bg-foreground/6 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Límite mensual (COP)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountLimit}
                  onChange={(e) => setAmountLimit(formatAmountInput(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
                />
              </div>

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
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 h-11 rounded-full border border-foreground/10 text-sm text-foreground/60 hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
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
