export type SiteFontPackId =
  | "editorial"
  | "modern_sans"
  | "tech"
  | "friendly"
  | "luxury_serif"
  | "clean_mono";

export type SiteFontPack = {
  id: SiteFontPackId;
  label: string;
  description: string;
  fontFamily: string;
  headingFont: string;
  googleFontsUrl: string;
  previewHeading: string;
  previewBody: string;
};

/** Durable-style font packs — one click restyles the whole site. */
export const SITE_FONT_PACKS: SiteFontPack[] = [
  {
    id: "editorial",
    label: "Editorial",
    description: "Serif headlines + clean body — magazines & studios",
    fontFamily: '"Instrument Sans", system-ui, sans-serif',
    headingFont: '"Newsreader", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,700&display=swap",
    previewHeading: "Newsreader",
    previewBody: "Instrument Sans",
  },
  {
    id: "modern_sans",
    label: "Modern Sans",
    description: "Geometric sans for product and SaaS brands",
    fontFamily: '"DM Sans", system-ui, sans-serif',
    headingFont: '"DM Sans", system-ui, sans-serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
    previewHeading: "DM Sans",
    previewBody: "DM Sans",
  },
  {
    id: "tech",
    label: "Tech",
    description: "Tight grotesk for startups and tools",
    fontFamily: '"Space Grotesk", system-ui, sans-serif',
    headingFont: '"Space Grotesk", system-ui, sans-serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    previewHeading: "Space Grotesk",
    previewBody: "Space Grotesk",
  },
  {
    id: "friendly",
    label: "Friendly",
    description: "Rounded warmth for retail and lifestyle",
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
    headingFont: '"Fraunces", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Nunito+Sans:wght@400;600;700;800&display=swap",
    previewHeading: "Fraunces",
    previewBody: "Nunito Sans",
  },
  {
    id: "luxury_serif",
    label: "Luxury",
    description: "High-contrast serif for premium brands",
    fontFamily: '"DM Sans", system-ui, sans-serif',
    headingFont: '"Fraunces", Georgia, serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap",
    previewHeading: "Fraunces",
    previewBody: "DM Sans",
  },
  {
    id: "clean_mono",
    label: "Clean Mono",
    description: "IBM Plex for trust and professional services",
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    headingFont: '"IBM Plex Sans", system-ui, sans-serif',
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
    previewHeading: "IBM Plex Sans",
    previewBody: "IBM Plex Sans",
  },
];

export function getFontPack(id: SiteFontPackId | undefined): SiteFontPack {
  return SITE_FONT_PACKS.find((p) => p.id === id) ?? SITE_FONT_PACKS[0]!;
}
