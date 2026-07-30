"use client";

import Link from "next/link";
import { Crown, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function PremiumBadge({
  className,
  title = "Premium — upgrade to unlock",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-bright ring-1 ring-gold/30",
        className
      )}
    >
      <Lock className="h-3 w-3" aria-hidden />
      Pro
    </span>
  );
}

export function UpgradeBanner({
  title,
  message,
  href = "/billing",
  className,
  variant = "default",
}: {
  title: string;
  message: string;
  href?: string;
  className?: string;
  variant?: "default" | "warning" | "explore";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3",
        variant === "warning" && "border-amber-500/40 bg-amber-500/10",
        variant === "explore" && "border-gold/40 bg-gold/10",
        variant === "default" && "border-border bg-surface-elevated",
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
          {variant === "explore" ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Crown className="h-4 w-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted">{message}</p>
        </div>
      </div>
      <Link
        href={href}
        className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-gold-bright"
      >
        View plans
      </Link>
    </div>
  );
}

export function FeatureGate({
  locked,
  explore,
  featureLabel,
  planName,
  children,
}: {
  locked: boolean;
  explore?: boolean;
  featureLabel?: string;
  planName?: string;
  children: React.ReactNode;
}) {
  if (locked) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <UpgradeBanner
          title={`${featureLabel ?? "This feature"} is not on your plan`}
          message={`Upgrade from ${planName ?? "Free"} to unlock this part of Aarvanta OS.`}
          href="/billing"
        />
        <div className="pointer-events-none select-none opacity-40 blur-[1px]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {explore ? (
        <div className="shrink-0 border-b border-border-subtle px-4 py-3">
          <UpgradeBanner
            variant="explore"
            title="Explore mode"
            message={`${featureLabel ?? "This area"} is available to browse on ${planName ?? "Free"}. Upgrade to create live records and run AI actions.`}
            href="/billing"
          />
        </div>
      ) : null}
      {children}
    </div>
  );
}
