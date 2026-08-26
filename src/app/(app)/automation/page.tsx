import { AiTeamChatHome } from "@/components/workforce/ai-team-chat-home";
import { AutomationHome } from "@/components/automation/automation-home";
import { AutomationHistory } from "@/components/automation/automation-history";
import { AutomationNav } from "@/components/automation/automation-nav";
import { AutomationHeader } from "@/components/automation/automation-shell";
import {
  AUTOMATION_PRESET_IDS,
  LEGACY_WORKFLOW_TEMPLATES,
} from "@/lib/data/workflow-demo-seed";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getWorkforceExecutionsStore } from "@/lib/data/workforce-pipeline-store";
import { listPendingApprovals } from "@/lib/workforce/pipeline/approvals";
import { ensureAutomationPresets } from "@/lib/workflow/ensure-presets";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function AutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const scope = await getTenantScope();
  const tab = view === "ask" ? "ask" : view === "runs" ? "runs" : "presets";

  if (tab === "ask") {
    const [executions, pending] = await Promise.all([
      getWorkforceExecutionsStore().list(scope),
      listPendingApprovals(scope),
    ]);
    const today = startOfTodayIso();
    const activeStatuses = new Set([
      "created",
      "planning",
      "collecting_context",
      "executing",
      "awaiting_approval",
    ]);
    const activeJobs = executions.filter((e) =>
      activeStatuses.has(e.status)
    ).length;
    const completedToday = executions.filter(
      (e) =>
        e.status === "completed" && e.completedAt && e.completedAt >= today
    ).length;

    return (
      <>
        <AutomationHeader
          title="Do this once"
          subtitle="Tell us what you need. We’ll show a plan before we start."
        />
        <AutomationNav active="ask" />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
          <AiTeamChatHome
            counts={{
              pendingApprovals: pending.length,
              activeJobs,
              completedToday,
            }}
          />
        </div>
      </>
    );
  }

  const [workflows, contacts] = await Promise.all([
    ensureAutomationPresets(scope),
    getCrmRepository().listContacts(scope),
  ]);

  if (tab === "runs") {
    return (
      <>
        <AutomationHeader
          title="History"
          subtitle="Emails sent, calls booked, tasks created."
        />
        <AutomationNav active="runs" />
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <AutomationHistory />
          </div>
        </div>
      </>
    );
  }

  const presetSet = new Set<string>(AUTOMATION_PRESET_IDS);
  const presets = AUTOMATION_PRESET_IDS.map((id) =>
    workflows.find((w) => w.templateId === id)
  ).filter((w): w is (typeof workflows)[number] => Boolean(w));
  const extras = workflows.filter(
    (w) => !w.templateId || !presetSet.has(w.templateId)
  );

  return (
    <>
      <AutomationHeader
        title="Your automations"
        subtitle="Ask us to do something now, or switch on the ones that should keep going by themselves."
      />
      <AutomationNav active="presets" />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <AutomationHome
          presets={presets}
          extras={extras}
          legacyTemplates={LEGACY_WORKFLOW_TEMPLATES}
          contacts={contacts.map((c) => ({
            id: c.id,
            name: contactDisplayName(c),
            leadScore: c.leadScore,
          }))}
        />
      </div>
    </>
  );
}

export const metadata = { title: "Automation" };
