"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton, AuthDivider } from "@/components/auth/google-button";

type State = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail]     = useState("");
  const [state, setState]     = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
      },
    });

    if (error) {
      setState("error");
      setErrorMsg(error.message || "No pudimos enviarte el enlace. Intenta de nuevo.");
    } else {
      setState("sent");
    }
  }

  if (state === "sent") {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Listo</p>
          <h1 className="font-display text-3xl font-bold text-foreground">Revisa tu correo</h1>
        </div>
        <p className="text-foreground/55 text-sm leading-relaxed">
          Te enviamos un enlace mágico a{" "}
          <span className="text-foreground font-medium">{email}</span>.
          Haz clic en él para entrar.
        </p>
        <button
          onClick={() => setState("idle")}
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
        <p className="text-[10px] uppercase tracking-widest text-foreground/40 mb-1">Bienvenido</p>
        <h1 className="font-display text-3xl font-bold text-foreground">Inicia sesión</h1>
        <p className="text-sm text-foreground/50 mt-1">Sin contraseñas.</p>
      </div>

      <GoogleButton label="Continuar con Google" />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full h-12 px-4 rounded-2xl bg-card border border-foreground/8 text-sm text-foreground placeholder-foreground/30 outline-none focus:border-foreground/30 transition-colors"
        />

        {state === "error" && (
          <p className="text-xs text-red-500 px-1">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full h-12 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {state === "loading" ? "Enviando..." : "Enviar enlace mágico"}
        </button>
      </form>

      <p className="text-center text-sm text-foreground/40">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-4 hover:opacity-60 transition-opacity">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
