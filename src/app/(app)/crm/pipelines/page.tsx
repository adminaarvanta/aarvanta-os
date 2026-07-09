import { Suspense } from "react";
import { CrmNav } from "@/components/crm/crm-nav";
import { ClosedDealsList } from "@/components/crm/closed-deals-list";
import { CreateDealForm } from "@/components/crm/create-deal-form";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";

export default async function PipelinesPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const ctx = await getSessionContext();
  const scope = ctx.scope;
  const { pipeline: pipelineParam } = await searchParams;
  const repo = getCrmRepository();

  const [pipelines, deals, contacts, members] = await Promise.all([
    repo.listPipelines(scope),
    repo.listDeals(scope),
    repo.listContacts(scope),
    getTenantRepository().listMembers(scope),
  ]);

  const memberOptions = activeMemberOptions(members);

  const activePipeline =
    pipelines.find((p) => p.id === pipelineParam) ?? pipelines[0];

  if (!activePipeline) {
    return (
      <div className="p-8 text-sm text-[#9AABC4]">
        No pipelines configured yet. Pipelines are created when you add deals from qualified leads.
      </div>
    );
  }

  const pipelineDeals = deals.filter(
    (d) => d.pipelineId === activePipeline.id
  );

  return (
    <>
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#FFFFFF] sm:text-xl">Pipelines</h2>
        <p className="text-xs text-[#9AABC4] sm:text-sm">
          Create deals, move stages, assign owners, and mark won/lost manually.
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max flex-wrap gap-2 sm:min-w-0">
          {pipelines.map((p) => (
            <a
              key={p.id}
              href={`/crm/pipelines?pipeline=${p.id}`}
              className={
                p.id === activePipeline.id
                  ? "rounded-full bg-[#B8965D] px-4 py-1.5 text-sm font-semibold text-black"
                  : "rounded-full border border-[#243656] bg-[#0D1524] px-4 py-1.5 text-sm text-[#9AABC4] hover:border-[#B8965D]/40"
              }
            >
              {p.name}
            </a>
          ))}
          </div>
        </div>
        <CreateDealForm
          pipeline={activePipeline}
          contacts={contacts}
          members={memberOptions}
        />
        <PipelineBoard
          pipeline={activePipeline}
          deals={pipelineDeals}
          contacts={contacts}
          members={memberOptions}
          currentUserId={ctx.userId}
        />
        <ClosedDealsList deals={pipelineDeals} contacts={contacts} />
      </div>
    </>
  );
}

export const metadata = { title: "Pipelines" };
