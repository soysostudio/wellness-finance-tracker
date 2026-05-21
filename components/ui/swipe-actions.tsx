"use client";

import { useRef, useState, type ReactNode } from "react";

export interface SwipeAction {
  icon: ReactNode;
  label: string;
  bg: string;
  onClick: () => void;
}

interface Props {
  children: ReactNode;
  actions: SwipeAction[];
  /** Extra classes applied to the outer wrapper (e.g. "rounded-2xl group") */
  className?: string;
}

const BTN_W = 68; // px per action button

export function SwipeActions({ children, actions, className = "" }: Props) {
  const totalW = BTN_W * actions.length;

  const [offset, setOffset]     = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isOpen, setIsOpen]     = useState(false);

  const startX  = useRef(0);
  const startY  = useRef(0);
  const openRef = useRef(false); // sync ref so handlers read latest value

  function close() {
    setOffset(0);
    setIsOpen(false);
    openRef.current = false;
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Abort if scroll is primarily vertical (allow page scroll)
    if (!openRef.current && Math.abs(dy) > Math.abs(dx) + 4) return;

    if (openRef.current) {
      // Swiping right to close
      setOffset(Math.min(Math.max(-totalW + dx, -totalW), 0));
    } else if (dx < -4) {
      // Swiping left to open
      setOffset(Math.max(dx, -totalW));
    }
  }

  function onTouchEnd() {
    setDragging(false);
    if (offset < -(totalW * 0.45)) {
      setOffset(-totalW);
      setIsOpen(true);
      openRef.current = true;
    } else {
      close();
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Action buttons — revealed on swipe, hidden on desktop */}
      <div
        className="md:hidden absolute right-0 top-0 h-full flex"
        style={{ width: totalW }}
        aria-hidden="true"
      >
        {actions.map((action, i) => (
          <button
            key={i}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => { close(); action.onClick(); }}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-white active:brightness-90 transition-[filter]"
            style={{ backgroundColor: action.bg }}
          >
            {action.icon}
            <span className="text-[10px] font-semibold tracking-wide">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Sliding content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={isOpen ? close : undefined}
        style={{
          transform:  `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 0.25s cubic-bezier(0.25,1,0.5,1)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
