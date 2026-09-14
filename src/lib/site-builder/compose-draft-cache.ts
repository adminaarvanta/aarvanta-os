import type {
  SiteBrandLogo,
  SiteCustomTheme,
  SiteDesignOption,
  SiteFeatureOption,
  SiteReferenceScreenshot,
  SiteThemePreset,
  SiteTone,
} from "@/types/site-builder";
import type { BuildWizardStepId } from "@/components/build/build-wizard-rail";

const STORAGE_KEY = "aarvanta.build.composeDraft.v7";
const LEGACY_KEYS = [
  "aarvanta.build.composeDraft.v6",
  "aarvanta.build.composeDraft.v5",
];

export type ComposeStep = BuildWizardStepId;

export type ComposeDraftCache = {
  jobId?: string;
  prompt: string;
  businessName?: string;
  audience?: string;
  goals?: string[];
  features?: SiteFeatureOption[];
  tone?: SiteTone;
  step: ComposeStep;
  themePreset: SiteThemePreset;
  customTheme: SiteCustomTheme;
  screenshots: SiteReferenceScreenshot[];
  brandLogo?: SiteBrandLogo | null;
  designOptions?: SiteDesignOption[];
  selectedDesignOptionId?: string | null;
  savedAt: string;
};

function normalizeThemePreset(preset: SiteThemePreset | undefined): SiteThemePreset {
  if (!preset || preset === ("gold_navy" as SiteThemePreset)) return "minimal_light";
  return preset;
}

export function readComposeDraftCache(): ComposeDraftCache | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const key of LEGACY_KEYS) {
        raw = window.localStorage.getItem(key);
        if (raw) break;
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ComposeDraftCache;
    if (!parsed || typeof parsed.prompt !== "string") return null;
    return {
      ...parsed,
      themePreset: normalizeThemePreset(parsed.themePreset),
      features: parsed.features?.length ? parsed.features : undefined,
      designOptions: parsed.designOptions?.length ? parsed.designOptions : undefined,
    };
  } catch {
    return null;
  }
}

export function writeComposeDraftCache(draft: ComposeDraftCache): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    for (const key of LEGACY_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore quota */
  }
}

export function clearComposeDraftCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    for (const key of LEGACY_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
