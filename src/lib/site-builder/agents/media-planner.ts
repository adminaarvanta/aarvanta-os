import { fetchCategoryImages, imageAt } from "@/lib/site-builder/media/unsplash";
import type {
  BrandSystem,
  BusinessProfile,
  GeneratedSite,
  SiteAssetRef,
  SiteCategoryId,
  SiteImagePlan,
  SitePreferences,
} from "@/types/site-builder";

function planForBlock(
  type: string,
  brand: BrandSystem,
  business: BusinessProfile
): SiteImagePlan {
  const style = brand.imageStyle || "Lifestyle";
  if (type === "hero") {
    return {
      subject: `${business.audience[0] ?? "customers"} with ${business.subcategory}`,
      aspect: "16:9",
      style,
      keywords: [business.industry, business.subcategory, style],
    };
  }
  if (type === "gallery" || type === "products" || type === "portfolio_grid") {
    return {
      subject: `${business.subcategory} product or work`,
      aspect: "1:1",
      style,
      keywords: [business.subcategory, "detail"],
    };
  }
  if (type === "testimonials" || type === "team_grid") {
    return {
      subject: `People related to ${business.industry}`,
      aspect: "3:4",
      style: "Portrait",
      keywords: ["portrait", business.industry],
    };
  }
  return {
    subject: business.industry,
    aspect: "4:3",
    style,
    keywords: [business.industry],
  };
}

/**
 * Media planner — attaches image plans and resolves URLs via Unsplash/picsum.
 * When preserveImages is true (typical studio refine), keep existing URLs so
 * theme/copy edits do not reshuffle unrelated stock photos.
 */
export async function runMediaPlanner(
  site: GeneratedSite,
  preferences: SitePreferences,
  business: BusinessProfile,
  brand: BrandSystem,
  opts?: { preserveImages?: boolean; previousSite?: GeneratedSite }
): Promise<{ site: GeneratedSite; assets: SiteAssetRef[] }> {
  const preserve = Boolean(opts?.preserveImages && opts.previousSite);
  if (preserve && opts?.previousSite) {
    // Carry forward prior media while updating brand/business metadata.
    const prevAssets = opts.previousSite.assets ?? [];
    return {
      site: {
        ...site,
        pages: site.pages.map((page) => {
          const prevPage = opts.previousSite!.pages.find((p) => p.slug === page.slug);
          if (!prevPage) return page;
          return {
            ...page,
            blocks: page.blocks.map((block, i) => {
              const prevBlock =
                prevPage.blocks.find((b) => b.id === block.id) ?? prevPage.blocks[i];
              if (!prevBlock) return block;
              const props = { ...block.props };
              if (typeof prevBlock.props.imageUrl === "string") {
                props.imageUrl = prevBlock.props.imageUrl;
              }
              if (
                block.type === "products" &&
                Array.isArray(props.products) &&
                Array.isArray(prevBlock.props.products)
              ) {
                const prevProducts = prevBlock.props.products as Array<
                  Record<string, unknown>
                >;
                props.products = (props.products as Array<Record<string, unknown>>).map(
                  (product, idx) => ({
                    ...product,
                    imageUrl: prevProducts[idx]?.imageUrl ?? product.imageUrl,
                  })
                );
              }
              if (
                (block.type === "gallery" || block.type === "portfolio_grid") &&
                Array.isArray(props.items) &&
                Array.isArray(prevBlock.props.items)
              ) {
                const prevItems = prevBlock.props.items as Array<Record<string, unknown>>;
                props.items = (props.items as Array<Record<string, unknown>>).map(
                  (item, idx) => ({
                    ...item,
                    imageUrl: prevItems[idx]?.imageUrl ?? item.imageUrl,
                  })
                );
              }
              return {
                ...block,
                imagePlan: prevBlock.imagePlan ?? block.imagePlan,
                props,
              };
            }),
          };
        }),
        assets: prevAssets,
        brand,
        business,
      },
      assets: prevAssets,
    };
  }

  const categoryId = (preferences.categoryId ??
    site.categoryId ??
    "professional") as SiteCategoryId;
  // Idea words first so the actual business description outweighs generic
  // industry/subcategory labels when resolving the media bucket.
  const keywords = [
    ...preferences.businessIdea.split(/\s+/).filter(Boolean).slice(0, 8),
    ...(preferences.refineInstructions
      ? preferences.refineInstructions.split(/\s+/).filter((w) => w.length > 2).slice(0, 6)
      : []),
    business.industry,
    business.subcategory,
    brand.imageStyle,
    preferences.businessName,
  ];
  const images = await fetchCategoryImages(categoryId, keywords, 24);
  const assets: SiteAssetRef[] = [];
  let imgIndex = 0;

  const pages = site.pages.map((page) => ({
    ...page,
    blocks: page.blocks.map((block) => {
      const needsImage = [
        "hero",
        "gallery",
        "products",
        "portfolio_grid",
        "about_split",
        "testimonials",
        "team_grid",
        "cta_banner",
      ].includes(String(block.type));

      if (!needsImage) return block;

      const imagePlan = block.imagePlan ?? planForBlock(String(block.type), brand, business);
      const url = imageAt(images, imgIndex, `${site.slug}-${block.id}`);
      imgIndex += 1;

      const assetId = `asset_${block.id}`;
      assets.push({
        id: assetId,
        kind: "image",
        url,
        alt: imagePlan.subject,
        sectionId: block.id,
      });

      const props: Record<string, unknown> = { ...block.props, imageUrl: url };

      if (block.type === "products" && Array.isArray(props.products)) {
        const products = props.products as Array<Record<string, unknown>>;
        props.products = products.map((product, i) => {
          const nextUrl = imageAt(images, imgIndex + i, `${site.slug}-${block.id}-p-${i}`);
          return {
            ...product,
            imageUrl: nextUrl,
          };
        });
        imgIndex += products.length;
      }

      if (
        (block.type === "gallery" || block.type === "portfolio_grid") &&
        Array.isArray(props.items)
      ) {
        const items = props.items as Array<Record<string, unknown>>;
        props.items = items.map((item, i) => {
          const nextUrl = imageAt(images, imgIndex + i, `${site.slug}-${block.id}-i-${i}`);
          return {
            ...item,
            imageUrl: nextUrl,
          };
        });
        imgIndex += items.length;
      }

      return {
        ...block,
        imagePlan,
        props,
      };
    }),
  }));

  return {
    site: {
      ...site,
      pages,
      assets,
      brand,
      business,
    },
    assets,
  };
}
