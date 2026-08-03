import type { CrmContact, CrmDeal, CrmTask } from "@/types/crm";
import { contactDisplayName } from "@/types/crm";

export type BriefingLine = {
  text: string;
  href: string;
};

/** Heuristic AI Sales Dashboard narrative for CRM Phase 1. */
export function buildCrmBriefing(input: {
  contacts: CrmContact[];
  openDeals: CrmDeal[];
  openTasks: CrmTask[];
}): BriefingLine[] {
  const { contacts, openDeals, openTasks } = input;
  const lines: BriefingLine[] = [];

  const likelyClose = openDeals
    .filter((d) => d.probability >= 60)
    .sort((a, b) => b.probability - a.probability || b.value - a.value);
  if (likelyClose.length > 0) {
    const top = likelyClose.slice(0, 3);
    const n = likelyClose.length;
    lines.push({
      text:
        n === 1
          ? `One deal is likely to close: ${top[0].title} (£${top[0].value.toLocaleString()}).`
          : `${Math.min(n, 3)} deals are likely to close` +
            (n > 3 ? ` (${n} total at ≥60% probability)` : "") +
            `, led by ${top[0].title}.`,
      href: `/crm/deals/${top[0].id}`,
    });
  }

  const atRisk = contacts.filter(
    (c) =>
      c.tags.includes("customer") &&
      (c.leadScore == null || c.leadScore < 40) &&
      c.purchaseTotal > 0
  );
  if (atRisk.length > 0) {
    lines.push({
      text:
        atRisk.length === 1
          ? `One customer may be at risk: ${contactDisplayName(atRisk[0])}.`
          : `${atRisk.length} customers look at risk — start with ${contactDisplayName(atRisk[0])}.`,
      href: `/crm/contacts/${atRisk[0].id}`,
    });
  }

  const needsFollowUp = openDeals
    .filter((d) => d.probability < 60)
    .sort((a, b) => b.value - a.value);
  const overdueTasks = openTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).getTime() < Date.now()
  );
  if (needsFollowUp.length > 0) {
    const deal = needsFollowUp[0];
    lines.push({
      text: `One opportunity worth £${deal.value.toLocaleString()} needs follow-up: ${deal.title}.`,
      href: `/crm/deals/${deal.id}`,
    });
  } else if (overdueTasks.length > 0) {
    lines.push({
      text: `${overdueTasks.length} open task${overdueTasks.length === 1 ? "" : "s"} overdue — ${overdueTasks[0].title}.`,
      href: "/crm/activity",
    });
  }

  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70);
  if (hotLeads.length > 0 && lines.length < 3) {
    lines.push({
      text: `${hotLeads.length} hot lead${hotLeads.length === 1 ? "" : "s"} need attention — ${contactDisplayName(hotLeads[0])} leads the pack.`,
      href: `/crm/people?facet=leads`,
    });
  }

  if (lines.length === 0) {
    lines.push({
      text: "You're clear for now — add people or open a deal to get AI briefings.",
      href: "/crm/people",
    });
  }

  return lines.slice(0, 4);
}
