"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

// Spinner sutil dentro de un <Link>: se muestra mientras la navegación a esa
// ruta está pendiente. Tamaño fijo + toggle de opacidad para no causar salto.
// Debe renderizarse como descendiente de un <Link>.
export function NavPending({ size = 14 }: { size?: number }) {
  const { pending } = useLinkStatus();
  return (
    <Loader2
      size={size}
      strokeWidth={2}
      aria-hidden
      className={`shrink-0 animate-spin transition-opacity ${pending ? "opacity-60" : "opacity-0"}`}
    />
  );
}
