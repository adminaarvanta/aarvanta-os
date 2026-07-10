import { FileText } from "lucide-react";
import { ProposalsClient } from "@/components/platform/proposals-client";
import { ProposalsList } from "@/components/platform/proposals-list";
import { ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getProposalStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function ProposalsPage() {
  const scope = await getTenantScope();
  const proposals = await getProposalStore().list(scope);

  const totalValue = proposals.reduce((sum, proposal) => sum + proposal.value, 0);

  return (
    <ModulePageShell
      icon={FileText}
      title="Proposals"
      description="Build and track client proposals from draft through acceptance."
    >
      <div className="space-y-8">
        <ProposalsClient />

        <StatGrid
          items={[
            { label: "Proposals", value: proposals.length, sub: "All records" },
            {
              label: "Sent",
              value: proposals.filter((proposal) => proposal.status === "sent").length,
              sub: "Awaiting decision",
            },
            {
              label: "Accepted",
              value: proposals.filter((proposal) => proposal.status === "accepted").length,
              sub: "Won proposals",
            },
            {
              label: "Pipeline value",
              value: formatCurrency(totalValue, "GBP"),
              sub: "Aggregate proposal value",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Proposal list</h3>
          <ProposalsList proposals={proposals} />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Proposals" };
