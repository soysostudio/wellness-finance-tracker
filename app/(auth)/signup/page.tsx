"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Step = "form" | "sent";

export default function SignupPage() {
  const [step, setStep]       = useState<Step>("form");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();
    const formattedPhone = phone ? formatPhone(phone) : null;

    const { error: signupError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
        // Store name + phone in metadata so callback can persist them server-side
        // regardless of which browser/device opens the magic link
        data: {
          full_name: name,
          ...(formattedPhone ? { phone_number: formattedPhone } : {}),
        },
      },
    });

    if (signupError) {
      setErrorMsg(signupError.message || "No pudimos crear tu cuenta. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    // localStorage as fallback for same-browser flow
    if (formattedPhone) localStorage.setItem("luca_pending_phone", formattedPhone);
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
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Listo</p>
          <h1 className="font-serif text-4xl font-normal text-foreground">Revisa tu correo</h1>
        </div>
        <p className="text-foreground/55 text-sm leading-relaxed">
          Te enviamos un enlace a <span className="text-foreground font-medium">{email}</span>.
          Haz clic en él para activar tu cuenta.
        </p>
        <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "#FEFF6E" }}>
          <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">Próximo paso</p>
          <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
            Después de confirmar, escríbele <strong className="text-[#1A1A1A]">"Hola"</strong> a Luca
            en WhatsApp y él te guiará por el resto.
          </p>
        </div>
        <button
          onClick={() => setStep("form")}
          className="text-xs text-foreground/40 hover:text-foreground transition-colors underline underline-offset-4"
        >
          Usar otro correo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Gratis para siempre</p>
        <h1 className="font-serif text-4xl font-normal text-foreground">Crea tu cuenta</h1>
        <p className="text-sm text-foreground/50 mt-1">Sin contraseñas, en 2 minutos.</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-3">
        <AuthInput
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <AuthInput
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <div className="space-y-1.5">
          <AuthInput
            type="tel"
            placeholder="WhatsApp (ej: 300 123 4567)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-foreground/40 px-1">
            Con este número Luca te reconocerá en WhatsApp
          </p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 px-1">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 mt-1"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
        </button>
      </form>

      <p className="text-center text-sm text-foreground/40">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:opacity-60 transition-opacity">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-12 px-4 rounded-2xl bg-card border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
    />
  );
}
