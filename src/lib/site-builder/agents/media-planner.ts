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
    ...(preferences.businessIdea.split(/\s+/).slice(0, 4) || []),
  ];
  const images = await fetchCategoryImages(categoryId, keywords, 16);
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
      const url =
        (typeof block.props.imageUrl === "string" && block.props.imageUrl) ||
        imageAt(images, imgIndex, `${site.slug}-${block.id}`);
      imgIndex += 1;

      const assetId = `asset_${block.id}`;
      assets.push({
        id: assetId,
        kind: "image",
        url,
        alt: imagePlan.subject,
        sectionId: block.id,
      });

      return {
        ...block,
        imagePlan,
        props: {
          ...block.props,
          imageUrl: url,
        },
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
