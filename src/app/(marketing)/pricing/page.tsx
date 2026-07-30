import Link from "next/link";
import { PRICING_TIERS } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

function tierHref(id: string) {
  if (id === "enterprise") return "/contact";
  if (id === "free") return "/dashboard";
  return "/billing";
}

export default function PricingPage() {
  const standard = PRICING_TIERS.filter((t) => t.id !== "enterprise");
  const enterprise = PRICING_TIERS.find((t) => t.id === "enterprise");

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--gold)_0%,_transparent_55%)] opacity-[0.07]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-gold">
            Simple plans
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pricing that grows with you
          </h1>
          <p className="mt-3 text-sm text-muted sm:text-base">
            Start free to build and explore. Upgrade when you launch — annual
            billing saves two months.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {standard.map((tier) => (
            <article
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-shadow",
                tier.highlighted
                  ? "z-[1] border-gold/50 bg-surface-elevated shadow-[0_0_0_1px_rgba(168,137,79,0.25),0_18px_40px_-24px_rgba(0,0,0,0.45)] xl:-mt-3 xl:mb-[-0.75rem] xl:pb-7"
                  : tier.id === "free"
                    ? "border-border/80 bg-background/60 backdrop-blur-sm"
                    : "border-border bg-surface"
              )}
            >
              {tier.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black shadow-sm">
                  Most popular
                </span>
              ) : null}

              <div className="min-h-[5.5rem]">
                <h2 className="text-lg font-semibold text-foreground">
                  {tier.name}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                  {tier.description}
                </p>
              </div>

              <p className="mt-1 flex items-baseline gap-1">
                <span
                  className={cn(
                    "font-bold tracking-tight text-foreground",
                    tier.price === "£0" ? "text-3xl" : "text-4xl"
                  )}
                >
                  {tier.price}
                </span>
                {tier.period ? (
                  <span className="text-sm text-muted">{tier.period}</span>
                ) : (
                  <span className="text-sm text-muted">forever</span>
                )}
              </p>

              <ul className="mt-6 flex-1 space-y-2.5 border-t border-border-subtle pt-5">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-2.5 text-xs leading-snug text-muted"
                  >
                    <span
                      className="mt-0.5 text-gold"
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tierHref(tier.id)}
                className={cn(
                  "mt-7 block rounded-xl py-2.5 text-center text-sm font-semibold transition-colors",
                  tier.highlighted
                    ? "bg-gold text-black hover:bg-gold-bright"
                    : "border border-border bg-background/40 text-foreground hover:border-gold/40"
                )}
              >
                {tier.cta}
              </Link>
            </article>
          ))}
        </div>

        {enterprise ? (
          <article className="mt-8 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface-elevated sm:mt-10">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:p-8 lg:px-10">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-foreground">
                    {enterprise.name}
                  </h2>
                  <span className="rounded-full border border-border-subtle px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Tailored
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  {enterprise.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {enterprise.features.slice(0, 4).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-xs text-muted"
                    >
                      <span className="text-gold" aria-hidden>
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {enterprise.price}
                </p>
                <Link
                  href={tierHref(enterprise.id)}
                  className="inline-flex min-w-[10rem] items-center justify-center rounded-xl border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-gold hover:bg-gold/20"
                >
                  {enterprise.cta}
                </Link>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}

export const metadata = { title: "Pricing" };
