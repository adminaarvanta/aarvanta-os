import { CrmNav } from "@/components/crm/crm-nav";
import { ClosedDealsList } from "@/components/crm/closed-deals-list";
import { CreateDealForm } from "@/components/crm/create-deal-form";
import { CreatePipelineForm } from "@/components/crm/create-pipeline-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
import { DeleteEntityButton } from "@/components/crm/delete-entity-button";
import { EditPipelineForm } from "@/components/crm/edit-pipeline-form";
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
      <>
        <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">Pipelines</h2>
          <p className="text-xs text-muted sm:text-sm">
            Create pipelines and deals manually, or import them from Excel.
          </p>
        </header>
        <CrmNav />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 sm:p-6">
          <div className="flex flex-wrap items-start gap-2">
            <CreatePipelineForm />
            <CrmImportForm entity="pipelines" />
            <CrmImportForm entity="deals" />
          </div>
          <p className="text-sm text-muted">
            No pipelines yet. Add one manually or import an Excel template.
          </p>
        </div>
      </>
    );
  }

  const pipelineDeals = deals.filter(
    (d) => d.pipelineId === activePipeline.id
  );

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">Pipelines</h2>
        <p className="text-xs text-muted sm:text-sm">
          Create deals, move stages, assign owners, and mark won/lost manually.
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 sm:p-6">
        <div className="flex flex-wrap items-start gap-2">
          <CreatePipelineForm />
          <EditPipelineForm pipeline={activePipeline} />
          <DeleteEntityButton
            entity="pipelines"
            id={activePipeline.id}
            label="pipeline"
            redirectTo="/crm/pipelines"
          />
          <CrmImportForm entity="pipelines" />
          <CrmImportForm entity="deals" />
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max flex-wrap gap-2 sm:min-w-0">
            {pipelines.map((p) => (
              <a
                key={p.id}
                href={`/crm/pipelines?pipeline=${p.id}`}
                className={
                  p.id === activePipeline.id
                    ? "rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-black"
                    : "rounded-full border border-border bg-surface-elevated px-4 py-1.5 text-sm text-muted hover:border-gold/40"
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
