"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { GeneratedSite, SiteBlock, SitePlanTheme } from "@/types/site-builder";

function isLight(bg: string): boolean {
  return /^#(?:[fF]{3}|[eEfF][eEfF]|FFFFFF|ffffff)/.test(bg) || bg.toLowerCase() === "#ffffff";
}

function themeInk(theme: SitePlanTheme) {
  const light = isLight(theme.backgroundColor);
  return {
    light,
    text: light ? "#101828" : "#F8FAFC",
    muted: light ? "#667085" : "#94A3B8",
    surface: light ? "#F5F7FA" : "rgba(255,255,255,0.04)",
    border: light ? "rgba(16,24,40,0.1)" : "rgba(255,255,255,0.12)",
    onPrimary: light ? "#FFFFFF" : theme.backgroundColor,
  };
}

function SectionShell({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={`px-5 py-12 sm:px-8 sm:py-16 ${className}`} style={style}>
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

function PrimaryButton({
  label,
  theme,
  ink,
}: {
  label: string;
  theme: SitePlanTheme;
  ink: ReturnType<typeof themeInk>;
}) {
  return (
    <button
      type="button"
      className="rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
      style={{ backgroundColor: theme.primaryColor, color: ink.onPrimary }}
    >
      {label}
    </button>
  );
}

function GhostButton({
  label,
  theme,
  ink,
}: {
  label: string;
  theme: SitePlanTheme;
  ink: ReturnType<typeof themeInk>;
}) {
  return (
    <button
      type="button"
      className="rounded-full border px-5 py-2.5 text-sm font-semibold"
      style={{ borderColor: ink.border, color: ink.text, background: "transparent" }}
    >
      {label}
    </button>
  );
}

function BlockRenderer({
  block,
  theme,
}: {
  block: SiteBlock;
  theme: SitePlanTheme;
}) {
  const ink = themeInk(theme);
  const headingFont = theme.headingFont ?? "Georgia, serif";

  switch (block.type) {
    case "hero": {
      const layout = String(block.props.layout ?? "fullBleed");
      const imageUrl = String(block.props.imageUrl ?? "");
      const headline = String(block.props.headline ?? "");
      const sub = String(block.props.subheadline ?? "");
      const eyebrow = String(block.props.eyebrow ?? "");
      const cta = String(block.props.cta ?? "Learn more");
      const secondary = String(block.props.secondaryCta ?? "");

      const mediaFallback = `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor} 55%, ${theme.backgroundColor})`;

      if (layout === "split") {
        return (
          <section className="grid min-h-[420px] lg:grid-cols-2">
            <div className="flex flex-col justify-center px-5 py-12 sm:px-10 sm:py-16">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: theme.primaryColor }}
              >
                {eyebrow}
              </p>
              <h1
                className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl"
                style={{ color: ink.text, fontFamily: headingFont }}
              >
                {headline}
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: ink.muted }}>
                {sub}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton label={cta} theme={theme} ink={ink} />
                {secondary ? <GhostButton label={secondary} theme={theme} ink={ink} /> : null}
              </div>
            </div>
            <div
              className="min-h-[280px] bg-cover bg-center"
              style={{
                backgroundColor: theme.primaryColor,
                backgroundImage: imageUrl
                  ? `${mediaFallback}, url(${imageUrl})`
                  : mediaFallback,
              }}
            />
          </section>
        );
      }

      return (
        <section
          className="relative flex min-h-[520px] items-end overflow-hidden sm:min-h-[560px]"
          style={{
            backgroundColor: theme.primaryColor,
            backgroundImage: imageUrl
              ? `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%), url(${imageUrl}), ${mediaFallback}`
              : `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.55)), ${mediaFallback}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10 w-full px-5 pb-12 pt-28 sm:px-10 sm:pb-16">
            <div className="mx-auto max-w-5xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                {eyebrow}
              </p>
              <h1
                className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl"
                style={{ fontFamily: headingFont }}
              >
                {headline}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                {sub}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-full px-6 py-3 text-sm font-semibold text-slate-950"
                  style={{ backgroundColor: "#fff" }}
                >
                  {cta}
                </button>
                {secondary ? (
                  <button
                    type="button"
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

    case "stats": {
      const items = (block.props.items as Array<{ value: string; label: string }>) ?? [];
      return (
        <SectionShell
          style={{
            backgroundColor: ink.surface,
            borderTop: `1px solid ${ink.border}`,
            borderBottom: `1px solid ${ink.border}`,
          }}
        >
          <ul className="grid gap-8 sm:grid-cols-3">
            {items.map((item) => (
              <li key={item.label} className="text-center sm:text-left">
                <p
                  className="text-3xl font-semibold tracking-tight sm:text-4xl"
                  style={{ color: theme.primaryColor, fontFamily: headingFont }}
                >
                  {item.value}
                </p>
                <p className="mt-1 text-sm" style={{ color: ink.muted }}>
                  {item.label}
                </p>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    case "features": {
      const items =
        (block.props.items as Array<{ title: string; description: string; icon?: string }>) ?? [];
      const safeItems =
        items.length > 0
          ? items
          : [
              {
                title: "Thoughtful by default",
                description: "Sample benefit copy so this section never renders empty.",
              },
              {
                title: "Ready to customize",
                description: "Replace these with your real differentiators anytime.",
              },
              {
                title: "Built for conversion",
                description: "Clear structure that leads visitors to one next step.",
              },
            ];
      return (
        <SectionShell>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: theme.primaryColor }}
          >
            Benefits
          </p>
          <h2
            className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? "Why us")}
          </h2>
          {block.props.subtitle ? (
            <p className="mt-3 max-w-2xl text-base" style={{ color: ink.muted }}>
              {String(block.props.subtitle)}
            </p>
          ) : null}
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {safeItems.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl p-5"
                style={{ backgroundColor: ink.surface, border: `1px solid ${ink.border}` }}
              >
                <div
                  className="mb-4 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${theme.primaryColor}22`, color: theme.primaryColor }}
                >
                  {(item.title[0] ?? "•").toUpperCase()}
                </div>
                <p className="text-base font-semibold" style={{ color: ink.text }}>
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: ink.muted }}>
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    case "team": {
      const members =
        (block.props.members as Array<{
          name: string;
          role: string;
          bio?: string;
          imageUrl?: string;
        }>) ?? [];
      return (
        <SectionShell>
          <h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? "Team")}
          </h2>
          {block.props.subtitle ? (
            <p className="mt-3 text-base" style={{ color: ink.muted }}>
              {String(block.props.subtitle)}
            </p>
          ) : null}
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {members.map((member) => (
              <li
                key={member.name}
                className="overflow-hidden rounded-2xl"
                style={{ border: `1px solid ${ink.border}`, backgroundColor: ink.surface }}
              >
                <div
                  className="aspect-[4/3] bg-cover bg-center"
                  style={{
                    backgroundColor: theme.primaryColor,
                    backgroundImage: member.imageUrl
                      ? `linear-gradient(135deg, ${theme.primaryColor}66, transparent), url(${member.imageUrl})`
                      : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                  }}
                />
                <div className="p-4">
                  <p className="font-semibold" style={{ color: ink.text }}>
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
                </div>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    case "products": {
      const products =
        (block.props.products as Array<{
          name: string;
          description: string;
          price: string;
          imageUrl?: string;
          badge?: string;
        }>) ?? [];
      const safeProducts =
        products.length > 0
          ? products
          : [
              {
                name: "Signature offer",
                description: "Sample product so your catalog never looks empty.",
                price: "From £49",
                badge: "Sample",
              },
              {
                name: "Essentials bundle",
                description: "A second sample SKU with room for your real copy.",
                price: "£89",
              },
              {
                name: "Membership",
                description: "Recurring sample plan customers can imagine joining.",
                price: "£19/mo",
              },
            ];
      return (
        <SectionShell>
          <h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? "Offerings")}
          </h2>
          {block.props.subtitle ? (
            <p className="mt-3 text-base" style={{ color: ink.muted }}>
              {String(block.props.subtitle)}
            </p>
          ) : null}
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {safeProducts.map((p) => (
              <li
                key={p.name}
                className="overflow-hidden rounded-2xl"
                style={{ border: `1px solid ${ink.border}`, backgroundColor: ink.surface }}
              >
                <div
                  className="aspect-[4/3] bg-cover bg-center"
                  style={{
                    backgroundColor: theme.primaryColor,
                    backgroundImage: p.imageUrl
                      ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor}), url(${p.imageUrl})`
                      : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                  }}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold" style={{ color: ink.text }}>
                      {p.name}
                    </p>
                    {p.badge ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: `${theme.primaryColor}22`,
                          color: theme.primaryColor,
                        }}
                      >
                        {p.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: ink.muted }}>
                    {p.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold" style={{ color: theme.primaryColor }}>
                    {p.price}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionShell>
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
        <SectionShell>
          <h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? "Pricing")}
          </h2>
          {block.props.subtitle ? (
            <p className="mt-3 text-base" style={{ color: ink.muted }}>
              {String(block.props.subtitle)}
            </p>
          ) : null}
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {tiers.map((tier) => (
              <li
                key={tier.name}
                className="rounded-2xl p-5"
                style={{
                  border: `1px solid ${tier.highlighted ? theme.primaryColor : ink.border}`,
                  backgroundColor: tier.highlighted ? `${theme.primaryColor}14` : ink.surface,
                }}
              >
                <p className="text-sm font-medium" style={{ color: ink.muted }}>
                  {tier.name}
                </p>
                <p
                  className="mt-2 text-3xl font-semibold"
                  style={{ color: ink.text, fontFamily: headingFont }}
                >
                  {tier.price}
                </p>
                <ul className="mt-4 space-y-2 text-sm" style={{ color: ink.muted }}>
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span style={{ color: theme.primaryColor }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    case "testimonials": {
      const quotes =
        (block.props.quotes as Array<{ text: string; author: string; role?: string }>) ?? [];
      return (
        <SectionShell style={{ backgroundColor: ink.surface }}>
          <h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? "Testimonials")}
          </h2>
          {block.props.subtitle ? (
            <p className="mt-3 text-base" style={{ color: ink.muted }}>
              {String(block.props.subtitle)}
            </p>
          ) : null}
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {quotes.map((q) => (
              <li
                key={`${q.author}-${q.text.slice(0, 12)}`}
                className="rounded-2xl p-6"
                style={{ border: `1px solid ${ink.border}`, backgroundColor: theme.backgroundColor }}
              >
                <p
                  className="text-lg leading-relaxed"
                  style={{ color: ink.text, fontFamily: headingFont }}
                >
                  “{q.text}”
                </p>
                <p className="mt-4 text-sm font-semibold" style={{ color: theme.primaryColor }}>
                  {q.author}
                </p>
                {q.role ? (
                  <p className="text-xs" style={{ color: ink.muted }}>
                    {q.role}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    case "gallery": {
      const items =
        (block.props.items as Array<{ title: string; caption?: string; imageUrl?: string }>) ??
        [];
      return (
        <SectionShell>
          <h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? "Gallery")}
          </h2>
          {block.props.subtitle ? (
            <p className="mt-3 text-base" style={{ color: ink.muted }}>
              {String(block.props.subtitle)}
            </p>
          ) : null}
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {items.map((item) => (
              <li key={item.title} className="group overflow-hidden rounded-2xl">
                <div
                  className="aspect-[4/5] bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                  style={{
                    backgroundImage: item.imageUrl
                      ? `url(${item.imageUrl})`
                      : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                  }}
                />
                <div className="pt-3">
                  <p className="font-medium" style={{ color: ink.text }}>
                    {item.title}
                  </p>
                  {item.caption ? (
                    <p className="text-xs" style={{ color: ink.muted }}>
                      {item.caption}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    case "split": {
      return (
        <SectionShell>
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: theme.primaryColor }}
              >
                {String(block.props.eyebrow ?? "About")}
              </p>
              <h2
                className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
                style={{ color: ink.text, fontFamily: headingFont }}
              >
                {String(block.props.title ?? "")}
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: ink.muted }}>
                {String(block.props.body ?? "")}
              </p>
              {Array.isArray(block.props.bullets) ? (
                <ul className="mt-5 space-y-2 text-sm" style={{ color: ink.text }}>
                  {(block.props.bullets as string[]).map((b) => (
                    <li key={b} className="flex gap-2">
                      <span style={{ color: theme.primaryColor }}>→</span>
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
              {block.props.cta ? (
                <div className="mt-6">
                  <GhostButton label={String(block.props.cta)} theme={theme} ink={ink} />
                </div>
              ) : null}
            </div>
            <div
              className="min-h-[280px] rounded-3xl bg-cover bg-center"
              style={{
                backgroundImage: block.props.imageUrl
                  ? `url(${String(block.props.imageUrl)})`
                  : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              }}
            />
          </div>
        </SectionShell>
      );
    }

    case "cta":
      return (
        <SectionShell>
          <div
            className="overflow-hidden rounded-[28px] px-6 py-12 text-center sm:px-10"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
              color: "#0B1220",
            }}
          >
            <h2
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ fontFamily: headingFont }}
            >
              {String(block.props.title ?? "Ready to start?")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm opacity-80 sm:text-base">
              {String(block.props.description ?? "")}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
              >
                {String(block.props.cta ?? "Get started")}
              </button>
              {block.props.secondaryCta ? (
                <button
                  type="button"
                  className="rounded-full border border-black/20 px-6 py-3 text-sm font-semibold"
                >
                  {String(block.props.secondaryCta)}
                </button>
              ) : null}
            </div>
          </div>
        </SectionShell>
      );

    case "contact":
      return (
        <SectionShell>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2
                className="text-3xl font-semibold tracking-tight sm:text-4xl"
                style={{ color: ink.text, fontFamily: headingFont }}
              >
                {String(block.props.title ?? "Contact")}
              </h2>
              <p className="mt-3 text-base leading-relaxed" style={{ color: ink.muted }}>
                {String(block.props.description ?? "")}
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                {block.props.email ? (
                  <div>
                    <dt className="font-medium" style={{ color: ink.text }}>
                      Email
                    </dt>
                    <dd style={{ color: ink.muted }}>{String(block.props.email)}</dd>
                  </div>
                ) : null}
                {block.props.phone ? (
                  <div>
                    <dt className="font-medium" style={{ color: ink.text }}>
                      Phone
                    </dt>
                    <dd style={{ color: ink.muted }}>{String(block.props.phone)}</dd>
                  </div>
                ) : null}
                {block.props.address ? (
                  <div>
                    <dt className="font-medium" style={{ color: ink.text }}>
                      Location
                    </dt>
                    <dd style={{ color: ink.muted }}>{String(block.props.address)}</dd>
                  </div>
                ) : null}
                {block.props.hours ? (
                  <div>
                    <dt className="font-medium" style={{ color: ink.text }}>
                      Hours
                    </dt>
                    <dd style={{ color: ink.muted }}>{String(block.props.hours)}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
            <div
              className="rounded-2xl p-5"
              style={{ border: `1px solid ${ink.border}`, backgroundColor: ink.surface }}
            >
              <div className="space-y-3">
                <input
                  readOnly
                  placeholder="Your name"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    borderColor: ink.border,
                    backgroundColor: theme.backgroundColor,
                    color: ink.text,
                  }}
                />
                <input
                  readOnly
                  placeholder="Email"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    borderColor: ink.border,
                    backgroundColor: theme.backgroundColor,
                    color: ink.text,
                  }}
                />
                <textarea
                  readOnly
                  placeholder="How can we help?"
                  rows={4}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{
                    borderColor: ink.border,
                    backgroundColor: theme.backgroundColor,
                    color: ink.text,
                  }}
                />
                <PrimaryButton
                  label={String(block.props.cta ?? "Send message")}
                  theme={theme}
                  ink={ink}
                />
              </div>
            </div>
          </div>
        </SectionShell>
      );

    case "faq": {
      const items = (block.props.items as Array<{ q: string; a: string }>) ?? [];
      return (
        <SectionShell>
          <h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? "FAQ")}
          </h2>
          <ul className="mt-8 divide-y" style={{ borderColor: ink.border }}>
            {items.map((item) => (
              <li
                key={item.q}
                className="py-5"
                style={{ borderTop: `1px solid ${ink.border}` }}
              >
                <p className="text-base font-semibold" style={{ color: ink.text }}>
                  {item.q}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: ink.muted }}>
                  {item.a}
                </p>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    }

    case "blog": {
      const posts =
        (block.props.posts as Array<{
          title: string;
          excerpt?: string;
          date?: string;
          imageUrl?: string;
        }>) ?? [];
      return (
        <SectionShell>
          <h2
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? "Journal")}
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {posts.map((post) => (
              <li
                key={post.title}
                className="overflow-hidden rounded-2xl"
                style={{ border: `1px solid ${ink.border}` }}
              >
                <div
                  className="aspect-[16/9] bg-cover bg-center"
                  style={{
                    backgroundImage: post.imageUrl
                      ? `url(${post.imageUrl})`
                      : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                  }}
                />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide" style={{ color: ink.muted }}>
                    {post.date ?? "Recent"}
                  </p>
                  <p className="mt-1 font-semibold" style={{ color: ink.text }}>
                    {post.title}
                  </p>
                  {post.excerpt ? (
                    <p className="mt-2 text-sm" style={{ color: ink.muted }}>
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

    default:
      return (
        <SectionShell>
          <h2
            className="text-2xl font-semibold"
            style={{ color: ink.text, fontFamily: headingFont }}
          >
            {String(block.props.title ?? block.type)}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed" style={{ color: ink.muted }}>
            {String(block.props.body ?? block.props.description ?? "")}
          </p>
        </SectionShell>
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
  const activePage = useMemo(
    () => site.pages.find((p) => p.slug === activeSlug) ?? site.pages[0],
    [site.pages, activeSlug]
  );
  const { theme } = site;
  const ink = themeInk(theme);

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
  }, [site.generatedAt, site.pages]);

  if (!activePage) return null;

  return (
    <div
      className={`overflow-hidden ${compact ? "rounded-2xl border border-border shadow-xl" : "rounded-none border-0"}`}
      style={{
        backgroundColor: theme.backgroundColor,
        color: ink.text,
        fontFamily: theme.fontFamily ?? "system-ui, sans-serif",
      }}
    >
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{
          borderColor: ink.border,
          backgroundColor: ink.light ? "rgba(255,255,255,0.88)" : "rgba(4,6,8,0.82)",
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div>
            <p
              className="text-sm font-semibold tracking-tight"
              style={{ fontFamily: theme.headingFont, color: ink.text }}
            >
              {site.siteName}
            </p>
            {site.tagline ? (
              <p className="text-[10px] uppercase tracking-[0.14em]" style={{ color: ink.muted }}>
                {site.tagline}
              </p>
            ) : null}
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {site.navigation.map((item) => {
              const active = activeSlug === item.slug;
              return (
                <button
                  key={`${item.label}-${item.slug || "home"}`}
                  type="button"
                  onClick={() => setActiveSlug(item.slug)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: active ? theme.primaryColor : "transparent",
                    color: active ? ink.onPrimary : ink.muted,
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main
        className={compact ? "max-h-[640px] overflow-y-auto" : ""}
        key={activePage.slug || "home"}
      >
        {activePage.blocks.map((block) => (
          <div key={block.id} className="animate-fade-up">
            <BlockRenderer block={block} theme={theme} />
          </div>
        ))}
      </main>

      <footer
        className="border-t px-5 py-8 text-center text-xs sm:px-8"
        style={{ borderColor: ink.border, color: ink.muted }}
      >
        <p className="font-medium" style={{ color: ink.text }}>
          {site.siteName}
        </p>
        <p className="mt-2">{site.footerNote ?? "Preview generated by Aarvanta Build OS"}</p>
      </footer>
    </div>
  );
}
