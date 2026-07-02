"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";

interface CustomReminder {
  id: string;
  title: string | null;
  frequency: string | null;
  day_of_month: number | null;
  day_of_week: number | null;
  run_date: string | null;
}

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function describe(r: CustomReminder): string {
  if (r.frequency === "monthly") return `Cada mes el día ${r.day_of_month}`;
  if (r.frequency === "weekly")  return `Cada ${WEEKDAYS[r.day_of_week ?? 1]}`;
  if (r.frequency === "once" && r.run_date)
    return `Una vez · ${new Date(r.run_date + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long" })}`;
  return "Personalizado";
}

export function CustomReminders({ reminders }: { reminders: CustomReminder[] }) {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [title, setTitle]         = useState("");
  const [frequency, setFrequency] = useState<"monthly" | "weekly" | "once">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [dayOfWeek, setDayOfWeek]   = useState(1);
  const [runDate, setRunDate]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (frequency === "once" && !runDate) { setError("Elige una fecha"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminder_type: "custom",
          title:         title.trim(),
          frequency,
          day_of_month:  frequency === "monthly" ? dayOfMonth : undefined,
          day_of_week:   frequency === "weekly"  ? dayOfWeek  : undefined,
          run_date:      frequency === "once"    ? runDate    : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setError(d.error ?? "No se pudo crear");
        return;
      }
      setTitle(""); setRunDate(""); setOpen(false);
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
    if (res.ok) startTransition(() => router.refresh());
  }

  return (
    <div className="bg-card rounded-2xl p-5 space-y-4 border border-foreground/5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-foreground/40">Mis recordatorios</p>
        <span className="text-[10px] text-foreground/30">Llegan a las 8pm por WhatsApp</span>
      </div>

      {/* List */}
      {reminders.length > 0 && (
        <div className="space-y-1.5">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-foreground/8">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                <p className="text-xs text-foreground/40">{describe(r)}</p>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                disabled={isPending}
                aria-label={`Eliminar recordatorio ${r.title}`}
                className="p-1.5 rounded-lg text-foreground/40 hover:text-destructive hover:bg-destructive/8 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {open ? (
        <form onSubmit={handleCreate} className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-foreground/40">¿Qué te recuerdo?</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej: Pagar el arriendo"
              required
              autoFocus
              className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-foreground/40">¿Cada cuándo?</label>
            <div className="flex gap-2">
              {(["monthly", "weekly", "once"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  aria-pressed={frequency === f}
                  className={`flex-1 h-10 rounded-xl text-xs font-medium transition-colors ${
                    frequency === f ? "bg-foreground text-background" : "bg-foreground/6 text-foreground/60 hover:bg-foreground/10"
                  }`}
                >
                  {f === "monthly" ? "Mensual" : f === "weekly" ? "Semanal" : "Una vez"}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional day picker */}
          {frequency === "monthly" && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-foreground/40">Día del mes</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value))))}
                className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
              />
            </div>
          )}
          {frequency === "weekly" && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-foreground/40">Día de la semana</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
              >
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}
          {frequency === "once" && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-foreground/40">Fecha</label>
              <input
                type="date"
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-background border border-foreground/8 text-sm text-foreground outline-none focus:border-foreground/30 transition-colors"
              />
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setError(""); }}
              className="flex-1 h-11 rounded-full border border-foreground/10 text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || isPending || !title.trim()}
              className="flex-1 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Crear recordatorio"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-medium border border-dashed border-border rounded-xl px-4 py-2.5 w-full hover:bg-foreground/4 transition-colors text-foreground/60"
        >
          <Plus size={16} strokeWidth={1.5} />
          Nuevo recordatorio
        </button>
      )}
    </div>
  );
}
