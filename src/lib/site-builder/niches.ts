import type { SiteCustomTheme, SiteNiche } from "@/types/site-builder";

export type SiteNicheDefinition = {
  id: SiteNiche;
  label: string;
  description: string;
  /** Short guidance shown in the custom theme builder. */
  themeGuidance: string;
  /** Practical starter palettes for this niche (not generic AI purple). */
  suggestedPalettes: Array<{
    id: string;
    label: string;
    why: string;
    theme: SiteCustomTheme;
  }>;
};

export const SITE_NICHES: SiteNicheDefinition[] = [
  {
    id: "online_shop",
    label: "Online shop",
    description: "Products, trust, checkout",
    themeGuidance:
      "Retail sites convert with clear product contrast: warm accents for CTAs, light or soft dark canvases, and readable body text.",
    suggestedPalettes: [
      {
        id: "shop_warm_light",
        label: "Warm storefront",
        why: "Inviting for lifestyle & home goods",
        theme: {
          primaryColor: "#C2410C",
          accentColor: "#EA580C",
          backgroundColor: "#FFFBF7",
          textColor: "#1C1917",
          fontPairing: "friendly_rounded",
          buttonStyle: "solid",
          radius: "rounded",
        },
      },
      {
        id: "shop_clean_dark",
        label: "Clean dark retail",
        why: "Fashion / premium product feel",
        theme: {
          primaryColor: "#F5F5F4",
          accentColor: "#D6B25E",
          backgroundColor: "#141414",
          textColor: "#F5F5F4",
          fontPairing: "modern_sans",
          buttonStyle: "solid",
          radius: "sharp",
        },
      },
    ],
  },
  {
    id: "local_service",
    label: "Local service",
    description: "Bookings, reviews, contact",
    themeGuidance:
      "Service businesses need trust first: steady blues/greens, high contrast CTAs for “Book” / “Call”, avoid trendy neon.",
    suggestedPalettes: [
      {
        id: "service_trust_blue",
        label: "Trust blue",
        why: "Plumbers, consultants, home services",
        theme: {
          primaryColor: "#1D4ED8",
          accentColor: "#0EA5E9",
          backgroundColor: "#F8FAFC",
          textColor: "#0F172A",
          fontPairing: "modern_sans",
          buttonStyle: "solid",
          radius: "rounded",
        },
      },
      {
        id: "service_steady_green",
        label: "Steady green",
        why: "Wellness, gardening, eco services",
        theme: {
          primaryColor: "#166534",
          accentColor: "#4ADE80",
          backgroundColor: "#F0FDF4",
          textColor: "#14532D",
          fontPairing: "friendly_rounded",
          buttonStyle: "soft",
          radius: "rounded",
        },
      },
    ],
  },
  {
    id: "agency",
    label: "Agency / studio",
    description: "Portfolio and case studies",
    themeGuidance:
      "Agencies sell taste: bold type, restrained palettes, strong contrast. Prefer dark canvases or crisp black/white.",
    suggestedPalettes: [
      {
        id: "agency_ink",
        label: "Ink & signal",
        why: "Creative studios and brand shops",
        theme: {
          primaryColor: "#FAFAFA",
          accentColor: "#F43F5E",
          backgroundColor: "#09090B",
          textColor: "#FAFAFA",
          fontPairing: "editorial",
          buttonStyle: "outline",
          radius: "sharp",
        },
      },
      {
        id: "agency_slate",
        label: "Slate studio",
        why: "Strategy / B2B creative",
        theme: {
          primaryColor: "#0F172A",
          accentColor: "#38BDF8",
          backgroundColor: "#F1F5F9",
          textColor: "#0F172A",
          fontPairing: "modern_sans",
          buttonStyle: "solid",
          radius: "sharp",
        },
      },
    ],
  },
  {
    id: "saas",
    label: "SaaS / product",
    description: "Landing page that converts",
    themeGuidance:
      "Product launches need calm UI chrome: one strong primary for CTAs, plenty of light space, sans-serif clarity.",
    suggestedPalettes: [
      {
        id: "saas_sky",
        label: "Product sky",
        why: "B2B tools and dashboards",
        theme: {
          primaryColor: "#2563EB",
          accentColor: "#38BDF8",
          backgroundColor: "#FFFFFF",
          textColor: "#0F172A",
          fontPairing: "modern_sans",
          buttonStyle: "solid",
          radius: "rounded",
        },
      },
      {
        id: "saas_night",
        label: "Night launch",
        why: "Developer / AI product aesthetic",
        theme: {
          primaryColor: "#A5B4FC",
          accentColor: "#22D3EE",
          backgroundColor: "#0B1220",
          textColor: "#E2E8F0",
          fontPairing: "modern_sans",
          buttonStyle: "soft",
          radius: "rounded",
        },
      },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurant / café",
    description: "Menus, booking, atmosphere",
    themeGuidance:
      "Food brands lean warm: cream or charcoal grounds, terracotta or wine accents, serif headlines for appetite.",
    suggestedPalettes: [
      {
        id: "resto_cream",
        label: "Café cream",
        why: "Brunch spots and bakeries",
        theme: {
          primaryColor: "#9A3412",
          accentColor: "#C2410C",
          backgroundColor: "#FFF7ED",
          textColor: "#431407",
          fontPairing: "classic_serif",
          buttonStyle: "solid",
          radius: "rounded",
        },
      },
      {
        id: "resto_wine",
        label: "Evening wine",
        why: "Fine dining / bars",
        theme: {
          primaryColor: "#F5E6D3",
          accentColor: "#BE123C",
          backgroundColor: "#1C1014",
          textColor: "#F5E6D3",
          fontPairing: "editorial",
          buttonStyle: "outline",
          radius: "sharp",
        },
      },
    ],
  },
  {
    id: "clinic",
    label: "Clinic / health",
    description: "Care, trust, appointments",
    themeGuidance:
      "Healthcare must feel calm and credible: soft blues/teals, lots of white space, never aggressive reds as primary.",
    suggestedPalettes: [
      {
        id: "clinic_calm",
        label: "Calm teal",
        why: "Dental, GP, physiotherapy",
        theme: {
          primaryColor: "#0F766E",
          accentColor: "#2DD4BF",
          backgroundColor: "#F0FDFA",
          textColor: "#134E4A",
          fontPairing: "modern_sans",
          buttonStyle: "soft",
          radius: "pill",
        },
      },
      {
        id: "clinic_clean",
        label: "Clinical white",
        why: "Specialists and private care",
        theme: {
          primaryColor: "#1E3A5F",
          accentColor: "#3B82F6",
          backgroundColor: "#FFFFFF",
          textColor: "#0F172A",
          fontPairing: "modern_sans",
          buttonStyle: "solid",
          radius: "rounded",
        },
      },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Personal work and bio",
    themeGuidance:
      "Portfolios should let work dominate: minimal chrome, high contrast type, restrained accent color.",
    suggestedPalettes: [
      {
        id: "folio_mono",
        label: "Mono focus",
        why: "Photographers and designers",
        theme: {
          primaryColor: "#18181B",
          accentColor: "#A1A1AA",
          backgroundColor: "#FAFAFA",
          textColor: "#18181B",
          fontPairing: "editorial",
          buttonStyle: "outline",
          radius: "sharp",
        },
      },
      {
        id: "folio_night",
        label: "Night folio",
        why: "Motion / digital creatives",
        theme: {
          primaryColor: "#F4F4F5",
          accentColor: "#FBBF24",
          backgroundColor: "#09090B",
          textColor: "#F4F4F5",
          fontPairing: "modern_sans",
          buttonStyle: "solid",
          radius: "sharp",
        },
      },
    ],
  },
];

export function getNiche(id: SiteNiche): SiteNicheDefinition {
  return SITE_NICHES.find((n) => n.id === id) ?? SITE_NICHES[0]!;
}

export function defaultCustomThemeForNiche(niche: SiteNiche): SiteCustomTheme {
  return getNiche(niche).suggestedPalettes[0]!.theme;
}
