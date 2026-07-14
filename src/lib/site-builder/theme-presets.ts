import type { SiteColorMood, SiteThemePreset } from "@/types/site-builder";

export type SiteThemePresetDefinition = {
  id: SiteThemePreset;
  label: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  fontStyle: string;
  colorMood: SiteColorMood;
  designStyle: "minimal" | "modern" | "bold" | "classic";
};

export const SITE_THEME_PRESETS: SiteThemePresetDefinition[] = [
  {
    id: "gold_navy",
    label: "Gold & Navy",
    description: "Premium dark canvas with gold accents — Aarvanta signature.",
    primaryColor: "#B3965D",
    accentColor: "#C9AA72",
    backgroundColor: "#050505",
    fontStyle: "Modern sans-serif, generous spacing",
    colorMood: "warm",
    designStyle: "modern",
  },
  {
    id: "minimal_light",
    label: "Minimal Light",
    description: "Clean white layout with subtle navy typography.",
    primaryColor: "#1A2F59",
    accentColor: "#6EB8C9",
    backgroundColor: "#FFFFFF",
    fontStyle: "Light sans-serif, airy whitespace",
    colorMood: "neutral",
    designStyle: "minimal",
  },
  {
    id: "bold_dark",
    label: "Bold Dark",
    description: "High-contrast dark mode with vibrant purple highlights.",
    primaryColor: "#8B5CF6",
    accentColor: "#A78BFA",
    backgroundColor: "#0A0A0F",
    fontStyle: "Bold sans-serif, large headlines",
    colorMood: "vibrant",
    designStyle: "bold",
  },
  {
    id: "ocean_cool",
    label: "Ocean Cool",
    description: "Trust-building blues for services and SaaS brands.",
    primaryColor: "#3B82F6",
    accentColor: "#6EB8C9",
    backgroundColor: "#0E1522",
    fontStyle: "Professional sans-serif",
    colorMood: "cool",
    designStyle: "modern",
  },
  {
    id: "sunset_warm",
    label: "Sunset Warm",
    description: "Warm oranges and creams for lifestyle and retail.",
    primaryColor: "#EA580C",
    accentColor: "#FB923C",
    backgroundColor: "#1C1410",
    fontStyle: "Friendly rounded sans-serif",
    colorMood: "warm",
    designStyle: "classic",
  },
];

export function getThemePreset(id: SiteThemePreset) {
  return SITE_THEME_PRESETS.find((p) => p.id === id) ?? SITE_THEME_PRESETS[0]!;
}
