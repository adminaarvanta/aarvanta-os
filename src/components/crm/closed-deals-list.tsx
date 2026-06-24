"use client";

import Link from "next/link";
import { useState } from "react";
import type { CrmDeal } from "@/types/crm";
import { contactDisplayName, type CrmContact } from "@/types/crm";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

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
    <section className="rounded-xl border border-[#3d3528] bg-[#101010]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-[#F5E6C8]">
          Closed deals ({closed.length})
        </span>
        <span className="text-xs text-[#A89878]">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <ul className="divide-y divide-[#3d3528] border-t border-[#3d3528]">
          {closed.map((deal) => (
            <li key={deal.id}>
              <Link
                href={`/crm/deals/${deal.id}`}
                className="flex flex-col gap-1 px-4 py-3 text-sm transition-colors hover:bg-[#141414] sm:flex-row sm:items-center sm:justify-between"
              >
              <div>
                <p className="font-medium text-[#F5E6C8]">{deal.title}</p>
                {contactName(deal.contactId) && (
                  <p className="text-xs text-[#A89878]">
                    {contactName(deal.contactId)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium text-[#D4AF37]">
                  {formatCurrency(deal.value, deal.currency)}
                </p>
                <p
                  className={
                    deal.status === "won"
                      ? "text-xs text-emerald-400"
                      : "text-xs text-red-400"
                  }
                >
                  {deal.status}
                </p>
              </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
