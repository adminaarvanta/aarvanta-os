"use client";

import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { labelForHrDocumentType } from "@/lib/hr/document-types";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import { StatusPill } from "@/components/ui/os/status-pill";
import type { HrCase } from "@/types/hr-case";

export function HrApprovalQueue({
  pending,
  recentSent,
}: {
  pending: HrCase[];
  recentSent: HrCase[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel padding="none">
        <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
          <SectionHeader
            title="Pending approvals"
            description="High-risk documents awaiting HR review"
            className="mb-0"
          />
        </div>
        {pending.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted sm:px-5">
            No documents waiting for approval.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {pending.map((item) => (
              <li key={item.id} className="px-4 py-3 sm:px-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.subjectName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.proposedDocumentType
                        ? labelForHrDocumentType(item.proposedDocumentType)
                        : item.proposedAction.replace(/_/g, " ")}
                    </p>
                  </div>
                  <StatusPill variant="warning">Review</StatusPill>
                </div>
                <Link
                  href={`/inbox/${item.conversationId}`}
                  className="mt-2 inline-block text-xs font-medium text-gold hover:text-gold-bright"
                >
                  Open conversation →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel padding="none">
        <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
          <SectionHeader
            title="Recently auto-handled"
            description="Support replies and low-risk documents sent by AI"
            className="mb-0"
          />
        </div>
        {recentSent.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted sm:px-5">
            Auto-sent cases will appear here after inbox triage runs.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {recentSent.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{item.subjectName}</p>
                  <p className="text-xs text-muted">
                    {item.proposedDocumentType
                      ? labelForHrDocumentType(item.proposedDocumentType)
                      : "Support reply"}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-[#4DA6FF]">
                  <Check className="h-3 w-3" />
                  Sent
                </span>
              </li>
            ))}
          </ul>
        )}
        {recentSent.length > 0 && (
          <p className="flex items-center gap-1.5 border-t border-border-subtle px-4 py-2 text-[10px] text-dim sm:px-5">
            <Clock className="h-3 w-3" />
            Full audit trail in Platform → Events
          </p>
        )}
      </Panel>
    </div>
  );
}
