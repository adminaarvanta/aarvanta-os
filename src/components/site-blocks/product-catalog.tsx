"use client";

import { useMemo, useState } from "react";
import type { SitePlanTheme } from "@/types/site-builder";
import { mediaStyle, type Ink } from "@/components/site-blocks/theme";

export type CatalogProductItem = {
  id?: string;
  name: string;
  price: string;
  description: string;
  category?: string;
  badge?: string;
  imageUrl?: string;
};

const PAGE_SIZE = 8;

export function ProductCatalog({
  title,
  subtitle,
  products,
  categories: categoriesProp,
  theme,
  ink,
}: {
  title: string;
  subtitle?: string;
  products: CatalogProductItem[];
  categories?: string[];
  theme: SitePlanTheme;
  ink: Ink;
}) {
  const categories = useMemo(() => {
    if (categoriesProp?.length) return ["All", ...categoriesProp];
    const fromProducts = Array.from(
      new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))
    );
    return ["All", ...fromProducts];
  }, [categoriesProp, products]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = activeCategory === "All" || p.category === activeCategory;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [products, activeCategory, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  function selectCategory(cat: string) {
    setActiveCategory(cat);
    setPage(0);
  }

  return (
    <div className="min-w-0">
      <div className="max-w-2xl">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: theme.primaryColor }}
        >
          Shop
        </p>
        <h2
          className="mt-2 text-2xl font-semibold tracking-tight @sm:text-3xl @md:text-4xl"
          style={{ color: ink.text, fontFamily: theme.headingFont }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-sm leading-relaxed @sm:text-base" style={{ color: ink.muted }}>
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 @sm:mt-8 @sm:gap-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => selectCategory(cat)}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
                style={{
                  backgroundColor: active ? theme.primaryColor : ink.surface,
                  color: active ? ink.onPrimary : ink.muted,
                  border: `1px solid ${active ? theme.primaryColor : ink.border}`,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search products…"
          className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none @sm:max-w-[240px]"
          style={{
            borderColor: ink.border,
            backgroundColor: ink.surface,
            color: ink.text,
          }}
        />
      </div>

      <p className="mt-4 text-xs" style={{ color: ink.muted }}>
        Showing {pageItems.length} of {filtered.length} products
        {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
      </p>

      <ul className="mt-5 grid grid-cols-1 gap-4 @sm:mt-6 @sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4">
        {pageItems.map((product) => (
          <li
            key={product.id ?? product.name}
            className="min-w-0 overflow-hidden rounded-2xl"
            style={{ border: `1px solid ${ink.border}`, backgroundColor: ink.surface }}
          >
            <div className="aspect-[4/3]" style={mediaStyle(theme, product.imageUrl)} />
            <div className="p-3.5 @sm:p-4">
              {product.category ? (
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: theme.primaryColor }}
                >
                  {product.category}
                </p>
              ) : null}
              <div className="mt-1 flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold leading-snug @sm:text-base" style={{ color: ink.text }}>
                  {product.name}
                </p>
                {product.badge ? (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${theme.primaryColor}22`,
                      color: theme.primaryColor,
                    }}
                  >
                    {product.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: ink.muted }}>
                {product.description}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold" style={{ color: theme.primaryColor }}>
                  {product.price}
                </p>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ border: `1px solid ${ink.border}`, color: ink.muted }}
                >
                  View
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm" style={{ color: ink.muted }}>
          No products match these filters.
        </p>
      ) : null}

      {pageCount > 1 ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 @sm:gap-3">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-40"
            style={{
              border: `1px solid ${ink.border}`,
              color: ink.text,
              backgroundColor: ink.surface,
            }}
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: ink.muted }}>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-40"
            style={{
              border: `1px solid ${ink.border}`,
              color: ink.text,
              backgroundColor: ink.surface,
            }}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
