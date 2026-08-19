"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CrmDeal } from "@/types/crm";
import { contactDisplayName, type CrmContact } from "@/types/crm";
import { formatCrmMoney } from "@/components/crm/crm-shell";
import { cn } from "@/lib/utils";

export function ClosedDealsList({
  deals,
  contacts,
}: {
  deals: CrmDeal[];
  contacts: CrmContact[];
}) {
  const [open, setOpen] = useState(false);
  const closed = deals.filter((d) => d.status !== "open");

  if (closed.length === 0) return null;

  function contactName(contactId?: string) {
    if (!contactId) return null;
    const c = contacts.find((x) => x.id === contactId);
    return c ? contactDisplayName(c) : null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-foreground">
          Closed deals
          <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted">
            {closed.length}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <ul className="divide-y divide-border border-t border-border">
          {closed.map((deal) => (
            <li key={deal.id}>
              <Link
                href={`/crm/deals/${deal.id}`}
                className="flex flex-col gap-1 px-4 py-3 text-sm transition-colors hover:bg-surface-muted sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{deal.title}</p>
                  {contactName(deal.contactId) ? (
                    <p className="text-xs text-muted">
                      {contactName(deal.contactId)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums text-gold">
                    {formatCrmMoney(deal.value, deal.currency)}
                  </p>
                  <p
                    className={
                      deal.status === "won"
                        ? "text-xs capitalize text-accent-cyan"
                        : "text-xs capitalize text-danger"
                    }
                  >
                    {deal.status}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
