import { Kanban } from "lucide-react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { ClosedDealsList } from "@/components/crm/closed-deals-list";
import { CreateDealForm } from "@/components/crm/create-deal-form";
import { CreatePipelineForm } from "@/components/crm/create-pipeline-form";
import { CrmImportForm } from "@/components/crm/crm-import-form";
import {
  CrmEmptyState,
  CrmFacet,
  CrmShell,
  CrmToolbar,
} from "@/components/crm/crm-shell";
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
      <CrmShell
        title="Sales"
        description="Opportunities and pipelines — create one to get started."
        actions={<AskAiButton module="crm" />}
        wide
      >
        <CrmToolbar>
          <CreatePipelineForm />
          <CrmImportForm entity="pipelines" />
          <CrmImportForm entity="deals" />
        </CrmToolbar>
        <CrmEmptyState
          icon={Kanban}
          title="No sales pipelines yet"
          description="Add a pipeline or import a template to start tracking deals by stage."
        />
      </CrmShell>
    );
  }

  const pipelineDeals = deals.filter((d) => d.pipelineId === activePipeline.id);

  return (
    <CrmShell
      title="Sales"
      description="Opportunities, stages, and owners — Ask AI what’s stuck."
      actions={<AskAiButton module="crm" />}
      wide
    >
      <CrmToolbar>
        {pipelines.map((p) => (
          <CrmFacet
            key={p.id}
            href={`/crm/sales?pipeline=${p.id}`}
            active={p.id === activePipeline.id}
          >
            {p.name}
          </CrmFacet>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
        <CreateDealForm
          pipeline={activePipeline}
          contacts={contacts}
          members={memberOptions}
        />
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
      </CrmToolbar>

      <PipelineBoard
        pipeline={activePipeline}
        deals={pipelineDeals}
        contacts={contacts}
        members={memberOptions}
        currentUserId={ctx.userId}
      />
      <ClosedDealsList deals={pipelineDeals} contacts={contacts} />
    </CrmShell>
  );
}

export const metadata = { title: "Sales" };
