import type { PromptEntities } from "@/lib/site-builder/prompt-copy";
import type { SitePreferences } from "@/types/site-builder";

export type CatalogProduct = {
  id: string;
  name: string;
  price: string;
  description: string;
  category: string;
  badge?: string;
  imageUrl?: string;
};

function titleize(s: string): string {
  return s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Infer shop categories from the brief (toys, fashion, etc.). */
export function inferCatalogCategories(
  preferences: SitePreferences,
  entities: PromptEntities
): string[] {
  const blob = `${preferences.businessIdea} ${preferences.businessName} ${entities.nouns.join(" ")}`.toLowerCase();
  if (/(toy|wooden|kids|children|play)/.test(blob)) {
    return ["Wooden", "Learning", "Soft toys", "Outdoor"];
  }
  if (/(fashion|apparel|clothing)/.test(blob)) {
    return ["New arrivals", "Essentials", "Seasonal", "Accessories"];
  }
  if (/(food|bakery|coffee|cafe)/.test(blob)) {
    return ["Bestsellers", "Seasonal", "Gifts", "Bundles"];
  }
  if (/(beauty|skincare)/.test(blob)) {
    return ["Skincare", "Body", "Sets", "Bestsellers"];
  }
  if (/(home|furniture|decor)/.test(blob)) {
    return ["Living", "Kitchen", "Bedroom", "Outdoor"];
  }
  const fromNouns = entities.nouns.slice(0, 3).map(titleize).filter(Boolean);
  if (fromNouns.length >= 2) {
    return [...fromNouns, "Bestsellers", "New"].slice(0, 4);
  }
  return ["Bestsellers", "New arrivals", "Essentials", "Gifts"];
}

/**
 * Build a browsable catalog (12 items, 3–4 categories) for ecommerce sites.
 */
export function buildCatalogProducts(
  preferences: SitePreferences,
  entities: PromptEntities,
  imageForIndex: (i: number) => string
): { categories: string[]; products: CatalogProduct[] } {
  const categories = inferCatalogCategories(preferences, entities);
  const name = preferences.businessName;
  const adjectives = ["Classic", "Signature", "Everyday", "Limited", "Handcrafted", "Premium"];
  const products: CatalogProduct[] = [];

  for (let i = 0; i < 12; i++) {
    const category = categories[i % categories.length]!;
    const noun = titleize(entities.nouns[i % Math.max(entities.nouns.length, 1)] ?? "piece");
    const adj = adjectives[(entities.seed + i) % adjectives.length]!;
    const productName =
      i < entities.productNames.length
        ? `${entities.productNames[i % entities.productNames.length]} ${category}`.slice(0, 48)
        : `${adj} ${noun}`;
    const price = `£${(12 + ((entities.seed + i * 11) % 48) + (i % 3) * 0.5).toFixed(2)}`;
    products.push({
      id: `sku_${entities.seed}_${i}`,
      name: productName.includes(name) ? productName : `${name} ${productName}`.slice(0, 52),
      price,
      description:
        entities.phrases[i % Math.max(entities.phrases.length, 1)] ||
        `${productName} — made for ${entities.audienceHint}.`,
      category,
      badge: i % 5 === 0 ? "New" : i % 7 === 0 ? "Popular" : undefined,
      imageUrl: imageForIndex(i + 1),
    });
  }

  return { categories, products };
}
