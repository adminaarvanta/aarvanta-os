import type { SitePreferences, SiteType } from "@/types/site-builder";

export type NicheId =
  | "candles"
  | "dental"
  | "saas"
  | "architecture"
  | "restaurant"
  | "fitness"
  | "fashion"
  | "agency"
  | "coaching"
  | "general";

export type ContentBrief = {
  niche: NicheId;
  brand: string;
  idea: string;
  audience: string;
  country: string;
  currency: string;
  siteType: SiteType;
  tone: SitePreferences["tone"];
  cta: string;
  secondaryCta: string;
  tagline: string;
  headline: string;
  subheadline: string;
  keywords: string[];
  imageSeed: string;
};

/** Curated Unsplash photo IDs — stable, no API key required. */
const NICHE_IMAGES: Record<
  NicheId,
  { hero: string; gallery: string[]; product: string[] }
> = {
  candles: {
    hero: "1603006905001-03355e4c6d0f",
    gallery: ["1558618666-fcd25c85cd64", "1603006905001-03355e4c6d0f", "1519682337058-a94d519337bc"],
    product: ["1603006905001-03355e4c6d0f", "1558618666-fcd25c85cd64", "1519682337058-a94d519337bc"],
  },
  dental: {
    hero: "1629909615184-74f495363b67",
    gallery: ["1606811841689-23dfddce3e95", "1588776814546-1ffcf47267a5", "1629909613654-28e377c37b09"],
    product: ["1606811841689-23dfddce3e95", "1588776814546-1ffcf47267a5", "1629909613654-28e377c37b09"],
  },
  saas: {
    hero: "1551288049-bebda4e38f71",
    gallery: ["1460925895917-afdab827c52f", "1553877522-43269d4ea984", "1517245386807-bb43f82c33c4"],
    product: ["1460925895917-afdab827c52f", "1553877522-43269d4ea984", "1517245386807-bb43f82c33c4"],
  },
  architecture: {
    hero: "1487958449943-2429e8be8625",
    gallery: ["1503387762-592deb58ef4e", "1511818966892-d7d671e672a2", "1497366216548-37526070297c"],
    product: ["1503387762-592deb58ef4e", "1511818966892-d7d671e672a2", "1497366216548-37526070297c"],
  },
  restaurant: {
    hero: "1414235077428-338989a2e8c0",
    gallery: ["1559339352-11d035aa65de", "1517248135467-4c7edcad34c4", "1466978913421-dad2ebd01d17"],
    product: ["1559339352-11d035aa65de", "1517248135467-4c7edcad34c4", "1466978913421-dad2ebd01d17"],
  },
  fitness: {
    hero: "1534438327276-14e530f4a0b3",
    gallery: ["1571019614242-c5c5dee9f50b", "1517836357463-d25dfeac3438", "1540497077202-7c8a3999166f"],
    product: ["1571019614242-c5c5dee9f50b", "1517836357463-d25dfeac3438", "1540497077202-7c8a3999166f"],
  },
  fashion: {
    hero: "1483985988355-763728e1935b",
    gallery: ["1445205170230-053b83016050", "1469334031218-e382a71b716b", "1490481651871-ab68de25d43d"],
    product: ["1445205170230-053b83016050", "1469334031218-e382a71b716b", "1490481651871-ab68de25d43d"],
  },
  agency: {
    hero: "1542744173-8e7e53415bb0",
    gallery: ["1556761175-5973dc0f32e7", "1522071820081-009f0129c71c", "1600880292203-757bb62b4baf"],
    product: ["1556761175-5973dc0f32e7", "1522071820081-009f0129c71c", "1600880292203-757bb62b4baf"],
  },
  coaching: {
    hero: "1522202176988-66273c2fd55f",
    gallery: ["1516321318423-f06f85e504b3", "1573496359142-b8d87734a5a2", "1552664730-d307ca884978"],
    product: ["1516321318423-f06f85e504b3", "1573496359142-b8d87734a5a2", "1552664730-d307ca884978"],
  },
  general: {
    hero: "1497366216548-37526070297c",
    gallery: ["1497366811353-6870744d04b2", "1521737711867-e3b97375f902", "1556761175-b413da4baf72"],
    product: ["1497366811353-6870744d04b2", "1521737711867-e3b97375f902", "1556761175-b413da4baf72"],
  },
};

function detectNiche(text: string): NicheId {
  const p = text.toLowerCase();
  if (/(candle|soy wax|fragrance|scent)/.test(p)) return "candles";
  if (/(dental|dentist|orthodont|teeth|smile)/.test(p)) return "dental";
  if (/(saas|software|app|bookkeep|platform|startup)/.test(p)) return "saas";
  if (/(architect|interior|studio|design firm|photography)/.test(p)) return "architecture";
  if (/(restaurant|cafe|bistro|food|kitchen|dining)/.test(p)) return "restaurant";
  if (/(gym|fitness|yoga|train|wellness)/.test(p)) return "fitness";
  if (/(fashion|clothing|apparel|boutique|wear)/.test(p)) return "fashion";
  if (/(agency|marketing|branding|creative)/.test(p)) return "agency";
  if (/(coach|consult|mentor|advisor)/.test(p)) return "coaching";
  return "general";
}

function ctaLabel(goal: SitePreferences["ctaGoal"]): string {
  switch (goal) {
    case "buy":
      return "Shop the collection";
    case "subscribe":
      return "Start free trial";
    case "book_call":
      return "Book an appointment";
    default:
      return "Get in touch";
  }
}

function secondaryCta(goal: SitePreferences["ctaGoal"]): string {
  switch (goal) {
    case "buy":
      return "View bestsellers";
    case "subscribe":
      return "See pricing";
    case "book_call":
      return "Meet the team";
    default:
      return "Learn more";
  }
}

function headlineFor(
  niche: NicheId,
  brand: string,
  idea: string,
  siteType: SiteType,
  tone: SitePreferences["tone"]
): { tagline: string; headline: string; subheadline: string } {
  const shortIdea = idea.replace(new RegExp(`^${brand}\\s*[—–\\-:]\\s*`, "i"), "").trim();

  const byNiche: Record<NicheId, { tagline: string; headline: string; sub: string }> = {
    candles: {
      tagline: "Hand-poured · Small batch",
      headline: "Warm light for the rooms you love",
      sub: shortIdea || "Artisan soy candles crafted to turn everyday evenings into rituals.",
    },
    dental: {
      tagline: "Gentle care · Modern clinic",
      headline: "Confident smiles start with calm dentistry",
      sub: shortIdea || "Family-friendly dental care with clear plans and same-week appointments.",
    },
    saas: {
      tagline: "Built for freelancers",
      headline: "Books that update themselves",
      sub: shortIdea || "Simple software that keeps your numbers clear — without the spreadsheet chaos.",
    },
    architecture: {
      tagline: "Spaces with intention",
      headline: "Architecture that earns a second look",
      sub: shortIdea || "A photography-led studio portfolio of residences, workplaces, and quiet details.",
    },
    restaurant: {
      tagline: "Seasonal · Local",
      headline: "A table worth lingering at",
      sub: shortIdea || "Seasonal plates, warm hospitality, and evenings that feel unhurried.",
    },
    fitness: {
      tagline: "Strength · Community",
      headline: "Train with purpose, not pressure",
      sub: shortIdea || "Coaching and classes designed for real progress you can feel.",
    },
    fashion: {
      tagline: "New arrivals weekly",
      headline: "Clothes that feel like you",
      sub: shortIdea || "Edited pieces for everyday wear — quality first, trends second.",
    },
    agency: {
      tagline: "Strategy · Craft",
      headline: "Brands that cut through the noise",
      sub: shortIdea || "A creative partner for campaigns, identity systems, and launch moments.",
    },
    coaching: {
      tagline: "Clarity · Momentum",
      headline: "Grow with a guide who gets it",
      sub: shortIdea || "Practical coaching that turns goals into weekly progress.",
    },
    general: {
      tagline: siteType === "store" ? "Shop · Discover" : "Trusted locally",
      headline:
        tone === "luxury"
          ? `${brand} — crafted with care`
          : tone === "bold"
            ? `${brand} does it differently`
            : `Welcome to ${brand}`,
      sub: shortIdea || `A modern ${siteType} experience built around what your customers need most.`,
    },
  };

  const pick = byNiche[niche];
  return { tagline: pick.tagline, headline: pick.headline, subheadline: pick.sub };
}

export function unsplash(id: string, w = 1600): string {
  // Direct image CDN URL — loads in the browser; preview also keeps a gradient underlay.
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

/** Deterministic stock photo that always resolves (used as secondary media source). */
export function samplePhoto(seed: string, w = 1200, h = 900): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

export function nicheImages(niche: NicheId) {
  const set = NICHE_IMAGES[niche];
  // Mix curated Unsplash + deterministic picsum seeds so media never resolves blank.
  return {
    hero: unsplash(set.hero, 1800),
    gallery: set.gallery.map((id, i) =>
      i % 2 === 0 ? unsplash(id, 1200) : samplePhoto(`${niche}-gallery-${i}`, 1200, 1500)
    ),
    products: set.product.map((id, i) =>
      i === 0 ? unsplash(id, 900) : samplePhoto(`${niche}-product-${i}`, 900, 900)
    ),
  };
}

export function buildContentBrief(preferences: SitePreferences): ContentBrief {
  const brand = preferences.businessName.trim() || "My Business";
  const idea = (preferences.customPrompt || preferences.businessIdea || "").trim();
  const niche = detectNiche(`${brand} ${idea} ${preferences.keyMessages ?? ""}`);
  const currency = /uk|united kingdom|britain|england|scotland|wales/i.test(
    preferences.countryBase
  )
    ? "£"
    : "$";
  const copy = headlineFor(niche, brand, idea, preferences.siteType, preferences.tone);
  const keywords = idea
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3)
    .slice(0, 8);

  return {
    niche,
    brand,
    idea,
    audience: preferences.targetAudience?.trim() || "people who care about quality",
    country: preferences.countryBase,
    currency,
    siteType: preferences.siteType,
    tone: preferences.tone,
    cta: ctaLabel(preferences.ctaGoal),
    secondaryCta: secondaryCta(preferences.ctaGoal),
    tagline: copy.tagline,
    headline: copy.headline,
    subheadline: copy.subheadline,
    keywords,
    imageSeed: `${niche}-${brand}`.toLowerCase().replace(/\s+/g, "-"),
  };
}
