import { HrApprovalQueue } from "@/components/hr/hr-approval-queue";
import { HrAutomationToggle } from "@/components/hr/hr-automation-toggle";
import { HrDocumentAgent } from "@/components/hr/hr-document-agent";
import { HrPageHeader } from "@/components/hr/hr-nav";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getHrWorkspaceSettings } from "@/lib/hr/settings";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrDocumentsPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hr = getHrStore();
  const [employees, candidates, documents, cases, settings] = await Promise.all([
    hr.listEmployees(scope),
    hr.list(scope),
    hr.listDocuments(scope),
    hr.listCases(scope),
    getHrWorkspaceSettings(scope.workspaceId),
  ]);
  const pending = cases.filter((item) => item.status === "pending_approval");
  const recentSent = cases
    .filter((item) => item.status === "sent")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Documents"
        description="Generate HR letters and manage inbox automation approvals."
      />
      <HrAutomationToggle initialEnabled={settings.inboxAutomationEnabled} />
      <HrApprovalQueue pending={pending} recentSent={recentSent} />
      <HrDocumentAgent
        employees={employees}
        candidates={candidates}
        initialDocuments={documents}
      />
    </div>
  );
}
