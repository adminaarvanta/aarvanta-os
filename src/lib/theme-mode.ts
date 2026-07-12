export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "aarvanta-theme";

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "dark" || value === "light";
}

export function resolveThemeMode(stored: string | null): ThemeMode {
  if (isThemeMode(stored)) return stored;
  return "dark";
}
