import { crmNow, crmNewId } from "@/lib/data/crm-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { getFinanceStore, getWikiStore } from "@/lib/data/platform-store";
import { getProjectRepository } from "@/lib/data/project-store";
import { getStorePageRepository } from "@/lib/data/store-page-store";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { WORKFLOW_TEMPLATES } from "@/lib/data/workflow-demo-seed";
import { ensureSalesPipeline } from "@/lib/demo/crm-bootstrap";
import { provisionUkFinanceStack } from "@/lib/finance/provision-uk-finance";
import { publishDomainEvent } from "@/lib/events/publish";
import { systemActor } from "@/lib/identity/from-session";
import { ingestKnowledgeText } from "@/lib/knowledge/ingest";
import { generateHrDocument } from "@/lib/hr/generate-document";
import { buildStorePageContent } from "@/lib/launch/store-content";
import { setWorkspaceSettings } from "@/lib/settings/workspace-settings";
import type { TenantScope } from "@/types/communication";
import type {
  LaunchDeploymentArtifact,
  LaunchDeploymentResult,
  LaunchSession,
} from "@/types/launch";

export async function deployLaunchSession(
  session: LaunchSession,
  scope: TenantScope
): Promise<LaunchDeploymentResult> {
  let workingSession = session;
  const artifacts: LaunchDeploymentArtifact[] = [];
  const plan = workingSession.provisioning;
  const commercial = workingSession.commercial;
  const brand = workingSession.brandName ?? "New Business";

  if (commercial?.branding.logoDataUrl) {
    artifacts.push({
      kind: "logo",
      id: "brand-logo",
      label: `${brand} logo`,
    });
  }

  if (commercial?.selectedDomain) {
    artifacts.push({
      kind: "domain",
      id: commercial.selectedDomain,
      label: `Domain: ${commercial.selectedDomain}`,
    });
  }

  if (plan?.crmPipeline) {
    const pipeline = await ensureSalesPipeline(scope);
    artifacts.push({
      kind: "pipeline",
      id: pipeline.id,
      label: `${pipeline.name} pipeline`,
      href: "/crm/pipelines",
    });
  }

  if (plan?.workflows?.length) {
    const workflowRepo = getWorkflowRepository();
    const existing = await workflowRepo.listWorkflows(scope);
    const existingTemplates = new Set(existing.map((w) => w.templateId).filter(Boolean));

    for (const templateId of plan.workflows) {
      if (existingTemplates.has(templateId)) continue;
      const template = WORKFLOW_TEMPLATES.find((t) => t.templateId === templateId);
      if (!template) continue;

      const workflow = await workflowRepo.createWorkflow(
        {
          name: template.name,
          description: template.description,
          enabled: template.enabled,
          templateId: template.templateId,
          trigger: template.trigger,
          steps: template.steps,
          tags: template.tags,
        },
        scope
      );
      artifacts.push({
        kind: "workflow",
        id: workflow.id,
        label: workflow.name,
        href: `/workflows/${workflow.id}`,
      });
    }
  }

  if (plan?.financeChartOfAccounts && (plan.workspaceCountry === "UK" || plan.workspaceCountry === "GB")) {
    const financeResult = await provisionUkFinanceStack(scope, {
      brandName: brand,
      businessIdea: workingSession.intent.businessIdea,
    });
    artifacts.push({
      kind: "finance",
      id: "chart-of-accounts",
      label: `UK chart of accounts (${financeResult.accounts.length} accounts)`,
      href: "/finance",
    });
    if (financeResult.starterInvoiceId) {
      artifacts.push({
        kind: "finance",
        id: financeResult.starterInvoiceId,
        label: "Starter invoice (draft)",
        href: "/finance",
      });
    }
  } else if (plan?.financeBudget) {
    const finance = getFinanceStore();
    const budgets = await finance.listBudgets(scope);
    if (!budgets.some((b) => b.department === "Launch Operations")) {
      const budget = await finance.createBudget({
        ...scope,
        department: "Launch Operations",
        allocated: workingSession.intent.scale === "enterprise" ? 250000 : 50000,
        spent: 0,
        currency: workingSession.intent.countryBase === "UK" ? "GBP" : "USD",
        period: new Date().getFullYear().toString(),
      });
      artifacts.push({
        kind: "budget",
        id: budget.id,
        label: `${budget.department} budget`,
        href: "/finance",
      });
    }
  }

  if (plan?.storePage && commercial) {
    const storePage = buildStorePageContent({
      brandName: brand,
      tagline: commercial.branding.tagline,
      intent: workingSession.intent,
      industryProfileId: workingSession.industry?.industryProfileId ?? "retail_ecommerce",
      slug: commercial.storeSlug,
      logoDataUrl: commercial.branding.logoDataUrl,
      primaryColor: commercial.branding.primaryColor,
      accentColor: commercial.branding.accentColor,
      launchSessionId: workingSession.id,
      scope,
    });
    await getStorePageRepository().save(storePage);
    artifacts.push({
      kind: "store",
      id: storePage.id,
      label: `Live store: ${brand}`,
      href: `/store/${storePage.slug}`,
    });
  }

  if (plan?.legalDocs && commercial?.legalDocs.length) {
    const knowledge = getKnowledgeRepository();
    const legalDocs = [...commercial.legalDocs];

    for (let i = 0; i < legalDocs.length; i++) {
      const doc = legalDocs[i]!;
      const ingested = await ingestKnowledgeText(knowledge, scope, {
        title: doc.title,
        fileName: `${doc.type}.md`,
        fileType: "txt",
        fileSize: doc.content.length,
        text: doc.content,
      });
      legalDocs[i] = { ...doc, knowledgeDocumentId: ingested.id };
      artifacts.push({
        kind: "legal",
        id: ingested.id,
        label: doc.title,
        href: `/knowledge/${ingested.id}`,
      });
    }

    workingSession = { ...workingSession, commercial: { ...commercial, legalDocs } };
  }

  if (plan?.hrHandbook) {
    const handbookContent = await generateHrDocument({
      type: "policy_memo",
      title: `${brand} — Employee Handbook (Starter)`,
      subjectName: "All Employees",
      instructions: `Starter handbook for a ${workingSession.industry?.primaryIndustry ?? "small"} business: ${workingSession.intent.businessIdea}`,
      contextFields: {
        country: workingSession.intent.countryBase,
        industry: workingSession.industry?.primaryIndustry ?? "general",
      },
      companyName: brand,
    });

    const wiki = getWikiStore();
    const page = await wiki.create({
      ...scope,
      title: `${brand} — Employee Handbook`,
      section: "handbook",
      content: handbookContent,
      version: 1,
      accessRole: "all",
      updatedAt: crmNow(),
    });
    artifacts.push({
      kind: "hr",
      id: page.id,
      label: "Employee handbook (starter)",
      href: "/wiki",
    });
  }

  if (plan?.projectKickoff) {
    const projects = getProjectRepository();
    const project = await projects.createProject(
      {
        name: `${brand} — Launch`,
        description: `Kickoff project generated by Launch OS for: ${workingSession.intent.businessIdea}`,
        status: "active",
        tags: ["launch-os", workingSession.industry?.industryProfileId ?? "general"],
      },
      scope
    );
    artifacts.push({
      kind: "project",
      id: project.id,
      label: project.name,
      href: `/projects/${project.id}`,
    });
  }

  if (plan) {
    await setWorkspaceSettings(scope.workspaceId, {
      industryProfileId: plan.workspaceIndustry,
      countryCode: plan.workspaceCountry,
      businessName: brand,
      storeSlug: commercial?.storeSlug,
      logoUrl: commercial?.branding.logoDataUrl,
      primaryDomain: commercial?.selectedDomain,
    });
    artifacts.push({
      kind: "workspace",
      id: scope.workspaceId,
      label: `Workspace configured for ${plan.workspaceIndustry}`,
      href: "/settings",
    });
  }

  for (const buddy of workingSession.buddies ?? []) {
    artifacts.push({
      kind: "buddy",
      id: buddy.buddyId,
      label: buddy.name,
      href: "/workforce",
    });
  }

  const crm = getCrmRepository();
  const domainSlug = commercial?.selectedDomain?.split(".")[0] ?? brand.toLowerCase().replace(/\s+/g, "");
  const company = await crm.createCompany(
    {
      name: brand,
      industry: workingSession.industry?.primaryIndustry,
      domain: commercial?.selectedDomain ?? `${domainSlug}.co.uk`,
      website: commercial?.storeSlug ? `/store/${commercial.storeSlug}` : undefined,
      tags: ["prospect"],
    },
    scope
  );
  artifacts.push({
    kind: "pipeline",
    id: company.id,
    label: `${company.name} company record`,
    href: `/crm/companies/${company.id}`,
  });

  await publishDomainEvent({
    scope,
    type: "launch.deployed",
    actor: systemActor(),
    entityType: "launch_session",
    entityId: workingSession.id,
    payload: {
      brandName: brand,
      industry: workingSession.industry?.industryProfileId,
      storeSlug: commercial?.storeSlug,
      artifactCount: artifacts.length,
    },
    source: "system",
  });

  const now = crmNow();
  const updated: LaunchSession = {
    ...workingSession,
    status: "deployed",
    artifacts,
    deployedAt: now,
    updatedAt: now,
  };

  return { session: updated, artifacts };
}

export function newLaunchId(): string {
  return crmNewId("launch");
}
