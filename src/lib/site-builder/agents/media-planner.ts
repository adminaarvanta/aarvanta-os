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
 * Always rewrites nested product/gallery image URLs from the industry-matched pool.
 */
export async function runMediaPlanner(
  site: GeneratedSite,
  preferences: SitePreferences,
  business: BusinessProfile,
  brand: BrandSystem
): Promise<{ site: GeneratedSite; assets: SiteAssetRef[] }> {
  const categoryId = (preferences.categoryId ??
    site.categoryId ??
    "professional") as SiteCategoryId;
  const keywords = [
    business.industry,
    business.subcategory,
    brand.imageStyle,
    preferences.businessName,
    ...preferences.businessIdea.split(/\s+/).filter(Boolean).slice(0, 8),
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
