"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

const OPTIONS = [
  { value: "light",  label: "Claro",   Icon: Sun     },
  { value: "dark",   label: "Oscuro",  Icon: Moon    },
  { value: "system", label: "Sistema", Icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Evita mismatch de hidratación: hasta montar, no sabemos el tema real
  const current = mounted ? (theme ?? "system") : undefined;

  return (
    <div
      role="radiogroup"
      aria-label="Tema"
      className="inline-flex gap-1 rounded-xl bg-foreground/5 p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium transition-colors ${
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <Icon size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
