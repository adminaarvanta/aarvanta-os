"use client";

import { getThemePreset } from "@/lib/site-builder/theme-presets";
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
  const theme = getThemePreset(preferences.themePreset);
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

  const isDarkBg =
    theme.backgroundColor.toLowerCase() !== "#ffffff" &&
    theme.backgroundColor.toLowerCase() !== "#fff";

  return (
    <div className={cn("flex h-full min-h-[420px] flex-col", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-foreground">Live preview</p>
          <p className="text-[11px] text-dim">Updates as you customize — no deploy needed</p>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] capitalize text-muted">
          {preferences.siteType} · {preferences.tone}
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
            color: isDarkBg ? "#F4F7FB" : "#0E1522",
          }}
        >
          <header
            className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
            style={{ borderBottom: `1px solid ${theme.primaryColor}33` }}
          >
            <span className="truncate text-sm font-semibold tracking-wide" style={{ color: theme.primaryColor }}>
              {name}
            </span>
            <nav className="hidden items-center gap-3 text-[10px] opacity-80 sm:flex">
              {nav.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </nav>
            <span
              className="shrink-0 rounded-md px-2.5 py-1 text-[10px] font-semibold"
              style={{ backgroundColor: theme.accentColor, color: isDarkBg ? "#0A0A0A" : "#FFFFFF" }}
            >
              {cta}
            </span>
          </header>

          <section className="px-4 py-8 sm:px-6 sm:py-10">
            <p
              className="text-[10px] font-medium uppercase tracking-[0.16em]"
              style={{ color: theme.accentColor }}
            >
              {preferences.designStyle} · {preferences.colorMood}
            </p>
            <h1
              className="mt-2 max-w-md text-2xl font-bold leading-tight sm:text-3xl"
              style={{ color: isDarkBg ? "#FFFFFF" : theme.primaryColor }}
            >
              {name}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed opacity-80">{idea}</p>
            {audience ? (
              <p className="mt-2 text-xs opacity-60">For {audience}</p>
            ) : null}
            {messages ? (
              <p className="mt-3 text-xs font-medium" style={{ color: theme.accentColor }}>
                {messages}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              <span
                className="rounded-md px-4 py-2 text-xs font-semibold"
                style={{
                  backgroundColor: theme.primaryColor,
                  color: isDarkBg ? "#0A0A0A" : "#FFFFFF",
                }}
              >
                {cta}
              </span>
              <span
                className="rounded-md border px-4 py-2 text-xs font-medium opacity-80"
                style={{ borderColor: `${theme.primaryColor}66` }}
              >
                Learn more
              </span>
            </div>
          </section>

          <section className="grid gap-3 px-4 pb-8 sm:grid-cols-3 sm:px-6">
            {(preferences.features.length
              ? preferences.features.slice(0, 3)
              : ["contact_form", "seo_pack", "analytics"]
            ).map((feature) => (
              <div
                key={feature}
                className="rounded-lg p-3 text-xs"
                style={{
                  backgroundColor: isDarkBg ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${theme.primaryColor}22`,
                }}
              >
                <p className="font-medium capitalize" style={{ color: theme.accentColor }}>
                  {feature.replace(/_/g, " ")}
                </p>
                <p className="mt-1 opacity-65">Included on your site</p>
              </div>
            ))}
          </section>

          {preferences.pages.includes("testimonials") ||
          preferences.features.includes("testimonials") ? (
            <section
              className="mx-4 mb-8 rounded-lg p-4 sm:mx-6"
              style={{
                backgroundColor: isDarkBg ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
              }}
            >
              <p className="text-[10px] uppercase tracking-wide opacity-60">Social proof</p>
              <p className="mt-2 text-sm italic opacity-80">
                “{name} made everything clearer from day one.”
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
