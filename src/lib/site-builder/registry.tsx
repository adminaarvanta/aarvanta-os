import type { ReactNode } from "react";
import { z } from "zod";
import type { SiteBlock, SiteBlockType, SitePlanTheme } from "@/types/site-builder";
import {
  BlockRenderer,
  TYPE_ALIASES,
  type CtaHandler,
} from "@/components/site-blocks/block-renderer";
import type { Ink } from "@/components/site-blocks/theme";

export { TYPE_ALIASES };

export type BlockVariantMeta = {
  id: string;
  label: string;
  description: string;
  styleTags: string[];
};

export type BlockRegistryEntry = {
  type: SiteBlockType | string;
  label: string;
  description: string;
  variants: BlockVariantMeta[];
  /** Loose props schema — Phase 1 keeps Record-like flexibility. */
  propsSchema: z.ZodType<Record<string, unknown>>;
};

const looseProps = z.record(z.string(), z.unknown());

const BLOCK_TYPES: Array<{
  type: SiteBlockType;
  label: string;
  description: string;
  extraVariants?: BlockVariantMeta[];
}> = [
  { type: "hero", label: "Hero", description: "Primary value proposition", extraVariants: [
    { id: "default", label: "Default", description: "Uses props.layout", styleTags: ["flexible"] },
    { id: "fullBleed", label: "Full bleed", description: "Image background hero", styleTags: ["bold", "lifestyle"] },
    { id: "split", label: "Split", description: "Text + image columns", styleTags: ["modern"] },
    { id: "centered", label: "Centered", description: "Centered typography hero", styleTags: ["minimal", "luxury"] },
  ]},
  { type: "features", label: "Features", description: "Differentiator cards" },
  { type: "services_grid", label: "Services", description: "Service offerings grid" },
  { type: "products", label: "Products", description: "Product merchandising" },
  { type: "portfolio_grid", label: "Portfolio", description: "Work samples" },
  { type: "testimonials", label: "Testimonials", description: "Social proof quotes" },
  { type: "stats", label: "Stats", description: "Metric strip" },
  { type: "pricing_table", label: "Pricing", description: "Pricing plans" },
  { type: "faq_accordion", label: "FAQ", description: "Accordion questions" },
  { type: "logo_cloud", label: "Logo cloud", description: "Partner logos" },
  { type: "timeline", label: "Timeline", description: "Process steps" },
  { type: "team_grid", label: "Team", description: "Team members" },
  { type: "comparison", label: "Comparison", description: "Feature comparison" },
  { type: "cta_banner", label: "CTA banner", description: "Conversion band" },
  { type: "gallery", label: "Gallery", description: "Image gallery" },
  { type: "menu_list", label: "Menu", description: "Menu / list" },
  { type: "booking_cta", label: "Booking", description: "Booking call to action" },
  { type: "feature_tabs", label: "Feature tabs", description: "Tabbed features" },
  { type: "rich_text", label: "Rich text", description: "Long-form content" },
  { type: "contact", label: "Contact", description: "Contact form" },
  { type: "newsletter", label: "Newsletter", description: "Email capture" },
  { type: "blog_list", label: "Blog list", description: "Article previews" },
  { type: "about_split", label: "About", description: "About split layout" },
  { type: "content", label: "Content", description: "Generic content block" },
];

function defaultVariant(type: string): BlockVariantMeta[] {
  return [
    {
      id: "default",
      label: "Default",
      description: `Standard ${type} layout`,
      styleTags: ["default"],
    },
  ];
}

export const SITE_BLOCK_REGISTRY: BlockRegistryEntry[] = BLOCK_TYPES.map((b) => ({
  type: b.type,
  label: b.label,
  description: b.description,
  variants: b.extraVariants ?? defaultVariant(b.type),
  propsSchema: looseProps,
}));

const byType = new Map(SITE_BLOCK_REGISTRY.map((e) => [e.type, e]));

export function getBlockEntry(type: string): BlockRegistryEntry | undefined {
  const resolved = TYPE_ALIASES[type] ?? type;
  return byType.get(resolved);
}

export function listBlockVariants(type: string): BlockVariantMeta[] {
  return getBlockEntry(type)?.variants ?? defaultVariant(type);
}

export function resolveVariantId(block: SiteBlock): string {
  return block.variantId || "default";
}

/**
 * Maps blueprint blocks → React via the design-system registry.
 * Phase 1: all types share BlockRenderer; variants affect hero layout.
 */
export function renderRegisteredBlock(
  block: SiteBlock,
  theme: SitePlanTheme,
  ink: Ink,
  onCta: CtaHandler
): ReactNode {
  const variantId = resolveVariantId(block);
  const normalized: SiteBlock = {
    ...block,
    type: TYPE_ALIASES[block.type] ?? block.type,
    variantId,
  };
  return (
    <BlockRenderer block={normalized} theme={theme} ink={ink} onCta={onCta} />
  );
}
