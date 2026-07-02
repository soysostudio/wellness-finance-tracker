import { Skeleton } from "@/components/ui/skeleton";

// Fallback mostrado automáticamente durante la navegación entre páginas del
// dashboard (Suspense de Next). Forma genérica: encabezado + tarjetas.
export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-10" aria-busy="true" aria-label="Cargando">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
      </div>

      {/* Bloque principal (recibo / resumen) */}
      <Skeleton className="h-48 w-full max-w-md rounded-3xl" />

      {/* Grilla de tarjetas */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-40 mb-3" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
