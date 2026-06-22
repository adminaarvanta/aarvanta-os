"use client";

import { Download } from "lucide-react";
import type { ProposalDocument } from "@/types/platform-modules";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProposalsList({
  proposals,
}: {
  proposals: ProposalDocument[];
}) {
  if (!proposals.length) {
    return <p className="text-sm text-[#A89878]">No proposals yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {proposals.map((proposal) => (
        <li
          key={proposal.id}
          className="rounded-xl border border-[#3d3528] bg-[#101010] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[#F5E6C8]">{proposal.title}</p>
              <p className="mt-1 text-sm text-[#A89878]">
                {proposal.clientName} ·{" "}
                {formatCurrency(proposal.value, proposal.currency)}
              </p>
              <p className="mt-1 text-[10px] text-[#A89878]/70">
                Created {new Date(proposal.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] text-[#F9E076] ring-1 ring-[#D4AF37]/30">
              {proposal.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`/api/proposals/${proposal.id}/export?format=pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-[#3d3528] px-2.5 py-1 text-xs text-[#F5E6C8] hover:border-[#D4AF37]/40"
            >
              <Download className="h-3 w-3" />
              Export PDF
            </a>
            <a
              href={`/api/proposals/${proposal.id}/export?format=docx`}
              className="inline-flex items-center gap-1 rounded-lg border border-[#3d3528] px-2.5 py-1 text-xs text-[#F5E6C8] hover:border-[#D4AF37]/40"
            >
              <Download className="h-3 w-3" />
              Export DOCX
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
