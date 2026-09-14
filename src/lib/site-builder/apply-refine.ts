import type {
  BrandSystem,
  GeneratedSite,
  GeneratedSitePage,
  SiteBlock,
  SitePlanTheme,
} from "@/types/site-builder";
import {
  isCopyRefine,
  isThemeRefine,
} from "@/lib/site-builder/refine-history";
import { normalizeHex } from "@/lib/site-builder/theme-presets";

export { isThemeRefine } from "@/lib/site-builder/refine-history";

export const REFINE_NOOP_HINT =
  'That request did not change the site. Name the page or section and the new text, e.g. Change the About title to "Our story", or Change the footer to "© 2026 Bright Smile Dental".';

export class RefineNoopError extends Error {
  readonly code = "REFINE_NOOP" as const;

  constructor(message = REFINE_NOOP_HINT) {
    super(message);
    this.name = "RefineNoopError";
  }
}

export function isRefineNoopError(error: unknown): error is RefineNoopError {
  return (
    error instanceof RefineNoopError ||
    (error instanceof Error &&
      (error.name === "RefineNoopError" ||
        (error as { code?: string }).code === "REFINE_NOOP"))
  );
}

const NAMED_PALETTES: Record<
  string,
  { primary: string; secondary: string; background?: string }
> = {
  green: { primary: "#16A34A", secondary: "#86EFAC" },
  emerald: { primary: "#059669", secondary: "#6EE7B7" },
  teal: { primary: "#0D9488", secondary: "#5EEAD4" },
  blue: { primary: "#2563EB", secondary: "#93C5FD" },
  navy: { primary: "#1A2B48", secondary: "#3D6B9F", background: "#F8FAFC" },
  red: { primary: "#DC2626", secondary: "#FCA5A5" },
  rose: { primary: "#E11D48", secondary: "#FDA4AF" },
  pink: { primary: "#DB2777", secondary: "#F9A8D4" },
  purple: { primary: "#7C3AED", secondary: "#C4B5FD" },
  violet: { primary: "#6D28D9", secondary: "#DDD6FE" },
  orange: { primary: "#EA580C", secondary: "#FDBA74" },
  amber: { primary: "#D97706", secondary: "#FCD34D" },
  gold: { primary: "#B8965D", secondary: "#C9AA72" },
  yellow: { primary: "#CA8A04", secondary: "#FDE047" },
  black: { primary: "#111827", secondary: "#6B7280", background: "#FFFFFF" },
  dark: { primary: "#0F172A", secondary: "#64748B", background: "#F8FAFC" },
  white: { primary: "#111827", secondary: "#9CA3AF", background: "#FFFFFF" },
  warm: { primary: "#C2410C", secondary: "#FDBA74", background: "#FFF7ED" },
  cool: { primary: "#0284C7", secondary: "#7DD3FC", background: "#F0F9FF" },
};

const SKIP_COPY_KEY =
  /^(id|variantId|type|slug|imageUrl|avatarUrl|url|dataUrl|logoUrl|googleFontsUrl|src|layout|icon|ctaTarget|highlighted|period|date|fontPackId|iconSet)$/i;

const PAGE_ALIASES: Record<string, string> = {
  home: "home",
  homepage: "home",
  about: "about",
  contact: "contact",
  services: "services",
  service: "services",
  pricing: "pricing",
  faq: "faq",
  faqs: "faq",
  products: "products",
  shop: "products",
  portfolio: "portfolio",
  blog: "blog",
  team: "team",
};

type CopyField =
  | "headline"
  | "title"
  | "subheadline"
  | "body"
  | "cta"
  | "description";

export type SiteCopyPatch = {
  siteName?: string;
  tagline?: string;
  footerNote?: string;
  navigation?: Array<{ slug: string; label: string }>;
  pages?: Array<{
    slug: string;
    title?: string;
    blocks?: Array<{ id: string; props?: Record<string, unknown> }>;
  }>;
};

export type StudioRefineResult = {
  site: GeneratedSite;
  changed: boolean;
  hint?: string;
};

function extractHex(text: string): string | undefined {
  const m = text.match(/#([0-9A-Fa-f]{6})\b/);
  return m ? normalizeHex(`#${m[1]}`, "#2563EB") : undefined;
}

function extractNamedPalette(text: string) {
  const lower = text.toLowerCase();
  for (const name of Object.keys(NAMED_PALETTES)) {
    if (new RegExp(`\\b${name}\\b`, "i").test(lower)) {
      return NAMED_PALETTES[name]!;
    }
  }
  if (/green(?:er)?|forest|mint/.test(lower)) return NAMED_PALETTES.green;
  if (/blu(?:e|ish)|ocean|sky/.test(lower)) return NAMED_PALETTES.blue;
  if (/purpl|lilac|lavender/.test(lower)) return NAMED_PALETTES.purple;
  return undefined;
}

/** Apply color/theme instructions onto a brand system. */
export function applyBrandRefine(
  brand: BrandSystem,
  refineInstructions?: string
): BrandSystem {
  const refine = refineInstructions?.trim();
  if (!refine || !isThemeRefine(refine)) return brand;

  const hex = extractHex(refine);
  const named = extractNamedPalette(refine);
  const lower = refine.toLowerCase();

  let primary = brand.primary;
  let secondary = brand.secondary;
  let background = brand.background;

  if (hex) {
    primary = hex;
    if (!named) {
      secondary = brand.secondary;
    }
  }
  if (named) {
    primary = named.primary;
    secondary = named.secondary;
    if (named.background) background = named.background;
  }

  if (/accent|secondary/.test(lower) && hex && !named) {
    secondary = hex;
    primary = brand.primary;
  }
  if (/background|bg\b/.test(lower) && hex) {
    background = hex;
    if (!/primary|accent|theme|palette/.test(lower)) {
      primary = brand.primary;
      secondary = brand.secondary;
    }
  }

  return {
    ...brand,
    primary: normalizeHex(primary, brand.primary),
    secondary: normalizeHex(secondary, brand.secondary),
    background: normalizeHex(background, brand.background),
  };
}

function themeFromPartialBrand(
  theme: SitePlanTheme,
  brand: BrandSystem
): SitePlanTheme {
  return {
    ...theme,
    primaryColor: brand.primary,
    accentColor: brand.secondary,
    backgroundColor: brand.background,
    presetId: "custom",
  };
}

function isMediaLikeString(value: string): boolean {
  return (
    /^https?:\/\//i.test(value) ||
    /^data:/i.test(value) ||
    /^#[0-9A-Fa-f]{3,8}$/.test(value)
  );
}

function mapCopyStrings(
  value: unknown,
  fn: (s: string) => string,
  key?: string
): unknown {
  if (typeof value === "string") {
    if (key && SKIP_COPY_KEY.test(key)) return value;
    if (isMediaLikeString(value)) return value;
    return fn(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapCopyStrings(item, fn));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SKIP_COPY_KEY.test(k) ? v : mapCopyStrings(v, fn, k);
    }
    return out;
  }
  return value;
}

function collectCopyStrings(
  value: unknown,
  key: string | undefined,
  out: string[]
): void {
  if (typeof value === "string") {
    if (key && SKIP_COPY_KEY.test(key)) return;
    if (isMediaLikeString(value)) return;
    if (value.trim().length >= 4) out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectCopyStrings(item, undefined, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (!SKIP_COPY_KEY.test(k)) collectCopyStrings(v, k, out);
    }
  }
}

/** Snapshot of visible site content — ignores version / generatedAt so no-ops are detectable. */
export function visibleSiteSnapshot(site: GeneratedSite): string {
  return JSON.stringify({
    siteName: site.siteName,
    slug: site.slug,
    tagline: site.tagline ?? "",
    footerNote: site.footerNote ?? "",
    theme: site.theme,
    brand: site.brand
      ? {
          primary: site.brand.primary,
          secondary: site.brand.secondary,
          background: site.brand.background,
        }
      : null,
    navigation: site.navigation,
    pages: site.pages,
    assets: (site.assets ?? []).map((asset) => ({
      id: asset.id,
      kind: asset.kind,
      url: asset.url,
    })),
  });
}

export function didSiteVisiblyChange(
  before: GeneratedSite,
  after: GeneratedSite
): boolean {
  return visibleSiteSnapshot(before) !== visibleSiteSnapshot(after);
}

function cloneSite(site: GeneratedSite): GeneratedSite {
  return structuredClone(site);
}

function stripQuotes(value: string): string {
  return value.replace(/^[\s“"']+|[\s”"']+$/g, "").trim();
}

function extractQuotedReplacements(
  refine: string
): Array<{ from: string; to: string }> {
  const pairs: Array<{ from: string; to: string }> = [];
  const quoted =
    /["“']([^"”']{2,120})["”']\s*(?:to|into|with|->)\s*["“']([^"”']{2,120})["”']/gi;
  let match: RegExpExecArray | null;
  while ((match = quoted.exec(refine))) {
    pairs.push({ from: match[1]!.trim(), to: match[2]!.trim() });
  }
  const changeQuoted =
    /(?:change|replace|rename|update)\s+["“']([^"”']{2,120})["”']\s+(?:to|into|with)\s+["“']?([^"”'\n]{2,120})["”']?/gi;
  while ((match = changeQuoted.exec(refine))) {
    pairs.push({ from: match[1]!.trim(), to: stripQuotes(match[2]!.trim()) });
  }
  return pairs;
}

function extractExistingStringReplacements(
  site: GeneratedSite,
  refine: string
): Array<{ from: string; to: string }> {
  const strings: string[] = [];
  collectCopyStrings(site.tagline, "tagline", strings);
  collectCopyStrings(site.footerNote, "footerNote", strings);
  collectCopyStrings(site.siteName, "siteName", strings);
  for (const item of site.navigation) {
    collectCopyStrings(item.label, "label", strings);
  }
  for (const page of site.pages) {
    collectCopyStrings(page.title, "title", strings);
    for (const block of page.blocks) {
      collectCopyStrings(block.props, undefined, strings);
    }
  }
  const unique = [...new Set(strings)].sort((a, b) => b.length - a.length);
  const pairs: Array<{ from: string; to: string }> = [];
  const lowerRefine = refine.toLowerCase();
  for (const from of unique) {
    if (from.length < 6) continue;
    const idx = lowerRefine.indexOf(from.toLowerCase());
    if (idx === -1) continue;
    const after = refine.slice(idx + from.length);
    const toMatch = after.match(
      /^\s*(?:["”']\s*)?(?:to|into|with|->)\s*[“"']?([^"”'\n]{2,120})/i
    );
    if (!toMatch?.[1]) continue;
    pairs.push({ from, to: stripQuotes(toMatch[1]) });
  }
  return pairs;
}

function applyReplacements(
  site: GeneratedSite,
  replacements: Array<{ from: string; to: string }>
): GeneratedSite {
  if (!replacements.length) return site;
  const replace = (value: string) => {
    let next = value;
    for (const { from, to } of replacements) {
      if (!from || from === to) continue;
      const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      next = next.replace(new RegExp(escaped, "gi"), to);
    }
    return next;
  };
  return {
    ...site,
    siteName: replace(site.siteName),
    tagline: site.tagline ? replace(site.tagline) : site.tagline,
    footerNote: site.footerNote ? replace(site.footerNote) : site.footerNote,
    navigation: site.navigation.map((item) => ({
      ...item,
      label: replace(item.label),
    })),
    pages: site.pages.map((page) => ({
      ...page,
      title: replace(page.title),
      blocks: page.blocks.map((block) => ({
        ...block,
        props: mapCopyStrings(block.props, replace) as Record<string, unknown>,
      })),
    })),
  };
}

function mentionedPageSlug(refine: string): string | undefined {
  const lower = refine.toLowerCase();
  const pagePhrase = lower.match(
    /\b(?:the\s+)?(home|homepage|about|contact|services?|pricing|faq|faqs|products?|shop|portfolio|blog|team)\s+(?:page|section|heading|title|copy|text|description|body)\b/
  );
  if (pagePhrase?.[1]) {
    return PAGE_ALIASES[pagePhrase[1]] ?? pagePhrase[1].replace(/s$/, "");
  }
  const onPage = lower.match(
    /\bon\s+(?:the\s+)?(home|homepage|about|contact|services|pricing|faq|products|shop|portfolio)\b/
  );
  if (onPage?.[1]) return PAGE_ALIASES[onPage[1]] ?? onPage[1];
  if (/\babout\b/.test(lower)) return "about";
  if (/\bcontact\b/.test(lower) && !/\bcontact\s+(form|button|cta)\b/.test(lower)) {
    return "contact";
  }
  if (/\b(pricing|faq|services)\b/.test(lower)) {
    const hit = lower.match(/\b(pricing|faq|services)\b/)?.[1];
    return hit ? PAGE_ALIASES[hit] ?? hit : undefined;
  }
  return undefined;
}

function requestedFields(refine: string): CopyField[] {
  const lower = refine.toLowerCase();
  const fields: CopyField[] = [];
  if (/subhead|sub-?headline|tagline|supporting/.test(lower)) {
    fields.push("subheadline");
  }
  if (/\bcta\b|call to action|button\s*(label|text)|shop now|get started/.test(lower)) {
    fields.push("cta");
  }
  if (/\b(body|paragraph|description|blurb|copy)\b/.test(lower)) {
    fields.push("body", "description");
  }
  if (/headline|hero\s*text|main\s*heading/.test(lower)) {
    fields.push("headline");
  }
  if (/\btitle\b|heading/.test(lower) && !fields.includes("headline")) {
    fields.push("title", "headline");
  }
  return [...new Set(fields)];
}

function extractPatchText(refine: string): string | undefined {
  const quoted =
    refine.match(/["“']([^"”']{3,160})["”']/)?.[1]?.trim() ?? undefined;
  const toPhrase =
    refine.match(
      /(?:headline|title|subhead(?:line)?|tagline|cta|button|hero(?:\s+text)?|heading|footer|copy|text|body|description)\s+(?:to|as|:)\s*[“"']?([^"”'\n]{2,160})/i
    )?.[1]?.trim() ??
    refine.match(
      /(?:change|update|set|make)\s+(?:the\s+)?(?:headline|title|hero(?:\s+text)?|heading|footer|copy|text|body|description)\s+(?:to|as|:)\s*[“"']?([^"”'\n]{2,160})/i
    )?.[1]?.trim() ??
    refine.match(
      /(?:change|update|set|make)\s+(?:the\s+)?(?:about|contact|services|pricing|faq|footer|nav(?:igation)?|menu)\s+(?:page\s+)?(?:title|heading|text|copy|body|description)?\s*(?:to|as|:)\s*[“"']?([^"”'\n]{2,160})/i
    )?.[1]?.trim() ??
    undefined;
  const sayMatch = refine.match(
    /^(?:please\s+)?(?:say|use|rename\s+to)\s*[“"']?([^"”'\n]{2,160})[”"']?\.?$/i
  );
  const raw = quoted ?? toPhrase ?? sayMatch?.[1]?.trim();
  if (!raw) return undefined;
  return stripQuotes(raw.replace(/^(?:please\s+)?(?:say|use)\s+/i, "").replace(/\s+/g, " "));
}

function applyFieldsToProps(
  props: Record<string, unknown>,
  type: string,
  fields: CopyField[],
  patch: string,
  forcePrimary: boolean
): Record<string, unknown> {
  const next = { ...props };
  const setIf = (key: string, enabled: boolean) => {
    if (enabled) next[key] = patch;
  };
  const has = (field: CopyField) => fields.includes(field);
  const primary =
    forcePrimary || fields.length === 0
      ? type === "hero"
        ? "headline"
        : type === "about_split" || type === "rich_text" || type === "content"
          ? patch.length > 48
            ? "body"
            : "title"
          : type === "contact" || type === "newsletter" || type === "booking_cta"
            ? patch.length > 48
              ? "description"
              : "title"
            : "title"
      : null;

  setIf("headline", has("headline") || primary === "headline");
  setIf(
    "subheadline",
    has("subheadline") && (type === "hero" || "subheadline" in props)
  );
  setIf("cta", has("cta") && ("cta" in props || type === "hero" || type === "cta_banner" || type === "booking_cta"));
  setIf(
    "title",
    has("title") ||
      primary === "title" ||
      (has("headline") && type !== "hero" && "title" in props)
  );
  setIf(
    "body",
    has("body") ||
      primary === "body" ||
      (has("description") && "body" in props && !("description" in props))
  );
  setIf(
    "description",
    has("description") ||
      primary === "description" ||
      (has("body") && "description" in props && !("body" in props))
  );
  return next;
}

function applyPatchToPages(
  pages: GeneratedSitePage[],
  slugs: string[],
  fields: CopyField[],
  patch: string,
  pageScoped: boolean
): GeneratedSitePage[] {
  const heroOnly =
    !pageScoped &&
    (fields.length === 0 ||
      ((fields.includes("headline") ||
        fields.includes("subheadline") ||
        fields.includes("cta")) &&
        !fields.includes("title") &&
        !fields.includes("body") &&
        !fields.includes("description")));

  return pages.map((page) => {
    if (!slugs.includes(page.slug) && page.slug !== "") return page;
    const nextTitle =
      pageScoped && fields.includes("title") ? patch : page.title;
    return {
      ...page,
      title: nextTitle,
      blocks: page.blocks.map((block) => {
        const type = String(block.type);
        if (heroOnly && type !== "hero") return block;
        return {
          ...block,
          props: applyFieldsToProps(
            { ...block.props },
            type,
            fields,
            patch,
            pageScoped && fields.length === 0
          ),
        };
      }),
    };
  });
}

function applyTargetedCopy(
  site: GeneratedSite,
  refine: string,
  patch: string
): { site: GeneratedSite; hint?: string } {
  const lower = refine.toLowerCase();
  const fields = requestedFields(refine);
  const pageSlug = mentionedPageSlug(refine);
  const wantsFooter = /\bfooter\b|copyright/.test(lower);
  const wantsTagline = /\btagline\b/.test(lower) && !/\bsubhead/.test(lower);
  const wantsNav = /\b(nav(?:igation)?|menu\s+label|nav\s+label)\b/.test(lower);

  if (wantsFooter) {
    return { site: { ...site, footerNote: patch } };
  }
  if (wantsTagline) {
    return { site: { ...site, tagline: patch } };
  }
  if (wantsNav) {
    const slugs = pageSlug
      ? [pageSlug]
      : site.navigation.map((item) => item.slug);
    return {
      site: {
        ...site,
        navigation: site.navigation.map((item) =>
          slugs.includes(item.slug) ? { ...item, label: patch } : item
        ),
      },
    };
  }

  if (pageSlug && !site.pages.some((page) => page.slug === pageSlug)) {
    const available = site.pages.map((page) => page.title || page.slug).join(", ");
    return {
      site,
      hint: `This site has no ${pageSlug} page. Existing pages: ${available || "Home"}.`,
    };
  }

  const slugs = pageSlug ? [pageSlug] : ["home", ""];

  return {
    site: {
      ...site,
      pages: applyPatchToPages(
        site.pages,
        slugs,
        fields,
        patch,
        Boolean(pageSlug)
      ),
    },
  };
}

function withRefineMeta(site: GeneratedSite, prior: GeneratedSite): GeneratedSite {
  return {
    ...site,
    generatedAt: new Date().toISOString(),
    version: (prior.version ?? 1) + 1,
  };
}

/**
 * Apply common refine phrases without AI so studio updates always reflect.
 * Updates matching copy on any page/section (not only the home hero), plus theme.
 */
export function applyStudioRefine(
  site: GeneratedSite,
  refineInstructions?: string
): StudioRefineResult {
  const refine = refineInstructions?.trim();
  if (!refine) return { site, changed: false, hint: REFINE_NOOP_HINT };

  let next = cloneSite(site);
  let hint: string | undefined;

  if (isThemeRefine(refine) && next.brand) {
    const brand = applyBrandRefine(next.brand, refine);
    next = {
      ...next,
      brand,
      theme: themeFromPartialBrand(next.theme, brand),
    };
  }

  const replacements = [
    ...extractQuotedReplacements(refine),
    ...extractExistingStringReplacements(site, refine),
  ];
  if (replacements.length) {
    next = applyReplacements(next, replacements);
  }

  const themeish = isThemeRefine(refine) && !isCopyRefine(refine);
  const patch = themeish ? undefined : extractPatchText(refine);
  // Find-replace already applied quoted "X to Y" pairs. A leftover first-quote
  // patch would otherwise write the old string back onto headings.
  if (replacements.length === 0 && patch) {
    const targeted = applyTargetedCopy(next, refine, patch);
    next = targeted.site;
    hint = targeted.hint;
  }

  if (!didSiteVisiblyChange(site, next)) {
    return { site, changed: false, hint: hint ?? REFINE_NOOP_HINT };
  }

  return { site: withRefineMeta(next, site), changed: true };
}

export function applyRefineHeuristics(
  site: GeneratedSite,
  refineInstructions?: string
): GeneratedSite {
  return applyStudioRefine(site, refineInstructions).site;
}

export function compactSiteCopy(site: GeneratedSite) {
  return {
    siteName: site.siteName,
    tagline: site.tagline,
    footerNote: site.footerNote,
    navigation: site.navigation,
    pages: site.pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      blocks: page.blocks.map((block) => ({
        id: block.id,
        type: block.type,
        props: mapCopyStrings(block.props, (value) => value) as Record<
          string,
          unknown
        >,
      })),
    })),
  };
}

export function mergeCopyPatch(
  site: GeneratedSite,
  patch: SiteCopyPatch | null | undefined
): GeneratedSite {
  if (!patch) return site;
  const next = cloneSite(site);
  if (patch.siteName?.trim()) next.siteName = patch.siteName.trim();
  if (patch.tagline?.trim()) next.tagline = patch.tagline.trim();
  if (patch.footerNote?.trim()) next.footerNote = patch.footerNote.trim();
  if (patch.navigation?.length) {
    next.navigation = next.navigation.map((item) => {
      const hit = patch.navigation?.find((nav) => nav.slug === item.slug);
      return hit?.label?.trim() ? { ...item, label: hit.label.trim() } : item;
    });
  }
  if (patch.pages?.length) {
    next.pages = next.pages.map((page) => {
      const pagePatch = patch.pages?.find((item) => item.slug === page.slug);
      if (!pagePatch) return page;
      const title = pagePatch.title?.trim() || page.title;
      const blocks: SiteBlock[] = page.blocks.map((block) => {
        const blockPatch = pagePatch.blocks?.find((item) => item.id === block.id);
        if (!blockPatch?.props) return block;
        return {
          ...block,
          props: { ...block.props, ...blockPatch.props },
        };
      });
      return { ...page, title, blocks };
    });
  }
  return next;
}
