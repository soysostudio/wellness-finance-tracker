"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/overview",      label: "Resumen",        emoji: "📊" },
  { href: "/transactions",  label: "Transacciones",  emoji: "💳" },
  { href: "/budgets",       label: "Presupuestos",   emoji: "🎯" },
  { href: "/goals",         label: "Metas",          emoji: "🏆" },
  { href: "/insights",      label: "Insights de Luca", emoji: "✨" },
  { href: "/categories",    label: "Categorías",     emoji: "🏷️" },
  { href: "/settings",      label: "Configuración",  emoji: "⚙️" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <span className="text-base">{item.emoji}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
