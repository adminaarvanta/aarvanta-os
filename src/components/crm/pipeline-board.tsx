"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CrmDeal, CrmPipeline, PipelineStage } from "@/types/crm";
import { contactDisplayName, type CrmContact } from "@/types/crm";
import { DealManualActions } from "@/components/crm/deal-manual-actions";
import { formatCrmMoney } from "@/components/crm/crm-shell";
import { MemberSelect } from "@/components/shared/member-select";
import { cn } from "@/lib/utils";

export function PipelineBoard({
  pipeline,
  deals: initialDeals,
  contacts,
  members,
  currentUserId,
}: {
  pipeline: CrmPipeline;
  deals: CrmDeal[];
  contacts: CrmContact[];
  members: Array<{ userId: string; name: string; email: string }>;
  currentUserId: string;
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [moving, setMoving] = useState<string | null>(null);

  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  const openDeals = deals.filter((d) => d.status === "open");
  const stages = [...pipeline.stages].sort((a, b) => a.order - b.order);

  async function moveDeal(dealId: string, stage: PipelineStage) {
    const previous = deals;
    setMoving(dealId);
    setDeals((current) =>
      current.map((deal) =>
        deal.id === dealId
          ? { ...deal, stageId: stage.id, probability: stage.probability }
          : deal
      )
    );
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: stage.id,
          probability: stage.probability,
        }),
      });
      if (!response.ok) {
        setDeals(previous);
      }
    } finally {
      setMoving(null);
    }
  }

  async function assignOwner(dealId: string, ownerId: string) {
    const previous = deals;
    setMoving(dealId);
    setDeals((current) =>
      current.map((deal) =>
        deal.id === dealId ? { ...deal, ownerId: ownerId || undefined } : deal
      )
    );
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: ownerId || undefined }),
      });
      if (!response.ok) {
        setDeals(previous);
      }
    } finally {
      setMoving(null);
    }
  }

  function contactName(contactId?: string) {
    if (!contactId) return null;
    const c = contacts.find((x) => x.id === contactId);
    return c ? contactDisplayName(c) : null;
  }

  const totalValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const forecast = openDeals.reduce(
    (sum, d) => sum + d.value * (d.probability / 100),
    0
  );
  const coverage = totalValue > 0 ? Math.round((forecast / totalValue) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-surface-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Weighted forecast
          </p>
          <p className="mt-0.5 text-lg font-semibold text-foreground">
            {formatCrmMoney(forecast)}
            <span className="ml-2 text-sm font-normal text-muted">
              of {formatCrmMoney(totalValue)} · {openDeals.length} open
            </span>
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted sm:max-w-xs">
          <div
            className="h-full rounded-full bg-gold"
            style={{ width: `${coverage}%` }}
          />
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {stages.map((stage) => {
          const columnDeals = openDeals.filter((d) => d.stageId === stage.id);
          const columnValue = columnDeals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div
              key={stage.id}
              className="w-[min(86vw,18.5rem)] shrink-0 rounded-2xl border border-border/80 bg-surface-muted/60 sm:w-72"
            >
              <div className="flex items-start justify-between gap-2 px-3 py-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {stage.name}
                  </h3>
                  <p className="text-[11px] text-muted">
                    {formatCrmMoney(columnValue)} · {stage.probability}%
                  </p>
                </div>
                <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold tabular-nums text-foreground ring-1 ring-border">
                  {columnDeals.length}
                </span>
              </div>
              <div className="space-y-2 px-2 pb-2 min-h-[8rem]">
                {columnDeals.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
                    No deals in this stage
                  </p>
                ) : null}
                {columnDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className={cn(
                      "rounded-xl border border-border bg-surface-elevated p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
                      moving === deal.id && "opacity-60"
                    )}
                  >
                    <Link
                      href={`/crm/deals/${deal.id}`}
                      className="text-sm font-medium leading-snug text-foreground hover:text-gold"
                    >
                      {deal.title}
                    </Link>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-gold">
                      {formatCrmMoney(deal.value, deal.currency)}
                    </p>
                    {contactName(deal.contactId) ? (
                      <p className="mt-1 truncate text-xs text-muted">
                        {contactName(deal.contactId)}
                      </p>
                    ) : null}
                    <div className="mt-2 space-y-1.5">
                      <MemberSelect
                        members={members}
                        value={deal.ownerId ?? ""}
                        onChange={(userId) => assignOwner(deal.id, userId)}
                        placeholder="Assign owner…"
                        className="text-xs py-1"
                      />
                      <select
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-gold"
                        value={deal.stageId}
                        disabled={moving === deal.id}
                        aria-label="Move deal to stage"
                        onChange={(e) => {
                          const next = stages.find((s) => s.id === e.target.value);
                          if (next) moveDeal(deal.id, next);
                        }}
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <DealManualActions
                      deal={deal}
                      members={members}
                      currentUserId={currentUserId}
                      onUpdate={(updated) =>
                        setDeals((current) =>
                          current.map((item) =>
                            item.id === updated.id ? updated : item
                          )
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
