"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  /** Extra delay in ms on top of intersection trigger */
  delay?: number;
  /** Direction the element slides from */
  from?: "bottom" | "left" | "fade";
}

/**
 * Wraps children in a div that fades + slides in once it enters the viewport.
 * Uses IntersectionObserver — no layout shifts, no deps, works in SSR.
 */
export function AnimateIn({
  children,
  className,
  delay = 0,
  from = "bottom",
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const initial =
    from === "bottom"
      ? "translateY(32px)"
      : from === "left"
      ? "translateX(-20px)"
      : "none";

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : initial,
        transition: [
          `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
          `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        ].join(", "),
      }}
    >
      {children}
    </div>
  );
}
