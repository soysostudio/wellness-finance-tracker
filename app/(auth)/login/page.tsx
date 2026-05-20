"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
          <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 mb-1">Listo</p>
          <h1 className="font-serif text-4xl font-normal text-[#1A1A1A]">Revisa tu correo</h1>
        </div>
        <p className="text-[#1A1A1A]/55 text-sm leading-relaxed">
          Te enviamos un enlace mágico a{" "}
          <span className="text-[#1A1A1A] font-medium">{email}</span>.
          Haz clic en él para entrar.
        </p>
        <button
          onClick={() => setState("idle")}
          className="text-xs text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors underline underline-offset-4"
        >
          Usar otro correo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 mb-1">Bienvenido</p>
        <h1 className="font-serif text-4xl font-normal text-[#1A1A1A]">Inicia sesión</h1>
        <p className="text-sm text-[#1A1A1A]/50 mt-1">Te enviamos un enlace — sin contraseñas.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full h-12 px-4 rounded-2xl bg-white border border-[#1A1A1A]/8 text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/30 outline-none focus:border-[#1A1A1A]/30 transition-colors"
        />

        {state === "error" && (
          <p className="text-xs text-red-500 px-1">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full h-12 rounded-full bg-[#1A1A1A] text-[#F7F3EC] text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {state === "loading" ? "Enviando..." : "Enviar enlace mágico"}
        </button>
      </form>

      <p className="text-center text-sm text-[#1A1A1A]/40">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="text-[#1A1A1A] underline underline-offset-4 hover:opacity-60 transition-opacity">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
