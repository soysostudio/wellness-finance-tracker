"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
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
      <div className="text-center space-y-3">
        <div className="text-4xl">📬</div>
        <h2 className="text-xl font-bold">Revisa tu correo</h2>
        <p className="text-muted-foreground text-sm">
          Te enviamos un enlace mágico a <strong>{email}</strong>.
          Haz clic en el enlace para entrar.
        </p>
        <button
          onClick={() => setState("idle")}
          className="text-sm text-muted-foreground underline underline-offset-4 mt-4"
        >
          Usar otro correo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-black">Bienvenido de vuelta</h1>
        <p className="text-muted-foreground text-sm">
          Te enviamos un enlace mágico — sin contraseñas.
        </p>
      </div>

      <div className="space-y-3">
        <Input
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-12"
        />

        {state === "error" && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <Button
          type="submit"
          className="w-full h-12 font-bold"
          disabled={state === "loading"}
        >
          {state === "loading" ? "Enviando..." : "Enviar enlace mágico"}
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-semibold text-foreground underline underline-offset-4">
          Regístrate gratis
        </Link>
      </p>
    </form>
  );
}
