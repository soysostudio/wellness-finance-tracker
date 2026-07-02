"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NavPending } from "./nav-pending";
import {
  LayoutDashboard,
  CreditCard,
  Target,
  Trophy,
  Sparkles,
  Tag,
  Users,
  Settings,
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

export function SidebarNav({ budgetAlert = false }: { budgetAlert?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active  = pathname.startsWith(href);
        const showDot = href === "/budgets" && budgetAlert;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
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
            <NavPending />
          </Link>
        );
      })}
    </nav>
  );
}
