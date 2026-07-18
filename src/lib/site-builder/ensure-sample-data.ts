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
    case "stats":
    case "faq":
    case "gallery":
      return asArray(p.items).length >= 2;
    case "products":
      return asArray(p.products).length >= 2;
    case "pricing":
      return asArray(p.tiers).length >= 2;
    case "testimonials":
      return asArray(p.quotes).length >= 1;
    case "blog":
      return asArray(p.posts).length >= 1;
    case "split":
      return nonEmptyString(p.body) || nonEmptyString(p.title);
    case "contact":
      return nonEmptyString(p.title) || nonEmptyString(p.description);
    case "cta":
      return nonEmptyString(p.title) && nonEmptyString(p.cta);
    case "team":
      return asArray(p.members).length >= 2;
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
          tiers: asArray(aiBlock.props.tiers).length
            ? aiBlock.props.tiers
            : sampleBlock.props.tiers,
          quotes: asArray(aiBlock.props.quotes).length
            ? aiBlock.props.quotes
            : sampleBlock.props.quotes,
          posts: asArray(aiBlock.props.posts).length
            ? aiBlock.props.posts
            : sampleBlock.props.posts,
          bullets: asArray(aiBlock.props.bullets).length
            ? aiBlock.props.bullets
            : sampleBlock.props.bullets,
          members: asArray(aiBlock.props.members).length
            ? aiBlock.props.members
            : sampleBlock.props.members,
        },
      };
    });

    const sampleTypes = new Set(samplePage.blocks.map((b) => b.type));
    const extras = aiPage.blocks.filter(
      (b) => !sampleTypes.has(b.type) && blockHasSamplePayload(b)
    );

    return {
      ...samplePage,
      title: nonEmptyString(aiPage.title) ? aiPage.title : samplePage.title,
      blocks: [...mergedBlocks, ...extras],
    };
  });

  return {
    ...sampleSite,
    siteName: nonEmptyString(aiSite.siteName) ? aiSite.siteName : sampleSite.siteName,
    tagline: nonEmptyString(aiSite.tagline) ? aiSite.tagline : sampleSite.tagline,
    footerNote: nonEmptyString(aiSite.footerNote)
      ? aiSite.footerNote
      : sampleSite.footerNote,
    pages,
  };
}
