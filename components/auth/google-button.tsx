"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Entrar con Google evita depender del correo (los magic links rebotan en
// Hotmail/Outlook por reputación del dominio nuevo). Requiere el proveedor
// Google habilitado en Supabase → Authentication → Providers.
export function GoogleButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleGoogle() {
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    // Si no hay error, el navegador redirige a Google — no hace falta resetear.
    if (error) {
      setLoading(false);
      setErrorMsg("No pudimos conectar con Google. Intenta con tu correo.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="flex items-center justify-center gap-3 w-full h-12 rounded-full bg-card border border-foreground/12 text-sm font-medium text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
          <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
        </svg>
        {loading ? "Conectando..." : label}
      </button>
      {errorMsg && <p className="text-xs text-red-500 px-1">{errorMsg}</p>}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-foreground/10" />
      <span className="text-[10px] uppercase tracking-widest text-foreground/35">o con tu correo</span>
      <div className="h-px flex-1 bg-foreground/10" />
    </div>
  );
}
