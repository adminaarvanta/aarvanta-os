import type { SiteCategoryId, SitePreferences } from "@/types/site-builder";

export type PromptEntities = {
  seed: number;
  phrases: string[];
  nouns: string[];
  featureTitles: string[];
  productNames: string[];
  serviceNames: string[];
  audienceHint: string;
  proofStats: Array<{ value: string; label: string }>;
  faqPairs: Array<{ question: string; answer: string }>;
  testimonialHooks: string[];
  menuItems: Array<{ name: string; description: string; price: string }>;
  blogTitles: string[];
  pricingNames: [string, string, string];
};

const STOP = new Set(
  "a an the and or for with from into that this those these your our their its is are was were be to of in on at by as we you they i it not no yes will can our about more most than then so if when while from across over under between through".split(
    " "
  )
);

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(items: T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length]!;
}

function splitPhrases(text: string): string[] {
  return text
    .split(/[.;|!—–\n]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 8)
    .slice(0, 8);
}

function extractNouns(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
  const uniq: string[] = [];
  for (const w of words) {
    if (!uniq.includes(w)) uniq.push(w);
    if (uniq.length >= 12) break;
  }
  return uniq;
}

function titleize(word: string): string {
  return word
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function categoryFlavor(categoryId: SiteCategoryId, customLabel?: string): string {
  if (categoryId === "custom" && customLabel) return customLabel;
  const map: Record<string, string> = {
    ecommerce: "shop",
    saas: "product",
    local_service: "local service",
    professional: "practice",
    restaurant: "kitchen",
    healthcare: "clinic",
    agency: "studio",
    portfolio: "portfolio",
    nonprofit: "mission",
    blog: "publication",
    event: "event",
    internal_tool_landing: "internal tool",
    custom: "business",
  };
  return map[categoryId] ?? "business";
}

/** Derive prompt-specific copy so every brief produces different site content. */
export function extractPromptEntities(preferences: SitePreferences): PromptEntities {
  // Prefer the longer customPrompt (refine + brief) when present.
  const idea =
    preferences.customPrompt ||
    preferences.businessIdea ||
    preferences.businessName;
  const categoryId = preferences.categoryId ?? "professional";
  const seed = hashSeed(
    `${preferences.templateId ?? "auto"}|${categoryId}|${idea}|${preferences.businessName}`
  );
  const phrases = splitPhrases(idea);
  const nouns = extractNouns(idea);
  const name = preferences.businessName;
  const flavor = categoryFlavor(categoryId, preferences.customCategoryLabel);
  const audience =
    preferences.targetAudience ||
    (nouns[0] ? `${titleize(nouns[0])} customers` : `people who need a better ${flavor}`);

  const n0 = titleize(nouns[0] ?? flavor);
  const n1 = titleize(nouns[1] ?? "delivery");
  const n2 = titleize(nouns[2] ?? "experience");
  const n3 = titleize(nouns[3] ?? "support");

  const featureTitles = [
    phrases[0] ? phrases[0].slice(0, 42) : `${n0} that feels intentional`,
    phrases[1] ? phrases[1].slice(0, 42) : `Built for ${audience}`,
    `${n1} without the friction`,
    `${n2} you can explain in one sentence`,
  ];

  const productNames =
    preferences.categoryId === "ecommerce" || preferences.ctaGoal === "buy"
      ? [
          `${name} ${n0}`,
          `${n1} Collection`,
          `Signature ${n2}`,
          `${n3} Set`,
        ]
      : [
          `${name} Starter`,
          `${name} ${n0}`,
          `${name} Pro`,
          `${name} ${n1}`,
        ];

  const serviceNames = [
    `${n0} consulting`,
    `${n1} delivery`,
    `${n2} programme`,
    `${name} partnership`,
  ];

  const values = [
    [`${12 + (seed % 40)}+`, `${n0} launches`],
    [`${4 + (seed % 5)}.${seed % 9}★`, "Client rating"],
    [`${24 + (seed % 48)}h`, "Typical response"],
    [`${3 + (seed % 9)}`, `${flavor} markets`],
  ];

  const faqPairs = [
    {
      question: `How does ${name} work with ${audience}?`,
      answer:
        phrases[0] ||
        `We start from your goals around ${n0}, agree scope, then deliver in clear stages.`,
    },
    {
      question: `What makes ${name} different?`,
      answer:
        phrases[1] ||
        `We specialise in ${n0} / ${n1} — not generic ${flavor} filler.`,
    },
    {
      question: `How quickly can we begin?`,
      answer: `Most ${flavor} engagements start within ${1 + (seed % 3)}–${2 + (seed % 3)} weeks depending on capacity.`,
    },
    {
      question: `What should we prepare?`,
      answer: `A short brief on ${n0}, your audience (${audience}), and what success looks like.`,
    },
  ];

  const testimonialHooks = [
    `${name} finally made ${n0} feel clear — exactly what we needed for ${audience}.`,
    `We switched for the ${n1} focus. The ${flavor} experience is night and day.`,
    `From first conversation about ${n2}, everything felt specific to our world.`,
  ];

  const menuItems = [
    {
      name: `House ${n0}`,
      description: phrases[0]?.slice(0, 60) || `Signature plate centred on ${n0}.`,
      price: `£${14 + (seed % 12)}`,
    },
    {
      name: `${n1} special`,
      description: `Seasonal take on ${n1}.`,
      price: `£${16 + (seed % 10)}`,
    },
    {
      name: `${n2} for two`,
      description: `Built for sharing — ${audience}.`,
      price: `£${22 + (seed % 14)}`,
    },
  ];

  const blogTitles = [
    `How ${name} thinks about ${n0}`,
    `${n1}: what ${audience} ask us most`,
    `Notes on ${n2} from the ${name} team`,
  ];

  const pricingNames: [string, string, string] = [
    pick(["Starter", "Essentials", "Launch"], seed),
    pick(["Growth", "Studio", "Plus"], seed, 1),
    pick(["Scale", "Partner", "Flagship"], seed, 2),
  ];

  return {
    seed,
    phrases,
    nouns,
    featureTitles,
    productNames,
    serviceNames,
    audienceHint: audience,
    proofStats: values.map(([value, label]) => ({ value, label })),
    faqPairs,
    testimonialHooks,
    menuItems,
    blogTitles,
    pricingNames,
  };
}

export function promptHeadline(
  preferences: SitePreferences,
  entities: PromptEntities
): string {
  const name = preferences.businessName;
  const phrase = entities.phrases[0];
  if (phrase && phrase.length >= 12 && phrase.length <= 90) {
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }
  const n0 = titleize(
    entities.nouns[0] ??
      categoryFlavor(preferences.categoryId ?? "professional", preferences.customCategoryLabel)
  );
  switch (preferences.categoryId) {
    case "ecommerce":
      return `${name} — ${n0} worth coming back for`;
    case "saas":
      return `${name}: ${n0} without the busywork`;
    case "restaurant":
      return `${name} — a table for ${entities.audienceHint}`;
    case "healthcare":
      return `${name}: calm, clear ${n0}`;
    case "portfolio":
      return `${name} — work in ${n0}`;
    case "custom":
      return `${name} — ${preferences.customCategoryLabel || n0}`;
    default:
      return `${name} — built around ${n0}`;
  }
}
