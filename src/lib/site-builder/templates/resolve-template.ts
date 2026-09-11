import type { SiteCategoryId, SiteTemplateDefinition } from "@/types/site-builder";
import { getCategoryById, SITE_CATEGORIES } from "@/lib/site-builder/templates/categories";
import {
  getTemplateById,
  getTemplatesForCategory,
  listTemplates,
  SITE_TEMPLATES,
} from "@/lib/site-builder/templates/catalog";

export {
  SITE_CATEGORIES,
  SITE_TEMPLATES,
  getCategoryById,
  getTemplateById,
  getTemplatesForCategory,
  listTemplates,
};

export function requireTemplate(id: string): SiteTemplateDefinition {
  const tpl = getTemplateById(id);
  if (!tpl) {
    throw new Error(`Unknown site template: ${id}`);
  }
  return tpl;
}

export function defaultTemplateForCategory(
  categoryId: SiteCategoryId
): SiteTemplateDefinition {
  const list = getTemplatesForCategory(categoryId);
  if (!list[0]) {
    throw new Error(`No templates for category: ${categoryId}`);
  }
  return list[0];
}

/** Neutral business default — never fall back to the first ecommerce template. */
function defaultBusinessTemplate(): SiteTemplateDefinition {
  return (
    getTemplateById("local_trust") ??
    SITE_TEMPLATES.find((t) => t.siteType === "business") ??
    SITE_TEMPLATES[0]!
  );
}

/** Resolve an optional template prior for the ARIA pipeline (never throws). */
export function resolveTemplatePrior(
  templateId?: string,
  categoryId?: SiteCategoryId
): SiteTemplateDefinition {
  if (templateId) {
    const tpl = getTemplateById(templateId);
    if (tpl) return tpl;
  }
  if (categoryId) {
    try {
      return defaultTemplateForCategory(categoryId);
    } catch {
      /* fall through */
    }
  }
  return defaultBusinessTemplate();
}
