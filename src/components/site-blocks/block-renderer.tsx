"use client";

import {
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { SiteBlock, SitePlanTheme } from "@/types/site-builder";
import { ProductCatalog } from "@/components/site-blocks/product-catalog";
import {
  buttonRadius,
  mediaStyle,
  type Ink,
} from "@/components/site-blocks/theme";

export type CtaHandler = (target: string) => void;

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */

function SectionShell({
  children,
  className = "",
  style,
  id,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`min-w-0 px-4 py-10 @sm:px-6 @sm:py-14 @md:px-8 @md:py-20 ${className}`}
      style={style}
    >
      <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
    </section>
  );
}

function Eyebrow({ children, theme }: { children: ReactNode; theme: SitePlanTheme }) {
  if (!children) return null;
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: theme.primaryColor }}
    >
      {children}
    </p>
  );
}

function SectionHeading({
  title,
  subtitle,
  ink,
  theme,
  eyebrow,
  center = false,
}: {
  title?: string;
  subtitle?: string;
  ink: Ink;
  theme: SitePlanTheme;
  eyebrow?: string;
  center?: boolean;
}) {
  if (!title && !subtitle && !eyebrow) return null;
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <Eyebrow theme={theme}>{eyebrow}</Eyebrow> : null}
      {title ? (
        <h2
          className="mt-2 text-2xl font-semibold tracking-tight @sm:text-3xl @md:text-4xl"
          style={{ color: ink.text, fontFamily: theme.headingFont }}
        >
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className="mt-3 text-base leading-relaxed" style={{ color: ink.muted }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function PrimaryButton({
  label,
  theme,
  ink,
  onClick,
}: {
  label: string;
  theme: SitePlanTheme;
  ink: Ink;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-6 py-3 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02] @sm:w-auto"
      style={{ backgroundColor: theme.primaryColor, color: ink.onPrimary, borderRadius: buttonRadius(theme) }}
    >
      {label}
    </button>
  );
}

function GhostButton({
  label,
  ink,
  onClick,
}: {
  label: string;
  ink: Ink;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full border px-6 py-3 text-sm font-semibold transition-colors @sm:w-auto"
      style={{ borderColor: ink.border, color: ink.text, background: "transparent" }}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Prop coercion helpers                                               */
/* ------------------------------------------------------------------ */

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function arr<T = Record<string, unknown>>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export const TYPE_ALIASES: Record<string, string> = {
  team: "team_grid",
  faq: "faq_accordion",
  pricing: "pricing_table",
  blog: "blog_list",
  cta: "cta_banner",
  split: "about_split",
};

/* ------------------------------------------------------------------ */
/* Interactive blocks                                                  */
/* ------------------------------------------------------------------ */

function FaqAccordion({
  items,
  theme,
  ink,
}: {
  items: Array<{ question: string; answer: string }>;
  theme: SitePlanTheme;
  ink: Ink;
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="mt-8 overflow-hidden rounded-2xl" style={{ border: `1px solid ${ink.border}` }}>
      {items.map((item, i) => {
        const expanded = open === i;
        return (
          <li key={item.question} style={{ borderTop: i === 0 ? undefined : `1px solid ${ink.border}` }}>
            <button
              type="button"
              onClick={() => setOpen(expanded ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              style={{ backgroundColor: expanded ? ink.surface : "transparent" }}
            >
              <span className="text-base font-semibold" style={{ color: ink.text }}>
                {item.question}
              </span>
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-transform"
                style={{
                  backgroundColor: `${theme.primaryColor}22`,
                  color: theme.primaryColor,
                  transform: expanded ? "rotate(45deg)" : "none",
                }}
              >
                +
              </span>
            </button>
            {expanded ? (
              <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: ink.muted }}>
                {item.answer}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function FeatureTabs({
  tabs,
  theme,
  ink,
}: {
  tabs: Array<{ label: string; title: string; body: string; imageUrl?: string }>;
  theme: SitePlanTheme;
  ink: Ink;
}) {
  const [active, setActive] = useState(0);
  const current = tabs[active] ?? tabs[0];
  if (!current) return null;
  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab, i) => {
          const on = i === active;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(i)}
              className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: on ? theme.primaryColor : ink.surface,
                color: on ? ink.onPrimary : ink.muted,
                border: `1px solid ${on ? theme.primaryColor : ink.border}`,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        className="mt-6 grid items-center gap-6 rounded-3xl p-6 @sm:p-8 @lg:grid-cols-2"
        style={{ backgroundColor: ink.surface, border: `1px solid ${ink.border}` }}
      >
        <div>
          <h3
            className="text-2xl font-semibold tracking-tight"
            style={{ color: ink.text, fontFamily: theme.headingFont }}
          >
            {current.title}
          </h3>
          <p className="mt-3 text-base leading-relaxed" style={{ color: ink.muted }}>
            {current.body}
          </p>
        </div>
        <div className="min-h-[220px] rounded-2xl" style={mediaStyle(theme, current.imageUrl)} />
      </div>
    </div>
  );
}

function ContactForm({
  block,
  theme,
  ink,
}: {
  block: SiteBlock;
  theme: SitePlanTheme;
  ink: Ink;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldStyle: CSSProperties = {
    borderColor: ink.border,
    backgroundColor: theme.backgroundColor,
    color: ink.text,
  };

  function submit() {
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email.");
    if (message.trim().length < 4) return setError("Add a short message.");
    setError(null);
    setSent(true);
  }

  return (
    <div className="rounded-2xl p-6" style={{ border: `1px solid ${ink.border}`, backgroundColor: ink.surface }}>
      {sent ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold"
            style={{ backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
          >
            ✓
          </div>
          <p className="mt-4 text-lg font-semibold" style={{ color: ink.text }}>
            Thanks — we&apos;ll be in touch.
          </p>
          <p className="mt-1 text-sm" style={{ color: ink.muted }}>
            Your message has been received.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={fieldStyle}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={fieldStyle}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help?"
            rows={4}
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={fieldStyle}
          />
          {error ? (
            <p className="text-xs" style={{ color: "#EF4444" }}>
              {error}
            </p>
          ) : null}
          <PrimaryButton label={str(block.props.cta, "Send message")} theme={theme} ink={ink} onClick={submit} />
        </div>
      )}
    </div>
  );
}

function NewsletterForm({
  block,
  theme,
  ink,
}: {
  block: SiteBlock;
  theme: SitePlanTheme;
  ink: Ink;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email.");
      return;
    }
    setError(null);
    setSent(true);
  }

  return (
    <SectionShell style={{ backgroundColor: ink.surface, borderTop: `1px solid ${ink.border}` }}>
      <div className="mx-auto max-w-2xl text-center">
        <h2
          className="text-3xl font-semibold tracking-tight @sm:text-4xl"
          style={{ color: ink.text, fontFamily: theme.headingFont }}
        >
          {str(block.props.title, "Stay in the loop")}
        </h2>
        <p className="mt-3 text-base" style={{ color: ink.muted }}>
          {str(block.props.description)}
        </p>
        {sent ? (
          <p className="mt-6 text-base font-semibold" style={{ color: theme.primaryColor }}>
            Thanks — we&apos;ll be in touch.
          </p>
        ) : (
          <>
            <div className="mx-auto mt-6 flex max-w-md flex-col gap-2 @sm:flex-row">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={str(block.props.placeholder, "you@company.com")}
                className="w-full rounded-full border px-4 py-3 text-sm outline-none"
                style={{ borderColor: ink.border, backgroundColor: theme.backgroundColor, color: ink.text }}
              />
              <PrimaryButton label={str(block.props.cta, "Subscribe")} theme={theme} ink={ink} onClick={submit} />
            </div>
            {error ? (
              <p className="mt-2 text-xs" style={{ color: "#EF4444" }}>
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/* Block renderer                                                      */
/* ------------------------------------------------------------------ */

export function BlockRenderer({
  block,
  theme,
  ink,
  onCta,
}: {
  block: SiteBlock;
  theme: SitePlanTheme;
  ink: Ink;
  onCta: CtaHandler;
}) {
  const type = TYPE_ALIASES[block.type] ?? block.type;
  const p = block.props;
  const blockId = str(p.id) || undefined;

  switch (type) {
    /* ---------------------------------------------------------------- */
    case "hero": {
      const variant = block.variantId || "default";
      const layoutFromVariant =
        variant === "split" ? "split" :
        variant === "centered" ? "centered" :
        variant === "fullBleed" ? "fullBleed" :
        str(p.layout, "fullBleed");
      const layout = layoutFromVariant;
      const imageUrl = str(p.imageUrl);
      const headline = str(p.headline, "A site that works as hard as you do");
      const sub = str(p.subheadline);
      const eyebrow = str(p.eyebrow);
      const cta = str(p.cta, "Get started");
      const secondary = str(p.secondaryCta);
      const target = str(p.ctaTarget, "contact");

      if (layout === "split") {
        return (
          <section className="grid min-w-0 items-stretch @md:grid-cols-2">
            <div className="flex flex-col justify-center px-4 py-10 @sm:px-8 @sm:py-14 @md:px-10 @md:py-20">
              <Eyebrow theme={theme}>{eyebrow}</Eyebrow>
              <h1
                className="mt-3 text-[1.75rem] font-semibold leading-[1.12] tracking-tight @sm:mt-4 @sm:text-4xl @md:text-5xl"
                style={{ color: ink.text, fontFamily: theme.headingFont }}
              >
                {headline}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed @sm:mt-4 @sm:text-base @md:text-lg" style={{ color: ink.muted }}>
                {sub}
              </p>
              <div className="mt-6 flex flex-col gap-2 @sm:mt-8 @sm:flex-row @sm:flex-wrap @sm:gap-3">
                <PrimaryButton label={cta} theme={theme} ink={ink} onClick={() => onCta(target)} />
                {secondary ? (
                  <GhostButton label={secondary} ink={ink} onClick={() => onCta(target)} />
                ) : null}
              </div>
            </div>
            <div
              className="min-h-[200px] @sm:min-h-[280px] @md:min-h-full"
              style={mediaStyle(theme, imageUrl)}
            />
          </section>
        );
      }


      if (layout === "centered") {
        return (
          <section className="min-w-0 px-4 py-12 @sm:px-8 @sm:py-20 @md:px-10 @md:py-28" style={{ backgroundColor: theme.backgroundColor }}>
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow theme={theme}>{eyebrow}</Eyebrow>
              <h1
                className="mt-3 text-[1.75rem] font-semibold leading-[1.12] tracking-tight @sm:mt-4 @sm:text-4xl @md:text-5xl"
                style={{ color: ink.text, fontFamily: theme.headingFont }}
              >
                {headline}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed @sm:mt-4 @sm:text-base @md:text-lg" style={{ color: ink.muted }}>
                {sub}
              </p>
              <div className="mt-6 flex flex-col items-stretch justify-center gap-2 @sm:mt-8 @sm:flex-row @sm:flex-wrap @sm:items-center @sm:gap-3">
                <PrimaryButton label={cta} theme={theme} ink={ink} onClick={() => onCta(target)} />
                {secondary ? (
                  <GhostButton label={secondary} ink={ink} onClick={() => onCta(target)} />
                ) : null}
              </div>
            </div>
          </section>
        );
      }

      return (
        <section
          className="relative flex min-h-[420px] min-w-0 items-end overflow-hidden @sm:min-h-[520px] @md:min-h-[600px]"
          style={mediaStyle(theme, imageUrl, true)}
        >
          <div className="relative z-10 w-full px-4 pb-10 pt-24 @sm:px-8 @sm:pb-16 @sm:pt-28 @md:px-10 @md:pb-20">
            <div className="mx-auto max-w-6xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{eyebrow}</p>
              <h1
                className="mt-3 max-w-3xl text-[1.85rem] font-semibold leading-[1.08] tracking-tight text-white @sm:mt-4 @sm:text-4xl @md:text-5xl @lg:text-6xl"
                style={{ fontFamily: theme.headingFont }}
              >
                {headline}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 @sm:mt-4 @sm:text-base @md:text-lg">{sub}</p>
              <div className="mt-6 flex flex-col gap-2 @sm:mt-8 @sm:flex-row @sm:flex-wrap @sm:gap-3">
                <button
                  type="button"
                  onClick={() => onCta(target)}
                  className="rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: theme.primaryColor, color: ink.onPrimary }}
                >
                  {cta}
                </button>
                {secondary ? (
                  <button
                    type="button"
                    onClick={() => onCta(target)}
                    className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white"
                  >
                    {secondary}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      );
    }

    /* ---------------------------------------------------------------- */
    case "logo_cloud": {
      const items = arr<{ label: string }>(p.items);
      return (
        <SectionShell style={{ backgroundColor: ink.surface, borderTop: `1px solid ${ink.border}`, borderBottom: `1px solid ${ink.border}` }}>
          {p.title ? (
            <p className="text-center text-xs font-medium uppercase tracking-[0.16em]" style={{ color: ink.dim }}>
              {str(p.title)}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {items.map((item) => (
              <span key={item.label} className="text-lg font-semibold tracking-tight" style={{ color: ink.muted, opacity: 0.75 }}>
                {item.label}
              </span>
            ))}
          </div>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "features":
    case "services_grid": {
      const items = arr<{ title: string; description: string; icon?: string }>(p.items);
      const variant = block.variantId ?? "cards";
      const gridClass =
        variant === "row"
          ? "mt-8 grid gap-4 @sm:mt-10 @sm:grid-cols-2"
          : "mt-8 grid gap-4 @sm:mt-10 @sm:grid-cols-2 @lg:grid-cols-3";
      return (
        <SectionShell>
          <SectionHeading
            eyebrow={type === "services_grid" ? "Services" : "Highlights"}
            title={str(p.title, "Why people choose us")}
            subtitle={str(p.subtitle)}
            ink={ink}
            theme={theme}
          />
          <ul className={gridClass}>
            {items.map((item) => (
              <li
                key={item.title}
                className={
                  variant === "row"
                    ? "flex gap-4 rounded-2xl p-5"
                    : "rounded-2xl p-6"
                }
                style={{ backgroundColor: ink.surface, border: `1px solid ${ink.border}` }}
              >
                <div
                  className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  style={{ backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
                >
                  {(item.title?.[0] ?? "•").toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-semibold" style={{ color: ink.text }}>
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: ink.muted }}>
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "products": {
      const products = arr<{
        name: string;
        price: string;
        description: string;
        imageUrl?: string;
        badge?: string;
        category?: string;
        id?: string;
      }>(p.products);
      const categories = arr<string>(p.categories);
      const variant = block.variantId ?? "default";

      if (variant === "catalog") {
        return (
          <SectionShell>
            <ProductCatalog
              title={str(p.title, "Shop the collection")}
              subtitle={str(p.subtitle, "Browse by category, filter, and page through the catalog.")}
              products={products}
              categories={categories.length ? categories : undefined}
              theme={theme}
              ink={ink}
            />
          </SectionShell>
        );
      }

      const gridClass =
        variant === "list"
          ? "mt-8 grid gap-4 @sm:mt-10"
          : variant === "featured"
            ? "mt-8 grid gap-4 @sm:mt-10 @sm:grid-cols-2 @md:grid-cols-3"
            : "mt-8 grid gap-4 @sm:mt-10 @sm:grid-cols-2 @lg:grid-cols-4";

      return (
        <SectionShell>
          <SectionHeading eyebrow="Shop" title={str(p.title, "Featured products")} subtitle={str(p.subtitle)} ink={ink} theme={theme} />
          <ul className={gridClass}>
            {products.map((product) => (
              <li
                key={product.id ?? product.name}
                className={
                  variant === "list"
                    ? "flex min-w-0 flex-col overflow-hidden rounded-2xl @sm:flex-row"
                    : "min-w-0 overflow-hidden rounded-2xl"
                }
                style={{ border: `1px solid ${ink.border}`, backgroundColor: ink.surface }}
              >
                <div
                  className={
                    variant === "list"
                      ? "aspect-[16/10] w-full shrink-0 @sm:aspect-auto @sm:h-auto @sm:w-40 @md:w-48"
                      : "aspect-[4/3]"
                  }
                  style={mediaStyle(theme, product.imageUrl)}
                />
                <div className="min-w-0 p-4">
                  {product.category ? (
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
                      {product.category}
                    </p>
                  ) : null}
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold" style={{ color: ink.text }}>
                      {product.name}
                    </p>
                    {product.badge ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
                      >
                        {product.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: ink.muted }}>
                    {product.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold" style={{ color: theme.primaryColor }}>
                    {product.price}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "portfolio_grid": {
      const items = arr<{ title: string; category?: string; imageUrl?: string; summary?: string }>(p.items);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Work" title={str(p.title, "Selected work")} subtitle={str(p.subtitle)} ink={ink} theme={theme} />
          <ul className="mt-10 grid gap-4 @sm:grid-cols-2 @lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.title} className="group overflow-hidden rounded-2xl" style={{ border: `1px solid ${ink.border}` }}>
                <div
                  className="aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.04]"
                  style={mediaStyle(theme, item.imageUrl)}
                />
                <div className="p-4">
                  {item.category ? (
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
                      {item.category}
                    </p>
                  ) : null}
                  <p className="mt-1 font-semibold" style={{ color: ink.text }}>
                    {item.title}
                  </p>
                  {item.summary ? (
                    <p className="mt-1 text-sm" style={{ color: ink.muted }}>
                      {item.summary}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "testimonials": {
      const quotes = arr<{ quote?: string; text?: string; name?: string; author?: string; role?: string; avatarUrl?: string }>(
        p.quotes
      );
      return (
        <SectionShell style={{ backgroundColor: ink.surface }}>
          <SectionHeading eyebrow="Testimonials" title={str(p.title, "What clients say")} subtitle={str(p.subtitle)} ink={ink} theme={theme} />
          <ul className="mt-10 grid gap-5 @sm:grid-cols-2 @lg:grid-cols-3">
            {quotes.map((q, i) => {
              const text = q.quote ?? q.text ?? "";
              const who = q.name ?? q.author ?? "Client";
              return (
                <li
                  key={`${who}-${i}`}
                  className="flex flex-col rounded-2xl p-6"
                  style={{ border: `1px solid ${ink.border}`, backgroundColor: theme.backgroundColor }}
                >
                  <p className="flex-1 text-base leading-relaxed" style={{ color: ink.text }}>
                    &ldquo;{text}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    {q.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={q.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" style={{ backgroundColor: ink.surfaceStrong }} />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                        style={{ backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
                      >
                        {who[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold" style={{ color: ink.text }}>
                        {who}
                      </p>
                      {q.role ? (
                        <p className="text-xs" style={{ color: ink.muted }}>
                          {q.role}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "stats": {
      const items = arr<{ value: string; label: string }>(p.items);
      return (
        <SectionShell
          style={{
            backgroundColor: ink.surface,
            borderTop: `1px solid ${ink.border}`,
            borderBottom: `1px solid ${ink.border}`,
          }}
        >
          <ul className="grid gap-8 @sm:grid-cols-2 @lg:grid-cols-4">
            {items.map((item) => (
              <li key={item.label} className="text-center">
                <p
                  className="text-4xl font-semibold tracking-tight @sm:text-5xl"
                  style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}
                >
                  {item.value}
                </p>
                <p className="mt-2 text-sm" style={{ color: ink.muted }}>
                  {item.label}
                </p>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "pricing_table": {
      const tiers = arr<{
        name: string;
        price: string;
        period?: string;
        description?: string;
        features: string[];
        cta?: string;
        highlighted?: boolean;
      }>(p.tiers);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Pricing" title={str(p.title, "Simple pricing")} subtitle={str(p.subtitle)} ink={ink} theme={theme} center />
          <ul className="mx-auto mt-10 grid max-w-5xl gap-4 @lg:grid-cols-3">
            {tiers.map((tier) => (
              <li
                key={tier.name}
                className="flex flex-col rounded-2xl p-6"
                style={{
                  border: `1px solid ${tier.highlighted ? theme.primaryColor : ink.border}`,
                  backgroundColor: tier.highlighted ? `${theme.primaryColor}12` : ink.surface,
                  boxShadow: tier.highlighted ? `0 20px 60px -30px ${theme.primaryColor}` : undefined,
                }}
              >
                <p className="text-sm font-medium" style={{ color: ink.muted }}>
                  {tier.name}
                </p>
                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold" style={{ color: ink.text, fontFamily: theme.headingFont }}>
                    {tier.price}
                  </span>
                  {tier.period ? (
                    <span className="text-sm" style={{ color: ink.muted }}>
                      {tier.period}
                    </span>
                  ) : null}
                </p>
                {tier.description ? (
                  <p className="mt-1 text-sm" style={{ color: ink.muted }}>
                    {tier.description}
                  </p>
                ) : null}
                <ul className="mt-5 flex-1 space-y-2 text-sm" style={{ color: ink.muted }}>
                  {arr<string>(tier.features).map((f) => (
                    <li key={f} className="flex gap-2">
                      <span style={{ color: theme.primaryColor }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <PrimaryButton label={tier.cta ?? "Choose"} theme={theme} ink={ink} onClick={() => onCta("contact")} />
                </div>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "faq_accordion": {
      const items = arr<{ question?: string; answer?: string; q?: string; a?: string }>(p.items).map((it) => ({
        question: it.question ?? it.q ?? "",
        answer: it.answer ?? it.a ?? "",
      }));
      return (
        <SectionShell>
          <SectionHeading eyebrow="FAQ" title={str(p.title, "Frequently asked questions")} ink={ink} theme={theme} />
          <FaqAccordion items={items} theme={theme} ink={ink} />
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "timeline": {
      const items = arr<{ title: string; description: string }>(p.items);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Process" title={str(p.title, "How it works")} ink={ink} theme={theme} />
          <ol className="mt-10 grid gap-6 @sm:grid-cols-2 @lg:grid-cols-4">
            {items.map((item, i) => (
              <li key={item.title} className="relative">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: theme.primaryColor, color: ink.onPrimary }}
                >
                  {i + 1}
                </div>
                <p className="mt-4 text-base font-semibold" style={{ color: ink.text }}>
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: ink.muted }}>
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "team_grid": {
      const members = arr<{ name: string; role: string; bio?: string; avatarUrl?: string; imageUrl?: string }>(p.members);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Team" title={str(p.title, "People behind the work")} subtitle={str(p.subtitle)} ink={ink} theme={theme} />
          <ul className="mt-10 grid gap-5 @sm:grid-cols-2 @lg:grid-cols-4">
            {members.map((member) => {
              const avatar = member.avatarUrl ?? member.imageUrl;
              return (
                <li
                  key={member.name}
                  className="rounded-2xl p-5 text-center"
                  style={{ border: `1px solid ${ink.border}`, backgroundColor: ink.surface }}
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt={member.name}
                      className="mx-auto h-20 w-20 rounded-full object-cover"
                      style={{ backgroundColor: ink.surfaceStrong }}
                    />
                  ) : (
                    <div
                      className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold"
                      style={{ backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
                    >
                      {member.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <p className="mt-4 font-semibold" style={{ color: ink.text }}>
                    {member.name}
                  </p>
                  <p className="text-xs font-medium" style={{ color: theme.primaryColor }}>
                    {member.role}
                  </p>
                  {member.bio ? (
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: ink.muted }}>
                      {member.bio}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "comparison": {
      const columns = arr<{ name: string; highlighted?: boolean; items: string[] }>(p.columns);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Compare" title={str(p.title, "A clearer way forward")} ink={ink} theme={theme} center />
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 @sm:grid-cols-2">
            {columns.map((col) => (
              <div
                key={col.name}
                className="rounded-2xl p-6"
                style={{
                  border: `1px solid ${col.highlighted ? theme.primaryColor : ink.border}`,
                  backgroundColor: col.highlighted ? `${theme.primaryColor}12` : ink.surface,
                }}
              >
                <p className="text-lg font-semibold" style={{ color: col.highlighted ? theme.primaryColor : ink.text }}>
                  {col.name}
                </p>
                <ul className="mt-4 space-y-2 text-sm" style={{ color: ink.muted }}>
                  {arr<string>(col.items).map((item) => (
                    <li key={item} className="flex gap-2">
                      <span style={{ color: col.highlighted ? theme.primaryColor : ink.dim }}>
                        {col.highlighted ? "✓" : "—"}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "cta_banner": {
      const target = str(p.ctaTarget, "contact");
      return (
        <SectionShell id={blockId}>
          <div
            className="overflow-hidden rounded-[28px] px-6 py-14 text-center @sm:px-12"
            style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`, color: "#0B1220" }}
          >
            <h2 className="text-3xl font-semibold tracking-tight @sm:text-4xl" style={{ fontFamily: theme.headingFont }}>
              {str(p.title, "Ready to start?")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm opacity-80 @sm:text-base">{str(p.body ?? p.description)}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => onCta(target)}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02]"
              >
                {str(p.cta, "Get started")}
              </button>
              {p.secondaryCta ? (
                <button
                  type="button"
                  onClick={() => onCta(target)}
                  className="rounded-full border border-black/20 px-6 py-3 text-sm font-semibold"
                >
                  {str(p.secondaryCta)}
                </button>
              ) : null}
            </div>
          </div>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "gallery": {
      const items = arr<{ title?: string; caption?: string; imageUrl?: string }>(p.items);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Gallery" title={str(p.title, "Inside the experience")} subtitle={str(p.subtitle)} ink={ink} theme={theme} />
          <ul className="mt-10 grid gap-3 @sm:grid-cols-3">
            {items.map((item, i) => (
              <li key={`${item.caption ?? item.title ?? "img"}-${i}`} className="group overflow-hidden rounded-2xl">
                <div
                  className="aspect-square transition-transform duration-500 group-hover:scale-[1.05]"
                  style={mediaStyle(theme, item.imageUrl)}
                />
                {item.caption || item.title ? (
                  <p className="pt-2 text-xs" style={{ color: ink.muted }}>
                    {item.caption ?? item.title}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "menu_list": {
      const sections = arr<{ name: string; items: Array<{ name: string; description?: string; price?: string }> }>(p.sections);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Menu" title={str(p.title, "Menu highlights")} ink={ink} theme={theme} />
          <div className="mt-10 grid gap-8 @lg:grid-cols-2">
            {sections.map((section) => (
              <div key={section.name}>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: theme.primaryColor }}
                >
                  {section.name}
                </p>
                <ul className="mt-4 space-y-4">
                  {arr<{ name: string; description?: string; price?: string }>(section.items).map((item) => (
                    <li key={item.name} className="flex items-start justify-between gap-4 border-b pb-3" style={{ borderColor: ink.border }}>
                      <div>
                        <p className="text-base font-semibold" style={{ color: ink.text }}>
                          {item.name}
                        </p>
                        {item.description ? (
                          <p className="mt-0.5 text-sm" style={{ color: ink.muted }}>
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      {item.price ? (
                        <span className="shrink-0 text-sm font-semibold" style={{ color: theme.primaryColor }}>
                          {item.price}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "booking_cta": {
      const slots = arr<string>(p.slots);
      return (
        <SectionShell id={blockId ?? "booking"}>
          <div
            className="grid items-center gap-8 rounded-3xl p-8 @sm:p-10 @lg:grid-cols-2"
            style={{ backgroundColor: ink.surface, border: `1px solid ${ink.border}` }}
          >
            <div>
              <Eyebrow theme={theme}>Booking</Eyebrow>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight @sm:text-4xl" style={{ color: ink.text, fontFamily: theme.headingFont }}>
                {str(p.title, "Book your next step")}
              </h2>
              <p className="mt-3 text-base leading-relaxed" style={{ color: ink.muted }}>
                {str(p.description)}
              </p>
              <div className="mt-6">
                <PrimaryButton label={str(p.cta, "Book now")} theme={theme} ink={ink} onClick={() => onCta("contact")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => onCta("contact")}
                  className="rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
                  style={{ borderColor: ink.border, backgroundColor: theme.backgroundColor, color: ink.text }}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "feature_tabs": {
      const tabs = arr<{ label: string; title: string; body: string; imageUrl?: string }>(p.tabs);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Product" title={str(p.title, "Explore the platform")} subtitle={str(p.subtitle)} ink={ink} theme={theme} />
          <FeatureTabs tabs={tabs} theme={theme} ink={ink} />
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "about_split": {
      const bullets = arr<string>(p.bullets);
      return (
        <SectionShell id={blockId}>
          <div className="grid items-center gap-10 @lg:grid-cols-2">
            <div>
              <Eyebrow theme={theme}>{str(p.eyebrow, "About")}</Eyebrow>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight @sm:text-4xl" style={{ color: ink.text, fontFamily: theme.headingFont }}>
                {str(p.title)}
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: ink.muted }}>
                {str(p.body)}
              </p>
              {bullets.length ? (
                <ul className="mt-6 space-y-2 text-sm" style={{ color: ink.text }}>
                  {bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span style={{ color: theme.primaryColor }}>→</span>
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
              {p.cta ? (
                <div className="mt-7">
                  <GhostButton label={str(p.cta)} ink={ink} onClick={() => onCta("contact")} />
                </div>
              ) : null}
            </div>
            <div className="min-h-[320px] rounded-3xl" style={mediaStyle(theme, str(p.imageUrl))} />
          </div>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "blog_list": {
      const posts = arr<{ title: string; excerpt?: string; date?: string; imageUrl?: string }>(p.posts);
      return (
        <SectionShell>
          <SectionHeading eyebrow="Journal" title={str(p.title, "Latest insights")} subtitle={str(p.subtitle)} ink={ink} theme={theme} />
          <ul className="mt-10 grid gap-5 @sm:grid-cols-2 @lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.title} className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${ink.border}` }}>
                <div className="aspect-[16/9]" style={mediaStyle(theme, post.imageUrl)} />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide" style={{ color: ink.dim }}>
                    {post.date ?? "Recent"}
                  </p>
                  <p className="mt-1 font-semibold" style={{ color: ink.text }}>
                    {post.title}
                  </p>
                  {post.excerpt ? (
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: ink.muted }}>
                      {post.excerpt}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "newsletter":
      return <NewsletterForm block={block} theme={theme} ink={ink} />;

    /* ---------------------------------------------------------------- */
    case "contact": {
      const showForm = p.showForm !== false;
      return (
        <SectionShell id={blockId ?? "contact"}>
          <div className="grid gap-10 @lg:grid-cols-2">
            <div>
              <Eyebrow theme={theme}>Contact</Eyebrow>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight @sm:text-4xl" style={{ color: ink.text, fontFamily: theme.headingFont }}>
                {str(p.title, "Let's talk")}
              </h2>
              <p className="mt-3 text-base leading-relaxed" style={{ color: ink.muted }}>
                {str(p.description)}
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                {p.email ? (
                  <div>
                    <dt className="font-medium" style={{ color: ink.text }}>
                      Email
                    </dt>
                    <dd style={{ color: ink.muted }}>{str(p.email)}</dd>
                  </div>
                ) : null}
                {p.phone ? (
                  <div>
                    <dt className="font-medium" style={{ color: ink.text }}>
                      Phone
                    </dt>
                    <dd style={{ color: ink.muted }}>{str(p.phone)}</dd>
                  </div>
                ) : null}
                {p.address ? (
                  <div>
                    <dt className="font-medium" style={{ color: ink.text }}>
                      Location
                    </dt>
                    <dd style={{ color: ink.muted }}>{str(p.address)}</dd>
                  </div>
                ) : null}
                {p.hours ? (
                  <div>
                    <dt className="font-medium" style={{ color: ink.text }}>
                      Hours
                    </dt>
                    <dd style={{ color: ink.muted }}>{str(p.hours)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            {showForm ? <ContactForm block={block} theme={theme} ink={ink} /> : null}
          </div>
        </SectionShell>
      );
    }

    /* ---------------------------------------------------------------- */
    case "rich_text":
    case "content":
    default:
      return (
        <SectionShell id={blockId}>
          <SectionHeading title={str(p.title, block.type)} ink={ink} theme={theme} />
          <p className="mt-3 max-w-2xl text-base leading-relaxed" style={{ color: ink.muted }}>
            {str(p.body ?? p.description)}
          </p>
        </SectionShell>
      );
  }
}

