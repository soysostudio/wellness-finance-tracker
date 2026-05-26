"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  yearMonth: string; // "YYYY-MM"
}

export function MonthNav({ yearMonth }: Props) {
  const router = useRouter();

  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const monthName = date.toLocaleDateString("es-CO", { month: "long" });

  function go(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/overview?month=${ym}`);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => go(-1)}
        className="p-1 rounded-lg hover:bg-foreground/6 text-foreground/40 hover:text-foreground transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={16} strokeWidth={1.5} />
      </button>

      <p className="text-xs text-foreground/40 uppercase tracking-widest min-w-[120px] text-center">
        {monthName} {year}
      </p>

      <button
        onClick={() => go(1)}
        disabled={isCurrentMonth}
        className="p-1 rounded-lg hover:bg-foreground/6 text-foreground/40 hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
