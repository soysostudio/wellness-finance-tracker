"use client";

import { useEffect, useState } from "react";

/**
 * Se consulta en el cliente después del primer render, para que el punto de
 * alerta de presupuesto nunca bloquee la navegación (ver /api/budgets/alert-status).
 * Empieza en `false` y se actualiza cuando llega la respuesta.
 */
export function useBudgetAlert(): boolean {
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/budgets/alert-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data) setAlert(!!data.alert); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return alert;
}
