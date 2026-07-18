import type { SiteColorMood, SiteThemePreset } from "@/types/site-builder";

export type SiteThemePresetDefinition = {
  id: SiteThemePreset;
  label: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontStyle: string;
  fontFamily: string;
  headingFont: string;
  googleFontsUrl: string;
  colorMood: SiteColorMood;
  designStyle: "minimal" | "modern" | "bold" | "classic";
};

export const SITE_THEME_PRESETS: SiteThemePresetDefinition[] = [
  {
    id: "gold_navy",
    label: "Gold & Navy",
    description: "Premium dark canvas with gold accents — Aarvanta signature.",
    primaryColor: "#B8965D",
    accentColor: "#C9AA72",
    backgroundColor: "#040608",
    fontStyle: "Modern sans-serif, generous spacing",
    fontFamily: '"DM Sans", system-ui, sans-serif',
    headingFont: '"Fraunces", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,700&display=swap",
    colorMood: "warm",
    designStyle: "modern",
  },
  {
    id: "minimal_light",
    label: "Minimal Light",
    description: "Clean white layout with subtle navy typography.",
    primaryColor: "#1A2B48",
    accentColor: "#3D6B9F",
    backgroundColor: "#FFFFFF",
    fontStyle: "Light sans-serif, airy whitespace",
    fontFamily: '"Instrument Sans", system-ui, sans-serif',
    headingFont: '"Newsreader", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,700&display=swap",
    colorMood: "neutral",
    designStyle: "minimal",
  },
  {
    id: "bold_dark",
    label: "Bold Dark",
    description: "High-contrast dark mode with electric accents.",
    primaryColor: "#22D3EE",
    accentColor: "#A5F3FC",
    backgroundColor: "#07070C",
    fontStyle: "Bold sans-serif, large headlines",
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
    headingFont: '"Space Grotesk", system-ui, sans-serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    colorMood: "vibrant",
    designStyle: "bold",
  },
  {
    id: "ocean_cool",
    label: "Ocean Cool",
    description: "Trust-building blues for services and SaaS brands.",
    primaryColor: "#2563EB",
    accentColor: "#60A5FA",
    backgroundColor: "#0B1220",
    fontStyle: "Professional sans-serif",
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    headingFont: '"IBM Plex Sans", system-ui, sans-serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
    colorMood: "cool",
    designStyle: "modern",
  },
  {
    id: "sunset_warm",
    label: "Sunset Warm",
    description: "Warm oranges and deep cocoa for lifestyle and retail.",
    primaryColor: "#EA580C",
    accentColor: "#FDBA74",
    backgroundColor: "#140E0A",
    fontStyle: "Friendly rounded sans-serif",
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
    headingFont: '"Fraunces", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Nunito+Sans:wght@400;600;700;800&display=swap",
    colorMood: "warm",
    designStyle: "classic",
  },
];

export function getThemePreset(id: SiteThemePreset) {
  return SITE_THEME_PRESETS.find((p) => p.id === id) ?? SITE_THEME_PRESETS[0]!;
}
