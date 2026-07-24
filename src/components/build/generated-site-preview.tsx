"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import type { GeneratedSite, SiteBlock } from "@/types/site-builder";
import { renderRegisteredBlock, TYPE_ALIASES } from "@/lib/site-builder/registry";
import { themeInk } from "@/components/site-blocks/theme";

export function GeneratedSitePreview({
  site,
  className,
}: {
  site: GeneratedSite;
  className?: string;
}) {
  const [activeSlug, setActiveSlug] = useState(site.pages[0]?.slug ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const activePage = useMemo(
    () => site.pages.find((page) => page.slug === activeSlug) ?? site.pages[0],
    [site.pages, activeSlug]
  );
  const { theme } = site;
  const ink = themeInk(theme);
  const radius = theme.buttonRadius ? `${theme.buttonRadius}px` : "9999px";
  const navStyle =
    theme.navStyle ??
    site.brand?.navStyle ??
    (site.business?.primaryGoal?.toLowerCase().includes("sell") ? "store" : "pills");

  useEffect(() => {
    if (!theme.googleFontsUrl) return;
    const id = `build-os-font-${theme.presetId}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = theme.googleFontsUrl;
    document.head.appendChild(link);
  }, [theme.googleFontsUrl, theme.presetId]);

  useEffect(() => {
    setActiveSlug(site.pages[0]?.slug ?? "");
    setMenuOpen(false);
  }, [site.generatedAt, site.pages]);

  const goTo = useCallback((slug: string) => {
    setActiveSlug(slug);
    setMenuOpen(false);
  }, []);

  const handleCta = useCallback(
    (target: string) => {
      if (!target) return;
      if (typeof document !== "undefined") {
        const existing = document.getElementById(target);
        if (existing) {
          existing.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      }
      const wantType = target === "booking" ? "booking_cta" : "contact";
      const page = site.pages.find((pg) =>
        pg.blocks.some((b) => {
          const t = TYPE_ALIASES[b.type] ?? b.type;
          return (typeof b.props?.id === "string" && b.props.id === target) || t === wantType;
        })
      );
      if (page) {
        goTo(page.slug);
        setTimeout(() => {
          document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    },
    [goTo, site.pages]
  );

  if (!activePage) return null;

  const brandMark = (
    <div className={navStyle === "centered" ? "text-center" : "min-w-0"}>
      <p
        className="truncate text-sm font-semibold tracking-tight"
        style={{ fontFamily: theme.headingFont, color: ink.text }}
      >
        {site.siteName}
      </p>
      {site.tagline ? (
        <p className="hidden truncate text-[10px] uppercase tracking-[0.14em] @[420px]:block" style={{ color: ink.muted }}>
          {site.tagline}
        </p>
      ) : null}
    </div>
  );

  const navButtons = site.navigation.map((item) => {
    const active = activeSlug === item.slug;
    const isShop = /shop|product/i.test(item.label) || item.slug === "products";
    if (navStyle === "underline") {
      return (
        <button
          key={`${item.label}-${item.slug || "home"}`}
          type="button"
          onClick={() => goTo(item.slug)}
          className="whitespace-nowrap px-2.5 py-1.5 text-xs font-medium transition-colors"
          style={{
            color: active ? theme.primaryColor : ink.muted,
            borderBottom: active ? `2px solid ${theme.primaryColor}` : "2px solid transparent",
          }}
        >
          {item.label}
        </button>
      );
    }
    if (navStyle === "minimal") {
      return (
        <button
          key={`${item.label}-${item.slug || "home"}`}
          type="button"
          onClick={() => goTo(item.slug)}
          className="whitespace-nowrap px-2 py-1 text-xs font-medium tracking-wide transition-colors"
          style={{ color: active ? ink.text : ink.muted }}
        >
          {item.label}
        </button>
      );
    }
    return (
      <button
        key={`${item.label}-${item.slug || "home"}`}
        type="button"
        onClick={() => goTo(item.slug)}
        className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          backgroundColor: active
            ? theme.primaryColor
            : isShop && navStyle === "store"
              ? `${theme.primaryColor}18`
              : "transparent",
          color: active ? ink.onPrimary : ink.muted,
        }}
      >
        {item.label}
      </button>
    );
  });

  const cartButton =
    navStyle === "store" ? (
      <button
        type="button"
        onClick={() => {
          const shop = site.navigation.find(
            (n) => n.slug === "products" || /shop/i.test(n.label)
          );
          if (shop) goTo(shop.slug);
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold @[480px]:px-3"
        style={{
          backgroundColor: theme.primaryColor,
          color: ink.onPrimary,
        }}
      >
        <ShoppingBag className="h-3.5 w-3.5" />
        <span className="hidden @[420px]:inline">Cart</span>
      </button>
    ) : null;

  return (
    <div
      className={`site-preview @container w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-2xl border border-border shadow-xl ${className ?? ""}`}
      style={
        {
          backgroundColor: theme.backgroundColor,
          color: ink.text,
          fontFamily: theme.fontFamily ?? "system-ui, sans-serif",
          ["--site-btn-radius" as string]: radius,
        } as CSSProperties
      }
    >
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md ${
          navStyle === "minimal" ? "border-transparent" : ""
        }`}
        style={{
          borderColor: ink.border,
          backgroundColor:
            navStyle === "minimal"
              ? ink.light
                ? "rgba(255,255,255,0.72)"
                : "rgba(4,6,8,0.55)"
              : ink.light
                ? "rgba(255,255,255,0.92)"
                : "rgba(4,6,8,0.88)",
        }}
      >
        {navStyle === "centered" ? (
          <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-2 px-4 py-3 @[640px]:items-center @[640px]:gap-3 @[640px]:px-8 @[640px]:py-4">
            <div className="flex items-center justify-between gap-3">
              {brandMark}
              <button
                type="button"
                className="rounded-lg p-2 @[640px]:hidden"
                style={{ color: ink.text }}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
            <nav className="hidden flex-wrap items-center justify-center gap-1 @[640px]:flex">
              {navButtons}
            </nav>
            {menuOpen ? (
              <nav
                className="flex flex-col gap-1 rounded-xl border p-2 @[640px]:hidden"
                style={{ borderColor: ink.border, backgroundColor: ink.surface }}
              >
                {site.navigation.map((item) => (
                  <button
                    key={`m-${item.slug}`}
                    type="button"
                    onClick={() => goTo(item.slug)}
                    className="rounded-lg px-3 py-2.5 text-left text-sm font-medium"
                    style={{
                      backgroundColor:
                        activeSlug === item.slug ? `${theme.primaryColor}22` : "transparent",
                      color: activeSlug === item.slug ? theme.primaryColor : ink.text,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 @[640px]:px-8 @[640px]:py-3.5">
            {brandMark}
            <div className="flex items-center gap-2">
              <nav className="hidden flex-wrap items-center gap-1 @[720px]:flex">{navButtons}</nav>
              {cartButton}
              <button
                type="button"
                className="rounded-lg p-2 @[720px]:hidden"
                style={{ color: ink.text }}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}
        {menuOpen && navStyle !== "centered" ? (
          <nav
            className="mx-4 mb-3 flex flex-col gap-1 rounded-xl border p-2 @[720px]:hidden"
            style={{ borderColor: ink.border, backgroundColor: ink.surface }}
          >
            {site.navigation.map((item) => (
              <button
                key={`m-${item.slug}`}
                type="button"
                onClick={() => goTo(item.slug)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium"
                style={{
                  backgroundColor:
                    activeSlug === item.slug ? `${theme.primaryColor}22` : "transparent",
                  color: activeSlug === item.slug ? theme.primaryColor : ink.text,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : null}
      </header>

      <main key={activePage.slug || "home"} className="min-w-0">
        {activePage.blocks.map((block) => (
          <div key={block.id} className="animate-fade-up min-w-0">
            {renderRegisteredBlock(block, theme, ink, handleCta)}
          </div>
        ))}
      </main>

      <footer
        className="border-t px-4 py-8 text-center text-xs @[640px]:px-8 @[640px]:py-10"
        style={{ borderColor: ink.border, color: ink.muted }}
      >
        <p className="font-medium" style={{ color: ink.text }}>
          {site.siteName}
        </p>
        <p className="mt-2 px-2">{site.footerNote ?? "Preview generated by Aarvanta Build OS"}</p>
      </footer>
    </div>
  );
}

export type { SiteBlock, GeneratedSite };
