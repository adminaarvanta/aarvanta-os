import { getCrmRepository } from "@/lib/data/crm-store";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import type { TenantScope } from "@/types/communication";

export type LaunchpadItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  done: boolean;
};

export type LaunchpadSnapshot = {
  items: LaunchpadItem[];
  doneCount: number;
  percent: number;
};

export async function buildLaunchpadSnapshot(
  scope: TenantScope
): Promise<LaunchpadSnapshot> {
  const [
    contacts,
    documents,
    builds,
    workflows,
    runs,
    members,
    invitations,
  ] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getKnowledgeRepository().listDocuments(scope),
    getSiteBuildRepository().list(scope),
    getWorkflowRepository().listWorkflows(scope),
    getWorkforceRepository().listRuns(scope, { limit: 5 }),
    getTenantRepository().listMembers(scope),
    getTenantRepository().listInvitations(scope),
  ]);

  const items: LaunchpadItem[] = [
    {
      id: "crm",
      title: "Add your first lead or contact",
      description: "Start the CRM with one real person — not sample data.",
      href: "/crm/leads",
      done: contacts.length > 0,
    },
    {
      id: "workforce",
      title: "Meet your AI Team",
      description: "Open AI Team and assign a first task in under a minute.",
      href: "/workforce",
      done: runs.length > 0,
    },
    {
      id: "knowledge",
      title: "Add a Knowledge Hub document",
      description: "Give AI Team something real to work from — a SOP, FAQ, or offer.",
      href: "/knowledge",
      done: documents.length > 0,
    },
    {
      id: "build",
      title: "Draft your website",
      description: "Free includes one Build OS draft. Generate it when you are ready.",
      href: "/build",
      done: builds.length > 0,
    },
    {
      id: "workflows",
      title: "Create an automation",
      description: "Turn a follow-up or handoff into a repeatable workflow.",
      href: "/workflows",
      done: workflows.length > 0,
    },
    {
      id: "invite",
      title: "Invite a teammate",
      description: "Share the workspace with someone who will use it with you.",
      href: "/team?tab=manage",
      done: members.length > 1 || invitations.length > 0,
    },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return { items, doneCount, percent };
}
