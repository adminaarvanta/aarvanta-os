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

function pageRichness(blocks: SiteBlock[]): number {
  if (!blocks.length) return 0;
  return blocks.filter(blockHasSamplePayload).length / blocks.length;
}

/**
 * Prefer the rich heuristic sample site. Only overlay AI copy when the AI
 * page is itself densely filled — never let sparse AI wipe sample catalogs.
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
    if (pageRichness(aiPage.blocks) < 0.7) return samplePage;

    const mergedBlocks = samplePage.blocks.map((sampleBlock, blockIdx) => {
      const aiBlock =
        aiPage.blocks.find((b) => b.id === sampleBlock.id) ??
        aiPage.blocks.find((b) => b.type === sampleBlock.type) ??
        aiPage.blocks[blockIdx];
      if (!aiBlock || !blockHasSamplePayload(aiBlock)) return sampleBlock;

      return {
        ...sampleBlock,
        props: {
          ...sampleBlock.props,
          ...aiBlock.props,
          imageUrl:
            (aiBlock.props.imageUrl as string | undefined) ||
            (sampleBlock.props.imageUrl as string | undefined),
          items: asArray(aiBlock.props.items).length
            ? aiBlock.props.items
            : sampleBlock.props.items,
          products: asArray(aiBlock.props.products).length
            ? aiBlock.props.products
            : sampleBlock.props.products,
          quotes: asArray(aiBlock.props.quotes).length
            ? aiBlock.props.quotes
            : sampleBlock.props.quotes,
          tiers: asArray(aiBlock.props.tiers).length
            ? aiBlock.props.tiers
            : sampleBlock.props.tiers,
          members: asArray(aiBlock.props.members).length
            ? aiBlock.props.members
            : sampleBlock.props.members,
          posts: asArray(aiBlock.props.posts).length
            ? aiBlock.props.posts
            : sampleBlock.props.posts,
          tabs: asArray(aiBlock.props.tabs).length
            ? aiBlock.props.tabs
            : sampleBlock.props.tabs,
          columns: asArray(aiBlock.props.columns).length
            ? aiBlock.props.columns
            : sampleBlock.props.columns,
          sections: asArray(aiBlock.props.sections).length
            ? aiBlock.props.sections
            : sampleBlock.props.sections,
        },
      };
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
