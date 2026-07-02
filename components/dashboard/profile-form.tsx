"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { formatAmountInput, parseAmountInput } from "@/lib/utils/currency";

interface Props {
  userId: string;
  email: string;
  initialName: string;
  initialIncome: number | null;
}

export function ProfileForm({
  userId,
  email,
  initialName,
  initialIncome,
}: Props) {
  const [name, setName] = useState(initialName);
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
    // Actualiza la tabla users Y el user_metadata de auth en paralelo — el
    // layout del dashboard lee el nombre de user_metadata para no bloquear
    // la navegación con una consulta extra, así que deben quedar sincronizados.
    const [{ error: err }] = await Promise.all([
      supabase
        .from("users")
        .update({
          full_name: name.trim(),
          currency: "COP",
          monthly_income: income ? parseAmountInput(income) : null,
        })
        .eq("id", userId),
      supabase.auth.updateUser({ data: { full_name: name.trim() } }),
    ]);

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
          <label className="text-xs font-medium text-muted-foreground">Moneda</label>
          <div className="w-full h-11 rounded-md border border-input bg-muted/40 px-3 flex items-center justify-between text-sm">
            <span className="text-foreground">Pesos colombianos (COP)</span>
            <span className="text-[10px] uppercase tracking-widest text-foreground/30">Pronto: más monedas</span>
          </div>
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
