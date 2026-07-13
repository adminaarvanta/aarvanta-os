"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/components/theme/theme-provider";

export function ThemeToggle() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <button
      type="button"
      onClick={toggleMode}
      className="rounded-lg p-2.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mode === "dark" ? "Light mode" : "Dark mode"}
    >
      {mode === "dark" ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
