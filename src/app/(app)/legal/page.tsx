import { Scale } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getLegalStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function LegalPage() {
  const scope = await getTenantScope();
  const contracts = await getLegalStore().list(scope);

  const highRisk = contracts.filter((c) => c.riskScore >= 70).length;
  const inReview = contracts.filter((c) => c.status === "review" || c.status === "draft").length;

  return (
    <ModulePageShell
      icon={Scale}
      title="Legal OS"
      description="Contract templates, clause risk analysis, and compliance tracking."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Contracts", value: contracts.length, sub: "In repository" },
            { label: "High risk", value: highRisk, sub: "Score ≥ 70" },
            { label: "In review", value: inReview, sub: "Draft or review" },
            {
              label: "Templates",
              value: 5,
              sub: "NDA, MSA, employment, supplier, custom",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Contracts</h3>
          <CardList
            items={contracts.map((contract) => ({
              id: contract.id,
              title: contract.title,
              body: `${contract.counterparty} · Risk ${contract.riskScore}/100`,
              meta: contract.riskSummary.slice(0, 80),
              badge: contract.status,
            }))}
          />
        </section>

        <section className="rounded-xl border border-[#3d3528] bg-[#141414] p-4 text-xs text-[#A89878]">
          <p className="font-medium text-[#F5E6C8]">Business Action API</p>
          <p className="mt-1">
            Use <code className="text-[#D4AF37]">analyze_contract</code> or{" "}
            <code className="text-[#D4AF37]">generate_contract</code> intents via{" "}
            <code className="text-[#D4AF37]">/api/v1/action/execute</code> for programmatic access.
          </p>
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Legal" };
