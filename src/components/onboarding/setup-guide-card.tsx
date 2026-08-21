"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { LaunchpadItem } from "@/lib/onboarding/launchpad";
import { cn } from "@/lib/utils";

export function SetupGuideCard({
  firstName,
  items,
  percent,
}: {
  firstName: string;
  items: LaunchpadItem[];
  percent: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const remaining = items.filter((item) => !item.done).length;

  async function dismiss() {
    setBusy(true);
    try {
      await fetch("/api/tenant/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissLaunchpad: true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-accent-cyan/30 bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-cyan">
            Setup guide
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Hey {firstName}, here is what to do first
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {remaining === 0
              ? "You have completed the basics. Keep going from Home."
              : `${remaining} step${remaining === 1 ? "" : "s"} left · ${percent}% complete`}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void dismiss()}
          className="text-xs font-medium text-muted hover:text-foreground disabled:opacity-60"
        >
          Dismiss
        </button>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-accent-cyan transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="mt-4 divide-y divide-border-subtle">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-start gap-3 px-1 py-3 transition-colors hover:bg-surface-hover/60"
            >
              {item.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-dim" />
              )}
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    item.done ? "text-muted line-through" : "text-foreground"
                  )}
                >
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {item.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
