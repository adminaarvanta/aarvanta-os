import type { CSSProperties } from "react";
import type { SitePlanTheme } from "@/types/site-builder";

export function isLight(bg: string): boolean {
  const hex = bg.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex) && !/^[0-9a-fA-F]{3}$/.test(hex)) {
    return bg.toLowerCase() === "#ffffff" || bg.toLowerCase() === "white";
  }
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export type Ink = ReturnType<typeof themeInk>;

export function themeInk(theme: SitePlanTheme) {
  const light = isLight(theme.backgroundColor);
  return {
    light,
    text: light ? "#101828" : "#F8FAFC",
    muted: light ? "#667085" : "#94A3B8",
    dim: light ? "#98A2B3" : "#64748B",
    surface: light ? "#F5F7FA" : "rgba(255,255,255,0.04)",
    surfaceStrong: light ? "#EEF2F6" : "rgba(255,255,255,0.07)",
    border: light ? "rgba(16,24,40,0.1)" : "rgba(255,255,255,0.12)",
    onPrimary: light ? "#FFFFFF" : "#0B1220",
  };
}

/** Prefer CSS background for external image URLs (Unsplash/picsum/dicebear). */
export function mediaStyle(theme: SitePlanTheme, url?: string, overlay = false): CSSProperties {
  const fallback = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`;
  if (!url) {
    return { backgroundImage: fallback, backgroundSize: "cover", backgroundPosition: "center" };
  }
  const shade = overlay
    ? "linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55)), "
    : "";
  return {
    backgroundColor: theme.primaryColor,
    backgroundImage: `${shade}url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

export function buttonRadius(theme: SitePlanTheme): string {
  if (theme.buttonRadius) return `${theme.buttonRadius}px`;
  return "9999px";
}
