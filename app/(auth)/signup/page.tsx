"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/utils/phone";

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
    const formattedPhone = phone ? normalizePhone(phone) : null;

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

  if (step === "sent") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Listo</p>
          <h1 className="font-display text-3xl font-bold text-foreground">Revisa tu correo</h1>
        </div>
        <p className="text-foreground/55 text-sm leading-relaxed">
          Te enviamos un enlace a <span className="text-foreground font-medium">{email}</span>.
          Haz clic en él para activar tu cuenta.
        </p>
        <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: "#FEFF6E" }}>
          <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/50">Próximo paso</p>
          <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
            Después de confirmar tu correo, escríbele <strong className="text-[#1A1A1A]">&quot;Hola&quot;</strong> a Luca
            en WhatsApp y él te guiará por el resto.
          </p>
          <a
            href="https://wa.me/15559613540"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#1A1A1A] text-[#FEFF6E] text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Abrir WhatsApp con Luca
          </a>
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
        <h1 className="font-display text-3xl font-bold text-foreground">Crea tu cuenta</h1>
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
