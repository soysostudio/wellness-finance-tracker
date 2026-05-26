import { cn } from "@/lib/utils";

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  /** Extra delay in ms on top of page load */
  delay?: number;
  /** Direction the element slides from */
  from?: "bottom" | "left" | "fade";
}

/**
 * Fades + slides children in on page load.
 * Uses pure CSS @keyframes — no IntersectionObserver, no React state,
 * no JS during scroll. GPU-accelerated, zero jank.
 */
export function AnimateIn({
  children,
  className,
  delay = 0,
  from = "bottom",
}: AnimateInProps) {
  const animName =
    from === "bottom" ? "animate-in-bottom" :
    from === "left"   ? "animate-in-left"   :
                        "animate-in-fade";

  return (
    <div
      className={cn(className)}
      style={{
        animationName:           animName,
        animationDuration:       "0.6s",
        animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        animationFillMode:       "backwards",
        animationDelay:          `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
