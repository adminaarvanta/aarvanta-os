"use client";

import { useState } from "react";
import type { GeneratedSite, SiteBlock } from "@/types/site-builder";

function BlockRenderer({
  block,
  theme,
}: {
  block: SiteBlock;
  theme: GeneratedSite["theme"];
}) {
  const { primaryColor, accentColor, backgroundColor } = theme;
  const textMuted = "#9AABC4";
  const surface = backgroundColor === "#FFFFFF" ? "#F0F3F8" : "#0D1524";
  const border = backgroundColor === "#FFFFFF" ? "#D4DCE8" : "#243656";
  const textColor = backgroundColor === "#FFFFFF" ? "#0D1524" : "#FFFFFF";

  switch (block.type) {
    case "hero":
      return (
        <section
          className="rounded-2xl border p-6 sm:p-8"
          style={{ borderColor: border, backgroundColor: surface }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: primaryColor }}
          >
            {String(block.props.eyebrow ?? "")}
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: textColor }}>
            {String(block.props.headline ?? "")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: textMuted }}>
            {String(block.props.subheadline ?? "")}
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: primaryColor, color: backgroundColor }}
          >
            {String(block.props.cta ?? "Learn more")}
          </button>
        </section>
      );

    case "features": {
      const items = (block.props.items as Array<{ title: string; description: string }>) ?? [];
      return (
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: textColor }}>
            {String(block.props.title ?? "Features")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border p-4"
                style={{ borderColor: border, backgroundColor: surface }}
              >
                <p className="font-medium" style={{ color: accentColor }}>
                  {item.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: textMuted }}>
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case "testimonials": {
      const quotes = (block.props.quotes as Array<{ text: string; author: string }>) ?? [];
      return (
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: textColor }}>
            {String(block.props.title ?? "Testimonials")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {quotes.map((q) => (
              <li
                key={q.author}
                className="rounded-xl border p-4"
                style={{ borderColor: border, backgroundColor: surface }}
              >
                <p className="text-sm italic" style={{ color: textMuted }}>
                  &ldquo;{q.text}&rdquo;
                </p>
                <p className="mt-2 text-xs font-medium" style={{ color: primaryColor }}>
                  — {q.author}
                </p>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case "products": {
      const products =
        (block.props.products as Array<{
          name: string;
          description: string;
          price: string;
          emoji: string;
        }>) ?? [];
      return (
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: textColor }}>
            {String(block.props.title ?? "Products")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {products.map((p) => (
              <li
                key={p.name}
                className="flex flex-col rounded-xl border p-4"
                style={{ borderColor: border, backgroundColor: surface }}
              >
                <span className="text-3xl" aria-hidden>
                  {p.emoji}
                </span>
                <p className="mt-3 font-medium" style={{ color: textColor }}>
                  {p.name}
                </p>
                <p className="mt-1 flex-1 text-xs" style={{ color: textMuted }}>
                  {p.description}
                </p>
                <p className="mt-3 text-sm font-semibold" style={{ color: primaryColor }}>
                  {p.price}
                </p>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case "pricing": {
      const tiers =
        (block.props.tiers as Array<{
          name: string;
          price: string;
          features: string[];
          highlighted?: boolean;
        }>) ?? [];
      return (
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: textColor }}>
            {String(block.props.title ?? "Pricing")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {tiers.map((tier) => (
              <li
                key={tier.name}
                className="rounded-xl border p-4"
                style={{
                  borderColor: tier.highlighted ? primaryColor : border,
                  backgroundColor: surface,
                }}
              >
                <p className="font-semibold" style={{ color: textColor }}>
                  {tier.name}
                </p>
                <p className="mt-2 text-xl font-bold" style={{ color: primaryColor }}>
                  {tier.price}
                </p>
                <ul className="mt-3 space-y-1 text-xs" style={{ color: textMuted }}>
                  {tier.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case "cta":
      return (
        <section
          className="rounded-2xl border p-6 text-center"
          style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}15` }}
        >
          <h2 className="text-lg font-semibold" style={{ color: textColor }}>
            {String(block.props.title ?? "Ready to start?")}
          </h2>
          <p className="mt-2 text-sm" style={{ color: textMuted }}>
            {String(block.props.description ?? "")}
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: primaryColor, color: backgroundColor }}
          >
            {String(block.props.cta ?? "Get started")}
          </button>
        </section>
      );

    case "contact":
      return (
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: border, backgroundColor: surface }}
        >
          <h2 className="text-lg font-semibold" style={{ color: textColor }}>
            {String(block.props.title ?? "Contact")}
          </h2>
          <p className="mt-2 text-sm" style={{ color: textMuted }}>
            {String(block.props.description ?? "")}
          </p>
          {block.props.showForm ? (
            <div className="mt-4 space-y-2">
              <input
                readOnly
                placeholder="Your email"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: border, backgroundColor: backgroundColor, color: textColor }}
              />
              <textarea
                readOnly
                placeholder="Message"
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: border, backgroundColor: backgroundColor, color: textColor }}
              />
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{ backgroundColor: primaryColor, color: backgroundColor }}
              >
                Send message
              </button>
            </div>
          ) : null}
        </section>
      );

    case "faq": {
      const items = (block.props.items as Array<{ q: string; a: string }>) ?? [];
      return (
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: textColor }}>
            {String(block.props.title ?? "FAQ")}
          </h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.q}
                className="rounded-lg border p-3"
                style={{ borderColor: border, backgroundColor: surface }}
              >
                <p className="text-sm font-medium" style={{ color: textColor }}>
                  {item.q}
                </p>
                <p className="mt-1 text-xs" style={{ color: textMuted }}>
                  {item.a}
                </p>
              </li>
            ))}
          </ul>
        </section>
      );
    }

    default:
      return (
        <section
          className="rounded-xl border p-4"
          style={{ borderColor: border, backgroundColor: surface }}
        >
          <h2 className="font-medium" style={{ color: textColor }}>
            {String(block.props.title ?? block.type)}
          </h2>
          <p className="mt-2 text-sm" style={{ color: textMuted }}>
            {String(block.props.body ?? "")}
          </p>
        </section>
      );
  }
}

export function GeneratedSitePreview({
  site,
  compact = false,
}: {
  site: GeneratedSite;
  compact?: boolean;
}) {
  const [activeSlug, setActiveSlug] = useState(site.pages[0]?.slug ?? "");
  const activePage = site.pages.find((p) => p.slug === activeSlug) ?? site.pages[0];
  const { theme } = site;

  if (!activePage) return null;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border ${compact ? "" : "shadow-lg"}`}
      style={{ backgroundColor: theme.backgroundColor, color: theme.backgroundColor === "#FFFFFF" ? "#0D1524" : "#FFFFFF" }}
    >
      <header
        className="border-b px-4 py-3 sm:px-6"
        style={{ borderColor: `${theme.primaryColor}40` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold" style={{ color: theme.accentColor }}>
              {site.siteName}
            </p>
            <p className="text-[10px] opacity-70">Generated site preview</p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {site.navigation.map((item) => (
              <button
                key={item.slug || "home"}
                type="button"
                onClick={() => setActiveSlug(item.slug)}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor:
                    activeSlug === item.slug ? theme.primaryColor : "transparent",
                  color:
                    activeSlug === item.slug
                      ? theme.backgroundColor
                      : theme.accentColor,
                  border: `1px solid ${activeSlug === item.slug ? theme.primaryColor : `${theme.primaryColor}40`}`,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={`space-y-8 ${compact ? "max-h-[520px] overflow-y-auto p-4 sm:p-6" : "p-6 sm:p-10"}`}>
        {activePage.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} theme={theme} />
        ))}
      </main>

      <footer
        className="border-t px-4 py-3 text-center text-[10px] opacity-60"
        style={{ borderColor: `${theme.primaryColor}30` }}
      >
        Preview generated by Aarvanta Build OS — deploy step skipped
      </footer>
    </div>
  );
}
