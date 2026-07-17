"use client";

import { useState } from "react";
import { Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HOSTING_PLANS,
  hostingPlanForInstance,
  type HostingPlanId,
} from "@/lib/stripe/catalog";
import type { AwsEc2InstanceType } from "@/types/site-builder";

export function HostingCheckoutPanel({
  instanceType,
  buildJobId,
  domain,
  onInstanceTypeChange,
}: {
  instanceType: AwsEc2InstanceType;
  buildJobId?: string;
  domain?: string;
  onInstanceTypeChange: (instanceType: AwsEc2InstanceType) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const selected = hostingPlanForInstance(instanceType);

  async function checkout(planId: HostingPlanId) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/build/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "hosting",
          hostingPlanId: planId,
          buildJobId,
          domain,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        demo?: boolean;
        message?: string;
        error?: { message?: string };
      };
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if ((res.ok && data.demo) || res.status === 503) {
        const plan = HOSTING_PLANS.find((p) => p.id === planId);
        if (plan) onInstanceTypeChange(plan.instanceType);
        setInfo(
          data.message ??
            "Hosting plan selected. Stripe checkout unlocks when STRIPE_SECRET_KEY is set."
        );
        return;
      }
      setError(data.error?.message ?? "Hosting checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-gold/30 bg-primary-soft p-3">
        <Server className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-xs text-muted">
          Aarvanta Hosting on your EC2 plan — billed monthly via Stripe. SSL included.
        </p>
      </div>

      <ul className="space-y-2">
        {HOSTING_PLANS.map((plan) => {
          const active = selected.id === plan.id;
          return (
            <li
              key={plan.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
                active ? "border-gold bg-primary-soft" : "border-border bg-surface-muted"
              }`}
            >
              <div>
                <p className="text-xs font-medium text-foreground">{plan.name}</p>
                <p className="text-[10px] text-dim">
                  {plan.instanceType} · {plan.note}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gold">
                  {plan.currency} {plan.priceMonthly}/mo
                </span>
                <Button
                  type="button"
                  variant={active ? "primary" : "secondary"}
                  disabled={busy}
                  onClick={() => {
                    onInstanceTypeChange(plan.instanceType);
                    void checkout(plan.id);
                  }}
                >
                  {busy && active ? "…" : "Pay with Stripe"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {info && <p className="text-xs text-muted">{info}</p>}
    </div>
  );
}
