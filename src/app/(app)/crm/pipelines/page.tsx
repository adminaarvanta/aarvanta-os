import { CrmNav } from "@/components/crm/crm-nav";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function PipelinesPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const scope = await getTenantScope();
  const { pipeline: pipelineParam } = await searchParams;
  const repo = getCrmRepository();

  const [pipelines, deals, contacts] = await Promise.all([
    repo.listPipelines(scope),
    repo.listDeals(scope),
    repo.listContacts(scope),
  ]);

  const activePipeline =
    pipelines.find((p) => p.id === pipelineParam) ?? pipelines[0];

  if (!activePipeline) {
    return (
      <div className="p-8 text-sm text-[#A89878]">
        No pipelines configured. Run{" "}
        <code className="rounded bg-[#101010] px-1">npm run seed:crm</code>.
      </div>
    );
  }

  const pipelineDeals = deals.filter(
    (d) => d.pipelineId === activePipeline.id
  );

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">Pipelines</h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Opportunity tracking with forecast value — Sales, Support, Recruitment.
        </p>
      </header>
      <CrmNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 sm:p-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max flex-wrap gap-2 sm:min-w-0">
          {pipelines.map((p) => (
            <a
              key={p.id}
              href={`/crm/pipelines?pipeline=${p.id}`}
              className={
                p.id === activePipeline.id
                  ? "rounded-full bg-[#D4AF37] px-4 py-1.5 text-sm font-semibold text-black"
                  : "rounded-full border border-[#3d3528] bg-[#101010] px-4 py-1.5 text-sm text-[#A89878] hover:border-[#D4AF37]/40"
              }
            >
              {p.name}
            </a>
          ))}
          </div>
        </div>
        <PipelineBoard
          pipeline={activePipeline}
          deals={pipelineDeals}
          contacts={contacts}
        />
      </div>
    </>
  );
}

export const metadata = { title: "Pipelines" };
