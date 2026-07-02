"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

interface StartResponse {
  code: string;
  phone: string;
  whatsapp: string;
  wa_link: string;
}

export function PhoneVerify({ linkedPhone }: { linkedPhone: string | null }) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<StartResponse | null>(null);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/phone/verify/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo generar el código");
        return;
      }
      setPending(data as StartResponse);
    } finally {
      setLoading(false);
    }
  }

  // Paso 2: mostrar el código a enviar
  if (pending) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground/70 leading-relaxed">
          Para confirmar que <span className="font-medium text-foreground">{pending.phone}</span> es tuyo,
          envía este código a Luca por WhatsApp <span className="font-medium text-foreground">desde ese número</span>:
        </p>
        <div className="rounded-xl bg-[#FEFF6E] text-[#1A1D1C] font-amount text-center text-2xl font-bold tracking-widest py-3">
          {pending.code}
        </div>
        <a
          href={pending.wa_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Abrir WhatsApp con el código
        </a>
        <p className="text-xs text-foreground/40">
          Cuando lo envíes, Luca confirmará y tu número quedará vinculado. El código vence en 15 minutos.
        </p>
        <button
          onClick={() => { setPending(null); setPhone(""); }}
          className="text-xs text-foreground/40 hover:text-foreground underline underline-offset-4"
        >
          Usar otro número
        </button>
      </div>
    );
  }

  // Estado: número ya vinculado
  if (linkedPhone && !editing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/50">Número vinculado</span>
          <span className="font-medium text-foreground font-amount">{linkedPhone}</span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-foreground/40 hover:text-foreground underline underline-offset-4"
        >
          Cambiar número
        </button>
      </div>
    );
  }

  // Estado: sin número o cambiando → pedir y generar código
  return (
    <form onSubmit={handleStart} className="space-y-3">
      {!linkedPhone && (
        <p className="text-sm text-destructive/80">Aún no has vinculado tu WhatsApp.</p>
      )}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Número de WhatsApp</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+57 300 123 4567"
          type="tel"
          className="h-11"
          autoFocus={editing}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        {linkedPhone && (
          <button
            type="button"
            onClick={() => { setEditing(false); setError(""); }}
            className="flex-1 h-11 rounded-full border border-foreground/10 text-sm text-foreground/60 hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="flex-1 h-11 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {loading ? "Generando..." : "Enviar código"}
        </button>
      </div>
    </form>
  );
}
