"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Si un gasto entra por WhatsApp mientras el dashboard está abierto, la página
// no se enteraba hasta recargar a mano. Este componente (invisible) escucha
// los cambios del usuario vía Supabase Realtime y refresca los Server
// Components con router.refresh(). También refresca al volver a la pestaña,
// por si la conexión Realtime se durmió con el teléfono bloqueado.
const WATCHED_TABLES = ["transactions", "budgets", "goals"] as const;
const FOCUS_THROTTLE_MS = 20_000;

export function RealtimeRefresh() {
  const router = useRouter();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    const refresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      // Varios eventos seguidos (gasto + presupuesto actualizado) → un solo refresh
      debounceTimer.current = setTimeout(() => {
        lastRefreshAt.current = Date.now();
        router.refresh();
      }, 400);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      let ch = supabase.channel("dashboard-refresh");
      for (const table of WATCHED_TABLES) {
        ch = ch.on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter: `user_id=eq.${user.id}` },
          refresh
        );
      }
      channel = ch.subscribe();
    });

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefreshAt.current < FOCUS_THROTTLE_MS) return;
      refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      cancelled = true;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
