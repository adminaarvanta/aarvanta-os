import type {
  SiteCustomTheme,
  SiteReferenceScreenshot,
  SiteThemePreset,
} from "@/types/site-builder";
import type { BuildWizardStepId } from "@/components/build/build-wizard-rail";

const STORAGE_KEY = "aarvanta.build.composeDraft.v4";

export type ComposeStep = BuildWizardStepId;

export type ComposeDraftCache = {
  jobId?: string;
  prompt: string;
  businessName?: string;
  audience?: string;
  goals?: string[];
  step: ComposeStep;
  themePreset: SiteThemePreset;
  customTheme: SiteCustomTheme;
  screenshots: SiteReferenceScreenshot[];
  selectedDesignOptionId?: string | null;
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
    /* ignore */
  }
}

export function clearComposeDraftCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
