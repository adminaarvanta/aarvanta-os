import type { GeneratedSite, SiteBlock } from "@/types/site-builder";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function blockHasSamplePayload(block: SiteBlock): boolean {
  const p = block.props ?? {};
  switch (block.type) {
    case "hero":
      return nonEmptyString(p.headline) && nonEmptyString(p.subheadline);
    case "features":
    case "services_grid":
    case "stats":
    case "faq_accordion":
    case "faq":
    case "gallery":
    case "logo_cloud":
    case "timeline":
      return asArray(p.items).length >= 2;
    case "products":
      return asArray(p.products).length >= 2;
    case "pricing_table":
    case "pricing":
      return asArray(p.tiers).length >= 2;
    case "testimonials":
      return asArray(p.quotes).length >= 1;
    case "blog_list":
    case "blog":
      return asArray(p.posts).length >= 1;
    case "portfolio_grid":
      return asArray(p.items).length >= 2;
    case "team_grid":
    case "team":
      return asArray(p.members).length >= 2;
    case "comparison":
      return asArray(p.columns).length >= 2;
    case "feature_tabs":
      return asArray(p.tabs).length >= 2;
    case "menu_list":
      return asArray(p.sections).length >= 1;
    case "about_split":
    case "split":
      return nonEmptyString(p.body) || nonEmptyString(p.title);
    case "contact":
      return nonEmptyString(p.title) || nonEmptyString(p.description);
    case "cta_banner":
    case "cta":
    case "booking_cta":
    case "newsletter":
      return nonEmptyString(p.title);
    default:
      return nonEmptyString(p.title) || nonEmptyString(p.body);
  }
}

/**
 * Keep skeleton structure/media, but always prefer AI text and list props when present
 * so different prompts produce different copy (not locked to generic samples).
 */
export function preferSampleFilledSite(
  sampleSite: GeneratedSite,
  aiSite: GeneratedSite | null | undefined
): GeneratedSite {
  if (!aiSite?.pages?.length) return sampleSite;

  const pages = sampleSite.pages.map((samplePage, idx) => {
    const aiPage =
      aiSite.pages.find((p) => p.slug === samplePage.slug) ?? aiSite.pages[idx];
    if (!aiPage?.blocks?.length) return samplePage;

    const mergedBlocks = samplePage.blocks.map((sampleBlock, blockIdx) => {
      const aiBlock =
        aiPage.blocks.find((b) => b.id === sampleBlock.id) ??
        aiPage.blocks.find((b) => b.type === sampleBlock.type) ??
        aiPage.blocks[blockIdx];
      if (!aiBlock) return sampleBlock;

      const mergedProps: Record<string, unknown> = { ...sampleBlock.props };
      for (const [key, value] of Object.entries(aiBlock.props ?? {})) {
        if (key === "imageUrl" || key === "avatarUrl") {
          if (typeof value === "string" && value.trim()) mergedProps[key] = value;
          continue;
        }
        if (typeof value === "string" && value.trim().length >= 3) {
          mergedProps[key] = value;
          continue;
        }
        if (Array.isArray(value) && value.length > 0) {
          mergedProps[key] = value;
        }
      }

      return { ...sampleBlock, props: mergedProps };
    });

    return { ...samplePage, blocks: mergedBlocks, title: aiPage.title || samplePage.title };
  });

  return {
    ...sampleSite,
    siteName: aiSite.siteName || sampleSite.siteName,
    tagline: aiSite.tagline || sampleSite.tagline,
    footerNote: aiSite.footerNote || sampleSite.footerNote,
    pages,
  };
}
