import Link from "next/link";
import { PRICING_TIERS } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#FFFFFF] sm:text-4xl">Pricing</h1>
        <p className="mt-3 text-sm text-[#9AABC4]">
          Simple plans that scale with your AI workforce. 14-day free trial on
          paid tiers.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {PRICING_TIERS.map((tier) => (
          <article
            key={tier.id}
            className={cn(
              "flex flex-col rounded-2xl border p-6",
              tier.highlighted
                ? "border-[#B8965D]/50 bg-[#0D1524] ring-1 ring-[#B8965D]/30"
                : "border-[#243656] bg-[#040608]"
            )}
          >
            {tier.highlighted && (
              <span className="mb-3 w-fit rounded-full bg-[#B8965D]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#C9AA72] ring-1 ring-[#B8965D]/30">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-[#FFFFFF]">{tier.name}</h2>
            <p className="mt-2 text-xs text-[#9AABC4]">{tier.description}</p>
            <p className="mt-4">
              <span className="text-3xl font-bold text-[#FFFFFF]">{tier.price}</span>
              <span className="text-sm text-[#9AABC4]">{tier.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-xs text-[#9AABC4]">
                  <span className="text-[#B8965D]">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={
                tier.id === "white-label"
                  ? "/contact"
                  : tier.id === "growth"
                    ? "/dashboard?help=live"
                    : "/dashboard"
              }
              className={cn(
                "mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold",
                tier.highlighted
                  ? "bg-[#B8965D] text-black hover:bg-[#C9AA72]"
                  : "border border-[#243656] text-[#FFFFFF] hover:border-[#B8965D]/40"
              )}
            >
              {tier.cta}
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export const metadata = { title: "Pricing" };
