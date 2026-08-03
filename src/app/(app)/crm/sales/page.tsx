import { AskAiButton } from "@/components/ai-team/ask-ai-button";
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

export default async function SalesPage({
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                Sales
              </h2>
              <p className="text-xs text-muted sm:text-sm">
                Opportunities and pipelines — create one to get started.
              </p>
            </div>
            <AskAiButton module="crm" />
          </div>
        </header>
        <CrmNav />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 sm:p-6">
          <div className="flex flex-wrap items-start gap-2">
            <CreatePipelineForm />
            <CrmImportForm entity="pipelines" />
            <CrmImportForm entity="deals" />
          </div>
          <p className="text-sm text-muted">
            No sales pipelines yet. Add one or import a template.
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Sales
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Opportunities, stages, and owners — Ask AI what’s stuck.
            </p>
          </div>
          <AskAiButton module="crm" />
        </div>
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
            redirectTo="/crm/sales"
          />
          <CrmImportForm entity="pipelines" />
          <CrmImportForm entity="deals" />
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max flex-wrap gap-2 sm:min-w-0">
            {pipelines.map((p) => (
              <a
                key={p.id}
                href={`/crm/sales?pipeline=${p.id}`}
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

export const metadata = { title: "Sales" };
