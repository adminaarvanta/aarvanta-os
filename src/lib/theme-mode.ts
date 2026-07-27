/** Stored user preference. */
export type ThemeMode = "light" | "dark" | "system";

/** Applied appearance on <html> (never "system"). */
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "aarvanta-theme";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "dark" || value === "light" || value === "system";
}

/** Read preference from storage; default light when missing/invalid. */
export function resolveThemeMode(stored: string | null): ThemeMode {
  if (isThemeMode(stored)) return stored;
  return "light";
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Map preference → light/dark class for the document. */
export function resolveAppearance(
  preference: ThemeMode,
  mediaDark: boolean = getSystemPrefersDark()
): ResolvedTheme {
  if (preference === "system") return mediaDark ? "dark" : "light";
  return preference;
}
