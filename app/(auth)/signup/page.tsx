"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "form" | "phone" | "sent" | "error";

export default function SignupPage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();

    // Sign up with OTP (magic link)
    const { error: signupError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        data: { full_name: name },
      },
    });

    if (signupError) {
      setErrorMsg("No pudimos crear tu cuenta. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // If phone provided, save it (we'll persist after email confirmed)
    if (phone) {
      localStorage.setItem("luca_pending_phone", formatPhone(phone));
    }

    setLoading(false);
    setStep("sent");
  }

  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("57")) return `+${digits}`;
    if (digits.startsWith("3") && digits.length === 10) return `+57${digits}`;
    return `+${digits}`;
  }

  if (step === "sent") {
    return (
      <div className="text-center space-y-3">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-bold">¡Casi listo!</h2>
        <p className="text-muted-foreground text-sm">
          Te enviamos un enlace a <strong>{email}</strong>.
          Haz clic en el enlace para activar tu cuenta y empezar con Luca.
        </p>
        <div className="mt-6 p-4 bg-muted rounded-2xl text-sm space-y-2 text-left">
          <p className="font-semibold">Después de confirmar tu correo:</p>
          <p>1. Agrega este número a WhatsApp: <strong>+57 300 000 0000</strong></p>
          <p>2. Escríbele "Hola" a Luca</p>
          <p>3. Luca te guiará por el resto 💪</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-black">Crea tu cuenta</h1>
        <p className="text-muted-foreground text-sm">
          Gratis para siempre. Sin contraseñas.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-12"
        />

        <Input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-12"
        />

        <div className="space-y-1">
          <Input
            type="tel"
            placeholder="Tu número de WhatsApp (ej: 300 123 4567)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground px-1">
            Con este número Luca te reconocerá en WhatsApp
          </p>
        </div>

        {errorMsg && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <Button
          type="submit"
          className="w-full h-12 font-bold"
          disabled={loading}
        >
          {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
