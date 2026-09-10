import { A48_STUDIO_EDITS } from "@/lib/product/flags";
import { isThemeRefine } from "@/lib/site-builder/refine-history";
import type { SiteEditOp } from "@/lib/site-builder/site-edits";
import { normalizeHex } from "@/lib/site-builder/theme-presets";

export const NAMED_PALETTES: Record<
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

const PAGE_ALIASES: Record<string, string> = {
  home: "home",
  homepage: "home",
  about: "about",
  pricing: "pricing",
  contact: "contact",
  services: "services",
  products: "products",
  shop: "products",
  portfolio: "portfolio",
  faq: "faq",
  blog: "blog",
  testimonials: "testimonials",
};

const FIELD_ALIASES: Record<string, string> = {
  headline: "headline",
  title: "title",
  subhead: "subheadline",
  subheadline: "subheadline",
  "sub-headline": "subheadline",
  tagline: "tagline",
  supporting: "subheadline",
  cta: "cta",
  button: "cta",
  "button label": "cta",
  "button text": "cta",
  "call to action": "cta",
  body: "body",
  copy: "headline",
};

const RESERVED_FIND =
  /^(the\s+)?(hero|headline|title|cta|button|subhead|subheadline|tagline|theme|colou?r|page|text|copy|it|this|site|palette|background|primary|accent)$/i;

export function extractHex(text: string): string | undefined {
  const match = text.match(/#([0-9A-Fa-f]{6})\b/);
  return match ? normalizeHex(`#${match[1]}`, "#2563EB") : undefined;
}

export function extractNamedPalette(text: string) {
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

export function extractThemePatch(text: string): {
  primary?: string;
  accent?: string;
  background?: string;
} | undefined {
  if (!isThemeRefine(text)) return undefined;
  const hex = extractHex(text);
  const named = extractNamedPalette(text);
  const lower = text.toLowerCase();
  const accentOnly = Boolean(hex && /accent|secondary/.test(lower) && !named);
  const backgroundOnly = Boolean(
    hex && /background|bg\b/.test(lower) && !/primary|accent|theme|palette/.test(lower)
  );

  if (named) {
    return {
      primary: named.primary,
      accent: named.secondary,
      background: named.background,
    };
  }
  if (!hex) return undefined;
  if (accentOnly) return { accent: hex };
  if (backgroundOnly) return { background: hex };
  return { primary: hex };
}

/** Turn a studio prompt into structured edits. Heuristic fallback for demo (no API key). */
export function parseRefineOps(text: string): SiteEditOp[] {
  const refine = text.trim();
  if (!refine) return [{ type: "noop", reason: "Empty instruction." }];
  if (!A48_STUDIO_EDITS) {
    return [{ type: "noop", reason: "Studio edits are disabled." }];
  }

  const ops: SiteEditOp[] = [];
  const pageSlug = inferPageSlug(refine);

  const replaceOp = parseReplace(refine);
  if (replaceOp) ops.push(replaceOp);

  const sayOp = parseSay(refine, pageSlug);
  if (sayOp) ops.push(sayOp);

  const fieldOps = parseFieldAssignments(refine, pageSlug);
  ops.push(...fieldOps);

  const metaOp = parseMeta(refine);
  if (metaOp) ops.push(metaOp);

  const theme = extractThemePatch(refine);
  if (theme && (theme.primary || theme.accent || theme.background)) {
    ops.push({ type: "set_theme", ...theme });
  }

  if (!ops.length) {
    const quoted = firstQuoted(refine);
    if (quoted && /hero|headline|title|say|copy|text/.test(refine.toLowerCase())) {
      ops.push({
        type: "set_text",
        pageSlug: pageSlug ?? "home",
        blockType: "hero",
        path: "headline",
        value: quoted,
      });
    }
  }

  if (!ops.length) {
    ops.push({
      type: "noop",
      reason: "try naming the page or quoting the new text.",
    });
  }

  return dedupeOps(ops);
}

function inferPageSlug(text: string): string | undefined {
  const match = text.match(
    /\b(home|homepage|about|pricing|contact|services|products|shop|portfolio|faq|blog|testimonials)\b(?:\s+page)?/i
  );
  if (!match?.[1]) return undefined;
  return PAGE_ALIASES[match[1].toLowerCase()];
}

function parseReplace(text: string): SiteEditOp | undefined {
  const swap = text.match(
    /(?:replace|swap)\s+[“"'‘]?([^"”'‘’\n]{1,80}?)[”"'’]?\s+(?:with|for)\s+[“"'‘]?([^"”'‘’\n]{1,80})/i
  );
  if (swap?.[1] && swap[2]) {
    return {
      type: "replace_text",
      find: cleanValue(swap[1]),
      replace: cleanValue(swap[2]),
    };
  }

  const change = text.match(
    /(?:change|rename)\s+[“"'‘]?([^"”'‘’\n]{1,60}?)[”"'’]?\s+to\s+[“"'‘]?([^"”'‘’\n]{1,80})/i
  );
  if (change?.[1] && change[2] && !RESERVED_FIND.test(change[1].trim())) {
    return {
      type: "replace_text",
      find: cleanValue(change[1]),
      replace: cleanValue(change[2]),
    };
  }
  return undefined;
}

function parseSay(text: string, pageSlug?: string): SiteEditOp | undefined {
  const match = text.match(
    /make(?:\s+the)?\s+(?:(\w+)\s+page\s+)?(?:hero|headline|it|this|site|homepage|copy)\s+say(?:s)?\s+[:\s]*(.+)$/i
  );
  if (!match?.[2]) return undefined;
  const page = match[1] ? PAGE_ALIASES[match[1].toLowerCase()] ?? pageSlug : pageSlug;
  return {
    type: "set_text",
    pageSlug: page ?? "home",
    blockType: "hero",
    path: "headline",
    value: cleanValue(match[2]),
  };
}

function parseFieldAssignments(
  text: string,
  pageSlug?: string
): SiteEditOp[] {
  const ops: SiteEditOp[] = [];
  const pattern =
    /(?:change|update|set|rewrite|make)?\s*(?:the\s+)?(?:(\w+)\s+page(?:'s)?\s+)?(?:hero\s+)?(headline|title|sub-?headline|subhead|tagline|supporting|cta|button(?:\s*(?:label|text))?|call to action|body|copy)\s+(?:to|as|:)\s*[“"'‘]?([^"”'‘’\n]+)/gi;

  for (const match of text.matchAll(pattern)) {
    const page = match[1]
      ? PAGE_ALIASES[match[1].toLowerCase()] ?? pageSlug
      : pageSlug;
    const fieldKey = match[2]?.toLowerCase() ?? "";
    const path = FIELD_ALIASES[fieldKey] ?? FIELD_ALIASES[fieldKey.replace(/\s+/g, " ")];
    const value = cleanValue(match[3] ?? "");
    if (!path || !value) continue;
    if (path === "tagline" && !page) {
      ops.push({ type: "set_meta", tagline: value });
      continue;
    }
    ops.push({
      type: "set_text",
      pageSlug: page ?? (path === "headline" || path === "cta" ? "home" : undefined),
      blockType:
        path === "headline" || path === "subheadline" || path === "cta"
          ? page && page !== "home"
            ? undefined
            : "hero"
          : undefined,
      path: path === "tagline" ? "title" : path,
      value,
    });
  }

  if (!ops.length) {
    const aboutTitle = text.match(
      /(?:the\s+)?about\s+page(?:'s)?\s+(?:title|headline)\s+[“"'‘]?([^"”'‘’\n]+)/i
    );
    if (aboutTitle?.[1] && !/\bto\b|\bas\b|:/.test(text.toLowerCase())) {
      ops.push({
        type: "set_text",
        pageSlug: "about",
        path: "title",
        value: cleanValue(aboutTitle[1]),
      });
    }
  }

  return ops;
}

function parseMeta(text: string): SiteEditOp | undefined {
  const siteName = text.match(
    /(?:site\s*name|business\s*name)\s+(?:to|as|:)\s*[“"'‘]?([^"”'‘’\n]+)/i
  )?.[1];
  const tagline = text.match(
    /(?:site\s+)?tagline\s+(?:to|as|:)\s*[“"'‘]?([^"”'‘’\n]+)/i
  )?.[1];
  const footer = text.match(
    /footer(?:\s*note)?\s+(?:to|as|:)\s*[“"'‘]?([^"”'‘’\n]+)/i
  )?.[1];
  if (!siteName && !tagline && !footer) return undefined;
  return {
    type: "set_meta",
    ...(siteName ? { siteName: cleanValue(siteName) } : {}),
    ...(tagline ? { tagline: cleanValue(tagline) } : {}),
    ...(footer ? { footer: cleanValue(footer) } : {}),
  };
}

function firstQuoted(text: string): string | undefined {
  return cleanValue(text.match(/[“"'‘]([^"”'‘’]{2,120})[”"'’]/)?.[1] ?? "");
}

function cleanValue(value: string): string {
  return value
    .replace(/^[“"'‘]+|[”"'’]+$/g, "")
    .replace(/[.!]+$/g, "")
    .trim();
}

function dedupeOps(ops: SiteEditOp[]): SiteEditOp[] {
  const seen = new Set<string>();
  const next: SiteEditOp[] = [];
  for (const op of ops) {
    const key = JSON.stringify(op);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(op);
  }
  return next;
}
