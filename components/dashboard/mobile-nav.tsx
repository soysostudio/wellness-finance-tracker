"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Target,
  Trophy,
  Sparkles,
  Tag,
  Users,
  Settings,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/overview",     label: "Resumen",          Icon: LayoutDashboard },
  { href: "/transactions", label: "Transacciones",    Icon: CreditCard      },
  { href: "/budgets",      label: "Presupuestos",     Icon: Target          },
  { href: "/goals",        label: "Metas",            Icon: Trophy          },
  { href: "/insights",     label: "Insights de Luca", Icon: Sparkles        },
  { href: "/categories",   label: "Categorías",       Icon: Tag             },
  { href: "/groups",       label: "Grupos",           Icon: Users           },
  { href: "/settings",     label: "Configuración",    Icon: Settings        },
];

export function MobileNav({ userName, budgetAlert = false }: { userName: string; budgetAlert?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-40">
        <Link href="/overview" className="font-display text-lg font-normal tracking-tight no-underline text-foreground">Luca</Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground/50"
          aria-label="Abrir menú"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-50 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-72 bg-card z-50 flex flex-col transition-transform duration-300 md:hidden",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <Link href="/overview" onClick={() => setOpen(false)} className="font-display text-xl font-normal tracking-tight no-underline text-foreground">Luca</Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-foreground/40"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active  = pathname.startsWith(href);
            const showDot = href === "/budgets" && budgetAlert;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-[#FEFF6E] text-[#1A1A1A] dark:bg-[#FEFF6E]/20 dark:text-foreground"
                    : "text-foreground/40 hover:text-foreground hover:bg-foreground/6"
                )}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2 : 1.5}
                  className="shrink-0"
                />
                <span className="flex-1">{label}</span>
                {showDot && (
                  <span className="w-2 h-2 rounded-full bg-[#E8673C] shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border text-xs text-foreground/40 truncate">
          {userName}
        </div>
      </div>
    </>
  );
}
