"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { formatAmountInput, parseAmountInput } from "@/lib/utils/currency";
import { normalizePhone } from "@/lib/utils/phone";

interface Props {
  userId: string;
  email: string;
  initialName: string;
  initialPhone: string;
  initialCurrency: string;
  initialIncome: number | null;
}

const CURRENCIES = ["COP", "USD", "EUR", "MXN", "ARS", "PEN", "CLP"];

export function ProfileForm({
  userId,
  email,
  initialName,
  initialPhone,
  initialCurrency,
  initialIncome,
}: Props) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [currency, setCurrency] = useState(initialCurrency);
  const [income, setIncome] = useState(initialIncome ? formatAmountInput(String(initialIncome)) : "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("users")
      .update({
        full_name: name.trim(),
        phone_number: phone.trim() ? normalizePhone(phone) : null,
        currency,
        monthly_income: income ? parseAmountInput(income) : null,
      })
      .eq("id", userId);

    setLoading(false);
    if (err) {
      setError("No se pudo guardar. Intenta de nuevo.");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-foreground/40">
        Tu perfil
      </p>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nombre</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="h-11"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Correo</label>
          <Input value={email} disabled className="h-11 opacity-60" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Número de WhatsApp</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 300 123 4567"
            type="tel"
            className="h-11"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Ingreso mensual (opcional)
          </label>
          <Input
            value={income}
            onChange={(e) => setIncome(formatAmountInput(e.target.value))}
            placeholder="Ej: 3,000,000"
            type="text"
            inputMode="numeric"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground px-1">
            Luca lo usa para calcular tu tasa de ahorro
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
      </Button>
    </form>
  );
}
