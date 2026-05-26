"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { formatCOP, formatAmountInput, parseAmountInput } from "@/lib/utils/currency";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: string | null;
  icon: string | null;
  color: string | null;
}

export function GoalRow({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [editing, setEditing]       = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [saving, setSaving]         = useState(false);

  const pct       = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
  const remaining = goal.target_amount - goal.current_amount;
  const daysLeft  = goal.target_date
    ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / 86400000)
    : null;
  const isActive = goal.status === "active";

  // Edit form state
  const [name,          setName]          = useState(goal.name);
  const [description,   setDescription]   = useState(goal.description ?? "");
  const [icon,          setIcon]          = useState(goal.icon ?? "🎯");
  const [targetAmount,  setTargetAmount]  = useState(formatAmountInput(String(goal.target_amount)));
  const [currentAmount, setCurrentAmount] = useState(formatAmountInput(String(goal.current_amount)));
  const [targetDate,    setTargetDate]    = useState(goal.target_date?.slice(0, 10) ?? "");
  const [status,        setStatus]        = useState(goal.status ?? "active");

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           name.trim(),
          description:    description || null,
          icon,
          target_amount:  parseAmountInput(targetAmount) || goal.target_amount,
          current_amount: parseAmountInput(currentAmount),
          target_date:    targetDate ? new Date(targetDate).toISOString() : null,
          status,
        }),
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-medium text-foreground">
              {goal.icon ?? "🎯"} {goal.name}
            </p>
            {goal.description && (
              <p className="text-xs text-foreground/40 mt-0.5">{goal.description}</p>
            )}
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
          <span
            className="text-xs px-3 py-1 rounded-full shrink-0 font-medium"
            style={{ backgroundColor: "#FEFF6E", color: "#1A1A1A" }}
          >
            {pct}%
          </span>
        </div>

        <div className="space-y-2">
          <div className="h-1.5 bg-foreground/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: goal.color ?? "var(--foreground)" }}
            />
          </div>
          <div className="flex justify-between text-xs text-foreground/40">
            <span>{formatCOP(goal.current_amount)} ahorrado</span>
            <span>meta {formatCOP(goal.target_amount)}</span>
          </div>
        </div>

        <div className="flex gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-foreground/40">Falta</p>
            <p className="font-serif text-lg font-normal text-foreground mt-0.5">{formatCOP(remaining)}</p>
          </div>
          {daysLeft !== null && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-foreground/40">Días restantes</p>
              <p className="font-serif text-lg font-normal text-foreground mt-0.5">
                {daysLeft > 0 ? daysLeft : "Vencida"}
              </p>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-normal text-foreground">Editar meta</h2>
              <button
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg hover:bg-foreground/6 text-foreground/40 hover:text-foreground transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-3">
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
                  <label className="text-[10px] uppercase tracking-widest text-foreground/40">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
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
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Meta (COP)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(formatAmountInput(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
                />
              </div>

              {/* Current amount */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40">Ya ahorrado (COP)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(formatAmountInput(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
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

              {/* Status */}
              <div className="flex gap-2">
                {["active", "completed"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 h-10 rounded-xl text-sm font-medium transition-colors ${
                      status === s
                        ? "bg-foreground text-background"
                        : "bg-foreground/6 text-foreground/60 hover:bg-foreground/10"
                    }`}
                  >
                    {s === "active" ? "Activa" : "Completada"}
                  </button>
                ))}
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
