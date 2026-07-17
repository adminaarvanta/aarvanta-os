"use client";

import { templatesForNiche, type SiteUiTemplate } from "@/lib/site-builder/templates";
import { getThemePreset } from "@/lib/site-builder/theme-presets";
import type { SiteNiche } from "@/types/site-builder";

function TemplateThumbnail({
  template,
  active,
}: {
  template: SiteUiTemplate;
  active: boolean;
}) {
  const theme = getThemePreset(template.defaultThemePreset);
  const isDark =
    theme.backgroundColor.toLowerCase() !== "#ffffff" &&
    theme.backgroundColor.toLowerCase() !== "#fff";

  return (
    <div
      className={`overflow-hidden rounded-lg border text-left transition-colors ${
        active ? "border-gold ring-1 ring-gold/40" : "border-border hover:border-gold/40"
      }`}
    >
      <div
        className="relative h-24 px-2.5 py-2"
        style={{ backgroundColor: theme.backgroundColor, color: isDark ? "#F4F7FB" : "#0E1522" }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-1">
          <span className="truncate text-[8px] font-semibold" style={{ color: theme.primaryColor }}>
            Brand
          </span>
          <span
            className="rounded px-1 py-0.5 text-[7px] font-semibold"
            style={{ backgroundColor: theme.accentColor, color: isDark ? "#111" : "#fff" }}
          >
            CTA
          </span>
        </div>

        {template.layout === "hero_split" && (
          <div className="grid grid-cols-2 gap-1">
            <div className="space-y-1">
              <div className="h-2 w-3/4 rounded" style={{ backgroundColor: `${theme.primaryColor}99` }} />
              <div className="h-1.5 w-full rounded opacity-40" style={{ backgroundColor: theme.primaryColor }} />
              <div className="h-1.5 w-2/3 rounded opacity-30" style={{ backgroundColor: theme.primaryColor }} />
            </div>
            <div
              className="rounded"
              style={{ backgroundColor: `${theme.accentColor}44`, minHeight: 40 }}
            />
          </div>
        )}

        {template.layout === "hero_centered" && (
          <div className="flex flex-col items-center gap-1 pt-1">
            <div className="h-2 w-2/3 rounded" style={{ backgroundColor: `${theme.primaryColor}aa` }} />
            <div className="h-1.5 w-4/5 rounded opacity-35" style={{ backgroundColor: theme.primaryColor }} />
            <div
              className="mt-1 h-3 w-10 rounded"
              style={{ backgroundColor: theme.accentColor }}
            />
          </div>
        )}

        {template.layout === "hero_image_bg" && (
          <div
            className="flex h-full flex-col justify-end rounded p-1.5"
            style={{
              background: `linear-gradient(180deg, ${theme.backgroundColor}00, ${theme.backgroundColor}ee), ${theme.primaryColor}33`,
            }}
          >
            <div className="h-2 w-1/2 rounded" style={{ backgroundColor: theme.accentColor }} />
            <div className="mt-1 h-1 w-2/3 rounded opacity-50" style={{ backgroundColor: theme.primaryColor }} />
          </div>
        )}

        {template.layout === "services_grid" && (
          <div className="space-y-1">
            <div className="h-2 w-1/2 rounded" style={{ backgroundColor: `${theme.primaryColor}99` }} />
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-8 rounded"
                  style={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                    border: `1px solid ${theme.primaryColor}33`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {template.layout === "store_shelf" && (
          <div className="space-y-1">
            <div className="h-2 w-2/5 rounded" style={{ backgroundColor: `${theme.primaryColor}99` }} />
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-0.5">
                  <div
                    className="h-7 rounded"
                    style={{ backgroundColor: `${theme.accentColor}55` }}
                  />
                  <div className="h-1 w-full rounded opacity-40" style={{ backgroundColor: theme.primaryColor }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-surface-muted px-3 py-2">
        <p className="text-xs font-medium text-foreground">{template.name}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-dim">{template.tagline}</p>
        <p className="mt-1 text-[9px] uppercase tracking-wide text-dim">
          {template.highlightSections.join(" · ")}
        </p>
      </div>
    </div>
  );
}

export function NicheTemplateGallery({
  niche,
  selectedTemplateId,
  onSelect,
}: {
  niche: SiteNiche;
  selectedTemplateId: string;
  onSelect: (template: SiteUiTemplate) => void;
}) {
  const templates = templatesForNiche(niche);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-medium text-foreground">UI templates for this niche</p>
        <p className="text-[11px] text-dim">
          Layout and sections — you can still switch to a custom theme below.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="text-left"
          >
            <TemplateThumbnail
              template={template}
              active={selectedTemplateId === template.id}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
