"use client";

import type { CSSProperties } from "react";
import { getUiTemplate } from "@/lib/site-builder/templates";
import { radiusClass, resolveSiteTheme } from "@/lib/site-builder/resolve-theme";
import { cn } from "@/lib/utils";
import type { SitePreferences } from "@/types/site-builder";

const CTA_LABEL: Record<SitePreferences["ctaGoal"], string> = {
  contact: "Contact us",
  book_call: "Book a call",
  buy: "Shop now",
  subscribe: "Subscribe",
};

const PAGE_LABEL: Record<string, string> = {
  home: "Home",
  about: "About",
  services: "Services",
  pricing: "Pricing",
  products: "Products",
  portfolio: "Work",
  testimonials: "Reviews",
  faq: "FAQ",
  blog: "Blog",
  contact: "Contact",
};

export function SiteLivePreview({
  preferences,
  className,
}: {
  preferences: SitePreferences;
  className?: string;
}) {
  const theme = resolveSiteTheme(preferences);
  const template = getUiTemplate(preferences.templateId);
  const name = preferences.businessName.trim() || "Your brand";
  const idea =
    preferences.businessIdea.trim() ||
    "Describe what you do — this preview updates as you type.";
  const audience = preferences.targetAudience?.trim();
  const messages = preferences.keyMessages?.trim();
  const cta = CTA_LABEL[preferences.ctaGoal];
  const nav = preferences.pages
    .filter((p) => p !== "home")
    .slice(0, 5)
    .map((p) => PAGE_LABEL[p] ?? p);
  const radius = radiusClass(theme.radius);
  const fontFamily =
    theme.fontPairing === "classic_serif" || theme.fontPairing === "editorial"
      ? "Georgia, 'Times New Roman', serif"
      : theme.fontPairing === "friendly_rounded"
        ? "system-ui, 'Segoe UI', sans-serif"
        : "Inter, system-ui, sans-serif";

  function primaryButtonStyle(): CSSProperties {
    if (theme.buttonStyle === "outline") {
      return {
        border: `1px solid ${theme.primaryColor}`,
        color: theme.primaryColor,
        backgroundColor: "transparent",
        borderRadius: radius,
      };
    }
    if (theme.buttonStyle === "soft") {
      return {
        backgroundColor: `${theme.accentColor}33`,
        color: theme.isDark ? theme.textColor : theme.primaryColor,
        borderRadius: radius,
      };
    }
    return {
      backgroundColor: theme.primaryColor,
      color: theme.isDark ? "#0A0A0A" : "#FFFFFF",
      borderRadius: radius,
    };
  }

  return (
    <div className={cn("flex h-full min-h-[420px] flex-col", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-foreground">Live preview</p>
          <p className="text-[11px] text-dim">
            {template?.name ?? "Template"} ·{" "}
            {theme.themeMode === "custom" ? "custom theme" : "template theme"}
          </p>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] capitalize text-muted">
          {preferences.niche.replace(/_/g, " ")}
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border shadow-lg shadow-black/20">
        <div className="flex items-center gap-1.5 border-b border-black/10 bg-surface-muted px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-dim/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-dim/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-dim/40" />
          <span className="ml-2 truncate font-mono text-[10px] text-dim">
            {preferences.deployment.domain.selectedDomain ??
              `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "yoursite"}.preview`}
          </span>
        </div>

        <div
          className="h-full overflow-y-auto"
          style={{
            backgroundColor: theme.backgroundColor,
            color: theme.textColor,
            fontFamily,
          }}
        >
          <header
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
            style={{ borderBottom: `1px solid ${theme.primaryColor}33` }}
          >
            <span
              className="truncate text-sm font-semibold tracking-wide"
              style={{ color: theme.primaryColor }}
            >
              {name}
            </span>
            <nav className="hidden items-center gap-3 text-[10px] opacity-80 sm:flex">
              {nav.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </nav>
            <span
              className="shrink-0 px-2.5 py-1 text-[10px] font-semibold"
              style={primaryButtonStyle()}
            >
              {cta}
            </span>
          </header>

          {theme.layout === "hero_split" ? (
            <section className="grid gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 sm:py-10">
              <div>
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.16em]"
                  style={{ color: theme.accentColor }}
                >
                  {template?.name ?? preferences.designStyle}
                </p>
                <h1
                  className="mt-2 text-2xl font-bold leading-tight sm:text-3xl"
                  style={{ color: theme.isDark ? "#FFFFFF" : theme.primaryColor }}
                >
                  {name}
                </h1>
                <p className="mt-3 text-sm leading-relaxed opacity-80">{idea}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="px-4 py-2 text-xs font-semibold" style={primaryButtonStyle()}>
                    {cta}
                  </span>
                </div>
              </div>
              <div
                className="min-h-[120px] rounded-lg"
                style={{
                  background: `linear-gradient(145deg, ${theme.accentColor}55, ${theme.primaryColor}33)`,
                  borderRadius: radius,
                }}
              />
            </section>
          ) : theme.layout === "store_shelf" ? (
            <section className="px-4 py-8 sm:px-6 sm:py-10">
              <h1
                className="text-2xl font-bold sm:text-3xl"
                style={{ color: theme.isDark ? "#FFFFFF" : theme.primaryColor }}
              >
                {name}
              </h1>
              <p className="mt-2 max-w-md text-sm opacity-80">{idea}</p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {["Featured", "Popular", "New"].map((label) => (
                  <div
                    key={label}
                    className="p-2"
                    style={{
                      backgroundColor: theme.isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                      borderRadius: radius,
                      border: `1px solid ${theme.primaryColor}22`,
                    }}
                  >
                    <div
                      className="mb-2 h-12"
                      style={{
                        backgroundColor: `${theme.accentColor}44`,
                        borderRadius: radius,
                      }}
                    />
                    <p className="text-[10px] font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : theme.layout === "services_grid" ? (
            <section className="px-4 py-8 sm:px-6 sm:py-10">
              <h1
                className="text-2xl font-bold sm:text-3xl"
                style={{ color: theme.isDark ? "#FFFFFF" : theme.primaryColor }}
              >
                {name}
              </h1>
              <p className="mt-2 max-w-md text-sm opacity-80">{idea}</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                {(template?.highlightSections.length
                  ? template.highlightSections
                  : ["Service A", "Service B", "Service C"]
                ).map((label) => (
                  <div
                    key={label}
                    className="p-3 text-xs"
                    style={{
                      backgroundColor: theme.isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                      borderRadius: radius,
                      border: `1px solid ${theme.primaryColor}22`,
                    }}
                  >
                    <p className="font-medium" style={{ color: theme.accentColor }}>
                      {label}
                    </p>
                    <p className="mt-1 opacity-65">Built for your niche</p>
                  </div>
                ))}
              </div>
              <span
                className="mt-6 inline-block px-4 py-2 text-xs font-semibold"
                style={primaryButtonStyle()}
              >
                {cta}
              </span>
            </section>
          ) : (
            <section
              className="px-4 py-10 sm:px-6 sm:py-12"
              style={
                theme.layout === "hero_image_bg"
                  ? {
                      background: `linear-gradient(180deg, ${theme.backgroundColor}99, ${theme.backgroundColor}), ${theme.primaryColor}22`,
                    }
                  : undefined
              }
            >
              <div className={theme.layout === "hero_centered" ? "mx-auto max-w-md text-center" : ""}>
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.16em]"
                  style={{ color: theme.accentColor }}
                >
                  {preferences.niche.replace(/_/g, " ")} · {theme.themeMode}
                </p>
                <h1
                  className="mt-2 text-2xl font-bold leading-tight sm:text-3xl"
                  style={{ color: theme.isDark ? "#FFFFFF" : theme.primaryColor }}
                >
                  {name}
                </h1>
                <p className="mt-3 text-sm leading-relaxed opacity-80">{idea}</p>
                {audience ? <p className="mt-2 text-xs opacity-60">For {audience}</p> : null}
                {messages ? (
                  <p className="mt-3 text-xs font-medium" style={{ color: theme.accentColor }}>
                    {messages}
                  </p>
                ) : null}
                <div
                  className={`mt-6 flex flex-wrap gap-2 ${
                    theme.layout === "hero_centered" ? "justify-center" : ""
                  }`}
                >
                  <span className="px-4 py-2 text-xs font-semibold" style={primaryButtonStyle()}>
                    {cta}
                  </span>
                  <span
                    className="border px-4 py-2 text-xs font-medium opacity-80"
                    style={{ borderColor: `${theme.primaryColor}66`, borderRadius: radius }}
                  >
                    Learn more
                  </span>
                </div>
              </div>
            </section>
          )}

          <section className="grid gap-3 px-4 pb-8 sm:grid-cols-3 sm:px-6">
            {(preferences.features.length
              ? preferences.features.slice(0, 3)
              : ["contact_form", "seo_pack", "analytics"]
            ).map((feature) => (
              <div
                key={feature}
                className="p-3 text-xs"
                style={{
                  backgroundColor: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${theme.primaryColor}22`,
                  borderRadius: radius,
                }}
              >
                <p className="font-medium capitalize" style={{ color: theme.accentColor }}>
                  {feature.replace(/_/g, " ")}
                </p>
                <p className="mt-1 opacity-65">Included on your site</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
