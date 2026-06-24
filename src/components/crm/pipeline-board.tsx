"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CrmDeal, CrmPipeline, PipelineStage } from "@/types/crm";
import { contactDisplayName, type CrmContact } from "@/types/crm";
import { DealManualActions } from "@/components/crm/deal-manual-actions";
import { MemberSelect } from "@/components/shared/member-select";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

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

  const forecast = openDeals.reduce(
    (sum, d) => sum + d.value * (d.probability / 100),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 text-sm text-[#A89878] sm:flex-row sm:items-center sm:justify-between">
        <p>
          {openDeals.length} open deal{openDeals.length !== 1 ? "s" : ""}
        </p>
        <p>
          Weighted forecast:{" "}
          <span className="font-semibold text-[#F5E6C8]">
            {formatCurrency(forecast, "GBP")}
          </span>
        </p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const columnDeals = openDeals.filter((d) => d.stageId === stage.id);
          return (
            <div
              key={stage.id}
              className="w-[min(85vw,18rem)] shrink-0 rounded-xl border border-[#3d3528] bg-[#141414] sm:w-72"
            >
              <div className="border-b border-[#3d3528] px-3 py-2">
                <h3 className="text-sm font-semibold text-[#F5E6C8]">
                  {stage.name}
                </h3>
                <p className="text-xs text-[#A89878]">
                  {columnDeals.length} · {stage.probability}%
                </p>
              </div>
              <div className="space-y-2 p-2 min-h-[120px]">
                {columnDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="rounded-lg border border-[#3d3528] bg-[#101010] p-3 shadow-sm"
                  >
                    <Link
                      href={`/crm/deals/${deal.id}`}
                      className="text-sm font-medium text-[#F5E6C8] hover:text-[#D4AF37]"
                    >
                      {deal.title}
                    </Link>
                    <p className="mt-1 text-xs font-semibold text-[#D4AF37]">
                      {formatCurrency(deal.value, deal.currency)}
                    </p>
                    {contactName(deal.contactId) && (
                      <p className="mt-1 text-xs text-[#A89878]">
                        {contactName(deal.contactId)}
                      </p>
                    )}
                    <div className="mt-2">
                      <MemberSelect
                        members={members}
                        value={deal.ownerId ?? ""}
                        onChange={(userId) => assignOwner(deal.id, userId)}
                        placeholder="Assign owner…"
                        className="text-xs py-1"
                      />
                    </div>
                    <select
                      className="mt-2 w-full rounded border border-[#3d3528] bg-[#141414] px-2 py-1 text-xs text-[#F5E6C8]"
                      value={deal.stageId}
                      disabled={moving === deal.id}
                      onChange={(e) => {
                        const next = stages.find((s) => s.id === e.target.value);
                        if (next) moveDeal(deal.id, next);
                      }}
                    >
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          Move to {s.name}
                        </option>
                      ))}
                    </select>
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
