"use client";

import { Download } from "lucide-react";
import { useState } from "react";

export function ExportCsvButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "luca-transacciones.csv";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground transition-colors disabled:opacity-40"
    >
      <Download size={13} strokeWidth={1.5} />
      {loading ? "Exportando..." : "Exportar CSV"}
    </button>
  );
}
