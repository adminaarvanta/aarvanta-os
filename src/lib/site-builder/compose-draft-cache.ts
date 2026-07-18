import type {
  SiteCustomTheme,
  SiteReferenceScreenshot,
  SiteThemePreset,
  SiteType,
} from "@/types/site-builder";

const STORAGE_KEY = "aarvanta.build.composeDraft.v1";

export type ComposeDraftCache = {
  jobId?: string;
  prompt: string;
  siteType: SiteType | null;
  themePreset: SiteThemePreset;
  customTheme: SiteCustomTheme;
  screenshots: SiteReferenceScreenshot[];
  savedAt: string;
};

export function readComposeDraftCache(): ComposeDraftCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ComposeDraftCache;
    if (!parsed || typeof parsed.prompt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeComposeDraftCache(draft: ComposeDraftCache): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota / private mode — ignore; server draft still helps.
  }
}

export function clearComposeDraftCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
