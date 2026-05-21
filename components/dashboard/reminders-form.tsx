"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type ReminderType = "daily_summary" | "weekly_summary";

interface ActiveReminders {
  daily: boolean;
  weekly: boolean;
}

interface Props {
  userId: string;
  active: ActiveReminders;
  reminderIds: { daily: string | null; weekly: string | null };
}

export function RemindersForm({ userId, active, reminderIds }: Props) {
  const [daily, setDaily] = useState(active.daily);
  const [weekly, setWeekly] = useState(active.weekly);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function toggle(type: ReminderType, enabled: boolean) {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const existingId = type === "daily_summary" ? reminderIds.daily : reminderIds.weekly;

    let err = null;
    if (existingId) {
      const result = await supabase
        .from("reminders")
        .update({ is_active: enabled })
        .eq("id", existingId);
      err = result.error;
    } else if (enabled) {
      const result = await supabase.from("reminders").insert({
        user_id: userId,
        reminder_type: type,
        is_active: true,
      });
      err = result.error;
    }

    setLoading(false);

    if (err) {
      setError("No se pudo guardar. Intenta de nuevo.");
      return;
    }

    if (type === "daily_summary") setDaily(enabled);
    else setWeekly(enabled);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  return (
    <div className="bg-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          Recordatorios de Luca
        </h2>
        {saved && <span className="text-xs text-green-600 font-semibold">✓ Guardado</span>}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>

      <div className="space-y-3">
        <ReminderToggle
          label="Resumen diario"
          description="Luca te manda un resumen de tus gastos del día a las 8pm"
          enabled={daily}
          loading={loading}
          onChange={(v) => toggle("daily_summary", v)}
        />
        <ReminderToggle
          label="Resumen semanal"
          description="Los domingos a las 8pm recibes el balance de la semana"
          enabled={weekly}
          loading={loading}
          onChange={(v) => toggle("weekly_summary", v)}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Los recordatorios llegan por WhatsApp al número vinculado a tu cuenta.
      </p>
    </div>
  );
}

function ReminderToggle({
  label,
  description,
  enabled,
  loading,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  loading: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
          enabled ? "bg-foreground" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
