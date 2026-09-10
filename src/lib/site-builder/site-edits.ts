import { normalizeHex } from "@/lib/site-builder/theme-presets";
import type { GeneratedSite, GeneratedSitePage, SiteBlock } from "@/types/site-builder";

export type SiteEditOp =
  | {
      type: "set_text";
      pageSlug?: string;
      blockId?: string;
      blockType?: string;
      path: string;
      value: string;
    }
  | {
      type: "replace_text";
      find: string;
      replace: string;
      pageSlug?: string;
    }
  | {
      type: "set_theme";
      primary?: string;
      accent?: string;
      background?: string;
    }
  | {
      type: "set_meta";
      siteName?: string;
      tagline?: string;
      footer?: string;
    }
  | {
      type: "noop";
      reason: string;
    };

export type AppliedSiteEdit = {
  op: SiteEditOp;
  summary: string;
};

export type SkippedSiteEdit = {
  op: SiteEditOp;
  reason: string;
};

export type ApplySiteEditsResult = {
  site: GeneratedSite;
  applied: AppliedSiteEdit[];
  skipped: SkippedSiteEdit[];
  changed: boolean;
};

const TEXT_PATHS = new Set([
  "headline",
  "subheadline",
  "cta",
  "secondaryCta",
  "title",
  "body",
  "subtitle",
  "eyebrow",
  "tagline",
  "description",
]);

export function applySiteEdits(
  site: GeneratedSite,
  ops: SiteEditOp[]
): ApplySiteEditsResult {
  let next = site;
  const applied: AppliedSiteEdit[] = [];
  const skipped: SkippedSiteEdit[] = [];

  for (const op of ops) {
    if (op.type === "noop") {
      skipped.push({ op, reason: op.reason });
      continue;
    }

    if (op.type === "set_text") {
      const result = applySetText(next, op);
      if (result.changed) {
        next = result.site;
        applied.push({ op, summary: result.summary });
      } else {
        skipped.push({ op, reason: result.reason ?? "Nothing to update." });
      }
      continue;
    }

    if (op.type === "replace_text") {
      const result = applyReplaceText(next, op);
      if (result.changed) {
        next = result.site;
        applied.push({ op, summary: result.summary });
      } else {
        skipped.push({
          op,
          reason: result.reason ?? `“${op.find}” was not found.`,
        });
      }
      continue;
    }

    if (op.type === "set_theme") {
      const result = applySetTheme(next, op);
      if (result.changed) {
        next = result.site;
        applied.push({ op, summary: result.summary });
      } else {
        skipped.push({ op, reason: result.reason ?? "Theme already matches." });
      }
      continue;
    }

    const result = applySetMeta(next, op);
    if (result.changed) {
      next = result.site;
      applied.push({ op, summary: result.summary });
    } else {
      skipped.push({ op, reason: result.reason ?? "Site details already match." });
    }
  }

  const changed = applied.length > 0;
  return {
    site: changed ? next : site,
    applied,
    skipped,
    changed,
  };
}

export function bumpSiteVersion(site: GeneratedSite): GeneratedSite {
  return {
    ...site,
    generatedAt: new Date().toISOString(),
    version: (site.version ?? 1) + 1,
  };
}

export function summarizeRefineResult(
  applied: AppliedSiteEdit[],
  skipped: SkippedSiteEdit[]
): string {
  if (applied.length) {
    const unique = [...new Set(applied.map((item) => item.summary))];
    return unique.slice(0, 3).join("; ");
  }
  const reason =
    skipped.find((item) => item.op.type === "noop")?.reason ??
    skipped[0]?.reason ??
    "try naming the page or quoting the new text.";
  const cleaned = reason.replace(/^Could not apply[ —-]*/i, "");
  return `Could not apply — ${cleaned}`;
}

export function compactSiteOutline(site: GeneratedSite) {
  return {
    siteName: site.siteName,
    tagline: site.tagline,
    footerNote: site.footerNote,
    theme: {
      primary: site.theme.primaryColor,
      accent: site.theme.accentColor,
      background: site.theme.backgroundColor,
    },
    pages: site.pages.map((page) => ({
      slug: page.slug,
      title: page.title,
      blocks: page.blocks.map((block) => ({
        id: block.id,
        type: block.type,
        text: pickShortText(block.props),
      })),
    })),
  };
}

export function isSiteEditOp(value: unknown): value is SiteEditOp {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  const type = rec.type;
  if (type === "noop") return typeof rec.reason === "string";
  if (type === "set_text") {
    return typeof rec.path === "string" && typeof rec.value === "string";
  }
  if (type === "replace_text") {
    return typeof rec.find === "string" && typeof rec.replace === "string";
  }
  if (type === "set_theme") {
    return (
      typeof rec.primary === "string" ||
      typeof rec.accent === "string" ||
      typeof rec.background === "string"
    );
  }
  if (type === "set_meta") {
    return (
      typeof rec.siteName === "string" ||
      typeof rec.tagline === "string" ||
      typeof rec.footer === "string"
    );
  }
  return false;
}

function pickShortText(props: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of TEXT_PATHS) {
    const value = props[key];
    if (typeof value === "string" && value.trim()) {
      out[key] = value.slice(0, 80);
    }
  }
  return out;
}

function pageMatches(page: GeneratedSitePage, slug?: string): boolean {
  if (!slug) return true;
  const wanted = slug.toLowerCase();
  if (wanted === "home") return page.slug === "home" || page.slug === "";
  return page.slug.toLowerCase() === wanted;
}

function pageLabel(slug?: string): string {
  if (!slug || slug === "home" || slug === "") return "Home";
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function applySetText(
  site: GeneratedSite,
  op: Extract<SiteEditOp, { type: "set_text" }>
): { site: GeneratedSite; changed: boolean; summary: string; reason?: string } {
  const value = op.value.trim();
  if (!value) {
    return { site, changed: false, summary: "", reason: "Missing the new text." };
  }

  const defaultSlug =
    op.pageSlug ??
    (op.path === "headline" ||
    op.path === "subheadline" ||
    op.path === "cta" ||
    op.path === "eyebrow" ||
    op.blockType === "hero"
      ? "home"
      : undefined);

  const pages = site.pages.filter((page) => pageMatches(page, defaultSlug));
  if (!pages.length) {
    return {
      site,
      changed: false,
      summary: "",
      reason: `No ${pageLabel(defaultSlug)} page found.`,
    };
  }

  let changed = false;
  let summary = "";
  const nextPages = site.pages.map((page) => {
    if (!pageMatches(page, defaultSlug)) return page;

    let nextPage = page;
    if (
      op.path === "title" &&
      !op.blockId &&
      !op.blockType &&
      page.title !== value
    ) {
      nextPage = { ...nextPage, title: value };
      changed = true;
      summary = `Updated ${pageLabel(page.slug)} title`;
    }

    const block = resolveBlock(nextPage, op);
    if (!block) {
      return nextPage;
    }

    const current = getAtPath(block.props, op.path);
    if (current === value) return nextPage;
    const nextProps = setAtPath(block.props, op.path, value) as Record<
      string,
      unknown
    >;
    changed = true;
    summary = `Updated ${pageLabel(page.slug)} ${block.type === "hero" ? "hero " : ""}${op.path}`;
    return {
      ...nextPage,
      blocks: nextPage.blocks.map((item) =>
        item.id === block.id ? { ...item, props: nextProps } : item
      ),
    };
  });

  if (!changed) {
    return {
      site,
      changed: false,
      summary: "",
      reason: `Could not find ${op.path} on ${pageLabel(defaultSlug)}.`,
    };
  }

  return { site: { ...site, pages: nextPages }, changed: true, summary };
}

function resolveBlock(
  page: GeneratedSitePage,
  op: Extract<SiteEditOp, { type: "set_text" }>
): SiteBlock | undefined {
  if (op.blockId) {
    return page.blocks.find((block) => block.id === op.blockId);
  }
  if (op.blockType) {
    return page.blocks.find((block) => block.type === op.blockType);
  }
  if (
    op.path === "headline" ||
    op.path === "subheadline" ||
    op.path === "cta" ||
    op.path === "eyebrow" ||
    op.path === "secondaryCta"
  ) {
    return (
      page.blocks.find((block) => block.type === "hero") ??
      page.blocks.find((block) => typeof block.props[op.path] === "string") ??
      page.blocks[0]
    );
  }
  if (op.path === "title" || op.path === "body" || op.path === "subtitle") {
    return (
      page.blocks.find((block) => typeof block.props[op.path] === "string") ??
      page.blocks.find(
        (block) =>
          block.type === "about_split" ||
          block.type === "rich_text" ||
          block.type === "content" ||
          block.type === "cta_banner"
      )
    );
  }
  return page.blocks.find((block) => typeof getAtPath(block.props, op.path) === "string");
}

function applyReplaceText(
  site: GeneratedSite,
  op: Extract<SiteEditOp, { type: "replace_text" }>
): { site: GeneratedSite; changed: boolean; summary: string; reason?: string } {
  const find = op.find.trim();
  if (!find) {
    return { site, changed: false, summary: "", reason: "Nothing to replace." };
  }

  const flags = { count: 0 };
  const nextPages = site.pages.map((page) => {
    if (!pageMatches(page, op.pageSlug)) return page;
    const title = replaceString(page.title, find, op.replace, flags);
    return {
      ...page,
      title,
      blocks: page.blocks.map((block) => ({
        ...block,
        props: replaceInValue(block.props, find, op.replace, flags) as Record<
          string,
          unknown
        >,
      })),
    };
  });

  const touchMeta = !op.pageSlug;
  const siteName = touchMeta
    ? replaceString(site.siteName, find, op.replace, flags)
    : site.siteName;
  const tagline =
    touchMeta && site.tagline
      ? replaceString(site.tagline, find, op.replace, flags)
      : site.tagline;
  const footerNote =
    touchMeta && site.footerNote
      ? replaceString(site.footerNote, find, op.replace, flags)
      : site.footerNote;
  const navigation = touchMeta
    ? site.navigation.map((item) => ({
        ...item,
        label: replaceString(item.label, find, op.replace, flags),
      }))
    : site.navigation;

  if (!flags.count) {
    return {
      site,
      changed: false,
      summary: "",
      reason: `“${find}” was not found on the site.`,
    };
  }

  return {
    site: {
      ...site,
      siteName,
      tagline,
      footerNote,
      navigation,
      pages: nextPages,
    },
    changed: true,
    summary: `Replaced “${find}” with “${op.replace}”`,
  };
}

function applySetTheme(
  site: GeneratedSite,
  op: Extract<SiteEditOp, { type: "set_theme" }>
): { site: GeneratedSite; changed: boolean; summary: string; reason?: string } {
  const primary = op.primary
    ? normalizeHex(op.primary, site.theme.primaryColor)
    : site.theme.primaryColor;
  const accent = op.accent
    ? normalizeHex(op.accent, site.theme.accentColor)
    : site.theme.accentColor;
  const background = op.background
    ? normalizeHex(op.background, site.theme.backgroundColor)
    : site.theme.backgroundColor;

  if (
    primary === site.theme.primaryColor &&
    accent === site.theme.accentColor &&
    background === site.theme.backgroundColor
  ) {
    return { site, changed: false, summary: "", reason: "Theme already matches." };
  }

  const brand = site.brand
    ? {
        ...site.brand,
        primary,
        secondary: accent,
        background,
      }
    : site.brand;

  return {
    site: {
      ...site,
      brand,
      theme: {
        ...site.theme,
        primaryColor: primary,
        accentColor: accent,
        backgroundColor: background,
        presetId: "custom",
      },
    },
    changed: true,
    summary: "Updated theme colours",
  };
}

function applySetMeta(
  site: GeneratedSite,
  op: Extract<SiteEditOp, { type: "set_meta" }>
): { site: GeneratedSite; changed: boolean; summary: string; reason?: string } {
  const siteName = op.siteName?.trim() || site.siteName;
  const tagline = op.tagline?.trim() || site.tagline;
  const footerNote = op.footer?.trim() || site.footerNote;
  const fields: string[] = [];
  if (op.siteName?.trim() && siteName !== site.siteName) fields.push("name");
  if (op.tagline?.trim() && tagline !== site.tagline) fields.push("tagline");
  if (op.footer?.trim() && footerNote !== site.footerNote) fields.push("footer");
  if (!fields.length) {
    return { site, changed: false, summary: "", reason: "Site details already match." };
  }
  return {
    site: { ...site, siteName, tagline, footerNote },
    changed: true,
    summary: `Updated site ${fields.join(" and ")}`,
  };
}

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setAtPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): unknown {
  const parts = path.split(".");
  const walk = (current: unknown, index: number): unknown => {
    if (index >= parts.length) return value;
    const key = parts[index]!;
    const asIndex = /^\d+$/.test(key) ? Number(key) : undefined;
    if (asIndex !== undefined) {
      const list = Array.isArray(current) ? [...current] : [];
      list[asIndex] = walk(list[asIndex], index + 1);
      return list;
    }
    const record =
      current && typeof current === "object" && !Array.isArray(current)
        ? { ...(current as Record<string, unknown>) }
        : {};
    record[key] = walk(record[key], index + 1);
    return record;
  };
  return walk(obj, 0);
}

function replaceString(
  value: string,
  find: string,
  replace: string,
  flags: { count: number }
): string {
  if (!value.includes(find)) return value;
  flags.count += value.split(find).length - 1;
  return value.split(find).join(replace);
}

function replaceInValue(
  value: unknown,
  find: string,
  replace: string,
  flags: { count: number }
): unknown {
  if (typeof value === "string") return replaceString(value, find, replace, flags);
  if (Array.isArray(value)) {
    return value.map((item) => replaceInValue(item, find, replace, flags));
  }
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = replaceInValue(item, find, replace, flags);
    }
    return next;
  }
  return value;
}
