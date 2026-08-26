import { WorkflowRunView } from "@/components/workflow/workflow-run-view";

export default async function WorkflowRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkflowRunView runId={id} />;
}

export const metadata = { title: "What happened" };
