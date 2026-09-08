"use client";

import { CircleHelp } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export function HelpTip({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const tipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-dim transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-1.5 w-56 -translate-x-1/2 rounded-xl border border-border bg-surface px-3 py-2 text-left text-[11px] leading-relaxed text-muted shadow-lg"
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}
