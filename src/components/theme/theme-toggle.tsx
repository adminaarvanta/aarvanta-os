"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/components/theme/theme-provider";
import type { ThemeMode } from "@/lib/theme-mode";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{
  id: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center rounded-lg border border-border bg-surface-muted p-0.5"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              active
                ? "bg-surface-elevated text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            )}
            aria-label={`${label} theme`}
            aria-pressed={active}
            title={label}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
