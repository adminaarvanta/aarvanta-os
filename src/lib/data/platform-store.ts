import { useMemoryDatastore } from "@/lib/data/datastore";
import {
  BILLING_PLANS,
  MARKETPLACE_AGENTS,
  REGION_CONFIGS,
  buildDemoAuditLogEntries,
  buildDemoAutonomousTasks,
  buildDemoCustomerHealthRecords,
  buildDemoFinanceBudgets,
  buildDemoFinanceExpenses,
  buildDemoFinanceInvoices,
  buildDemoFranchiseLocations,
  buildDemoHrCandidates,
  buildDemoHrCourses,
  buildDemoHrEmployees,
  buildDemoInstalledAgents,
  buildDemoKnowledgeGraphEdges,
  buildDemoKnowledgeGraphNodes,
  buildDemoMeetingRecords,
  buildDemoMemoryLayerEntries,
  buildDemoPortalAccessRecords,
  buildDemoProposalDocuments,
  buildDemoSopDocuments,
  buildDemoSsoConnections,
  buildDemoSubscriptions,
  buildDemoTemplateItems,
  buildDemoTenantRegions,
  buildDemoUsageRecords,
  buildDemoWikiPages,
  buildDemoWritingDrafts,
} from "@/lib/data/platform-demo-seed";
import { crmNow } from "@/lib/data/crm-helpers";
import { createScopedRepository } from "@/lib/data/scoped-store";
import type { TenantScope } from "@/types/communication";
import type {
  AuditLogEntry,
  AutonomousTask,
  CustomerHealth,
  FinanceBudget,
  FinanceExpense,
  FinanceInvoice,
  FranchiseLocation,
  HrCandidate,
  HrCourse,
  HrEmployee,
  InstalledAgent,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  MeetingRecord,
  MemoryLayerEntry,
  PortalAccess,
  ProposalDocument,
  SopDocument,
  SsoConnection,
  Subscription,
  TemplateItem,
  TenantRegion,
  UsageRecord,
  WikiPage,
  WritingDraft,
} from "@/types/platform-modules";

type MaybePromise<T> = T | Promise<T>;
type ScopedEntity = TenantScope & { id: string };
type CreateInput<T extends ScopedEntity> = Omit<T, "id"> &
  Partial<Pick<T, "id">>;

type ScopedCrudStore<T extends ScopedEntity> = {
  list(scope: TenantScope): MaybePromise<T[]>;
  get(id: string, scope: TenantScope): MaybePromise<T | null>;
  create(item: CreateInput<T>): MaybePromise<T>;
  set(item: T): MaybePromise<T>;
  remove(id: string, scope: TenantScope): MaybePromise<boolean>;
};

function createCrudStore<T extends ScopedEntity>(
  repository: ReturnType<typeof createScopedRepository<T>>,
  idPrefix: string
): ScopedCrudStore<T> {
  const activeStore = () =>
    useMemoryDatastore() ? repository.memory : repository.firestore;

  return {
    list(scope) {
      return activeStore().list(scope);
    },
    get(id, scope) {
      return activeStore().get(id, scope);
    },
    create(item) {
      return activeStore().create(item, idPrefix);
    },
    set(item) {
      return activeStore().set(item);
    },
    remove(id, scope) {
      return activeStore().remove(id, scope);
    },
  };
}

const billingSubscriptionRepository = createScopedRepository<Subscription>(
  "billing_subscriptions",
  buildDemoSubscriptions
);
const billingUsageRepository = createScopedRepository<UsageRecord>(
  "billing_usage_records",
  buildDemoUsageRecords
);
const writingRepository = createScopedRepository<WritingDraft>(
  "writing_drafts",
  buildDemoWritingDrafts
);
const meetingsRepository = createScopedRepository<MeetingRecord>(
  "meeting_records",
  buildDemoMeetingRecords
);
const knowledgeNodeRepository = createScopedRepository<KnowledgeGraphNode>(
  "knowledge_graph_nodes",
  buildDemoKnowledgeGraphNodes
);
const knowledgeEdgeRepository = createScopedRepository<KnowledgeGraphEdge>(
  "knowledge_graph_edges",
  buildDemoKnowledgeGraphEdges
);
const sopRepository = createScopedRepository<SopDocument>(
  "sop_documents",
  buildDemoSopDocuments
);
const proposalRepository = createScopedRepository<ProposalDocument>(
  "proposal_documents",
  buildDemoProposalDocuments
);
const portalRepository = createScopedRepository<PortalAccess>(
  "portal_access",
  buildDemoPortalAccessRecords
);
const templatesRepository = createScopedRepository<TemplateItem>(
  "templates_library",
  buildDemoTemplateItems
);
const memoryLayersRepository = createScopedRepository<MemoryLayerEntry>(
  "memory_layers",
  buildDemoMemoryLayerEntries
);
const customerHealthRepository = createScopedRepository<CustomerHealth>(
  "customer_health",
  buildDemoCustomerHealthRecords
);
const wikiRepository = createScopedRepository<WikiPage>(
  "wiki_pages",
  buildDemoWikiPages
);
const governanceRepository = createScopedRepository<AuditLogEntry>(
  "governance_audit_logs",
  buildDemoAuditLogEntries
);
const financeInvoiceRepository = createScopedRepository<FinanceInvoice>(
  "finance_invoices",
  buildDemoFinanceInvoices
);
const financeExpenseRepository = createScopedRepository<FinanceExpense>(
  "finance_expenses",
  buildDemoFinanceExpenses
);
const financeBudgetRepository = createScopedRepository<FinanceBudget>(
  "finance_budgets",
  buildDemoFinanceBudgets
);
const hrCandidateRepository = createScopedRepository<HrCandidate>(
  "hr_candidates",
  buildDemoHrCandidates
);
const hrEmployeeRepository = createScopedRepository<HrEmployee>(
  "hr_employees",
  buildDemoHrEmployees
);
const hrCourseRepository = createScopedRepository<HrCourse>(
  "hr_courses",
  buildDemoHrCourses
);
const autonomousRepository = createScopedRepository<AutonomousTask>(
  "autonomous_tasks",
  buildDemoAutonomousTasks
);
const ssoRepository = createScopedRepository<SsoConnection>(
  "sso_connections",
  buildDemoSsoConnections
);
const franchiseRepository = createScopedRepository<FranchiseLocation>(
  "franchise_locations",
  buildDemoFranchiseLocations
);
const tenantRegionsRepository = createScopedRepository<TenantRegion>(
  "tenant_regions",
  buildDemoTenantRegions
);
const installedAgentsRepository = createScopedRepository<InstalledAgent>(
  "marketplace_installed_agents",
  buildDemoInstalledAgents
);

const billingSubscriptionsStore = createCrudStore(
  billingSubscriptionRepository,
  "sub"
);
const billingUsageStore = createCrudStore(billingUsageRepository, "usage");
const writingStore = createCrudStore(writingRepository, "draft");
const meetingsStore = createCrudStore(meetingsRepository, "meeting");
const knowledgeNodesStore = createCrudStore(knowledgeNodeRepository, "kg_node");
const knowledgeEdgesStore = createCrudStore(knowledgeEdgeRepository, "kg_edge");
const sopStore = createCrudStore(sopRepository, "sop");
const proposalStore = createCrudStore(proposalRepository, "proposal");
const portalStore = createCrudStore(portalRepository, "portal");
const templatesStore = createCrudStore(templatesRepository, "template");
const memoryLayersStore = createCrudStore(memoryLayersRepository, "memory");
const customerHealthStore = createCrudStore(customerHealthRepository, "health");
const wikiStore = createCrudStore(wikiRepository, "wiki");
const governanceStore = createCrudStore(governanceRepository, "audit");
const financeInvoicesStore = createCrudStore(financeInvoiceRepository, "invoice");
const financeExpensesStore = createCrudStore(financeExpenseRepository, "expense");
const financeBudgetsStore = createCrudStore(financeBudgetRepository, "budget");
const hrCandidatesStore = createCrudStore(hrCandidateRepository, "candidate");
const hrEmployeesStore = createCrudStore(hrEmployeeRepository, "employee");
const hrCoursesStore = createCrudStore(hrCourseRepository, "course");
const autonomousStore = createCrudStore(autonomousRepository, "task");
const ssoStore = createCrudStore(ssoRepository, "sso");
const franchiseStore = createCrudStore(franchiseRepository, "franchise");
const tenantRegionsStore = createCrudStore(tenantRegionsRepository, "tenant_region");
const installedAgentsStore = createCrudStore(installedAgentsRepository, "installed");

export { BILLING_PLANS };

export function listRegions() {
  return REGION_CONFIGS;
}

export function listTenantRegions(scope: TenantScope) {
  return tenantRegionsStore.list(scope);
}

export function getBillingStore() {
  return {
    ...billingSubscriptionsStore,
    listUsage(scope: TenantScope) {
      return billingUsageStore.list(scope);
    },
    getUsage(id: string, scope: TenantScope) {
      return billingUsageStore.get(id, scope);
    },
    createUsage(item: CreateInput<UsageRecord>) {
      return billingUsageStore.create(item);
    },
    setUsage(item: UsageRecord) {
      return billingUsageStore.set(item);
    },
    removeUsage(id: string, scope: TenantScope) {
      return billingUsageStore.remove(id, scope);
    },
    listPlans() {
      return BILLING_PLANS;
    },
  };
}

export function getWritingStore() {
  return writingStore;
}

export function getMeetingsStore() {
  return meetingsStore;
}

export function getKnowledgeGraphStore() {
  return {
    ...knowledgeNodesStore,
    listNodes(scope: TenantScope) {
      return knowledgeNodesStore.list(scope);
    },
    listEdges(scope: TenantScope) {
      return knowledgeEdgesStore.list(scope);
    },
    getEdge(id: string, scope: TenantScope) {
      return knowledgeEdgesStore.get(id, scope);
    },
    createEdge(item: CreateInput<KnowledgeGraphEdge>) {
      return knowledgeEdgesStore.create(item);
    },
    setEdge(item: KnowledgeGraphEdge) {
      return knowledgeEdgesStore.set(item);
    },
    removeEdge(id: string, scope: TenantScope) {
      return knowledgeEdgesStore.remove(id, scope);
    },
  };
}

export function getSopStore() {
  return sopStore;
}

export function getProposalStore() {
  return proposalStore;
}

export function getPortalStore() {
  return portalStore;
}

export function getTemplatesStore() {
  return templatesStore;
}

export function getMemoryLayersStore() {
  return memoryLayersStore;
}

export function getCustomerSuccessStore() {
  return customerHealthStore;
}

export function getWikiStore() {
  return wikiStore;
}

export function getGovernanceStore() {
  return governanceStore;
}

export function getFinanceStore() {
  return {
    ...financeInvoicesStore,
    listExpenses(scope: TenantScope) {
      return financeExpensesStore.list(scope);
    },
    getExpense(id: string, scope: TenantScope) {
      return financeExpensesStore.get(id, scope);
    },
    createExpense(item: CreateInput<FinanceExpense>) {
      return financeExpensesStore.create(item);
    },
    setExpense(item: FinanceExpense) {
      return financeExpensesStore.set(item);
    },
    removeExpense(id: string, scope: TenantScope) {
      return financeExpensesStore.remove(id, scope);
    },
    listBudgets(scope: TenantScope) {
      return financeBudgetsStore.list(scope);
    },
    getBudget(id: string, scope: TenantScope) {
      return financeBudgetsStore.get(id, scope);
    },
    createBudget(item: CreateInput<FinanceBudget>) {
      return financeBudgetsStore.create(item);
    },
    setBudget(item: FinanceBudget) {
      return financeBudgetsStore.set(item);
    },
    removeBudget(id: string, scope: TenantScope) {
      return financeBudgetsStore.remove(id, scope);
    },
  };
}

export function getHrStore() {
  return {
    ...hrCandidatesStore,
    listEmployees(scope: TenantScope) {
      return hrEmployeesStore.list(scope);
    },
    getEmployee(id: string, scope: TenantScope) {
      return hrEmployeesStore.get(id, scope);
    },
    createEmployee(item: CreateInput<HrEmployee>) {
      return hrEmployeesStore.create(item);
    },
    setEmployee(item: HrEmployee) {
      return hrEmployeesStore.set(item);
    },
    removeEmployee(id: string, scope: TenantScope) {
      return hrEmployeesStore.remove(id, scope);
    },
    listCourses(scope: TenantScope) {
      return hrCoursesStore.list(scope);
    },
    getCourse(id: string, scope: TenantScope) {
      return hrCoursesStore.get(id, scope);
    },
    createCourse(item: CreateInput<HrCourse>) {
      return hrCoursesStore.create(item);
    },
    setCourse(item: HrCourse) {
      return hrCoursesStore.set(item);
    },
    removeCourse(id: string, scope: TenantScope) {
      return hrCoursesStore.remove(id, scope);
    },
  };
}

export function getAutonomousStore() {
  return autonomousStore;
}

export function getSsoStore() {
  return ssoStore;
}

export function getFranchiseStore() {
  return franchiseStore;
}

export function getMarketplaceStore() {
  return {
    ...installedAgentsStore,
    listMarketplaceAgents() {
      return MARKETPLACE_AGENTS;
    },
    getMarketplaceAgent(id: string) {
      return MARKETPLACE_AGENTS.find((agent) => agent.id === id) ?? null;
    },
  };
}

// Compatibility exports used by existing API routes.
export function listKnowledgeGraphNodes(scope: TenantScope) {
  return getKnowledgeGraphStore().listNodes(scope);
}

export function listKnowledgeGraphEdges(scope: TenantScope) {
  return getKnowledgeGraphStore().listEdges(scope);
}

export function listSopDocuments(scope: TenantScope) {
  return getSopStore().list(scope);
}

export function createSopDocument(
  input: Pick<SopDocument, "title" | "question"> & Partial<Pick<SopDocument, "content">>,
  scope: TenantScope
) {
  return getSopStore().create({
    ...scope,
    title: input.title,
    question: input.question,
    content: input.content ?? "",
    version: 1,
    status: "draft",
    createdAt: crmNow(),
    updatedAt: crmNow(),
  });
}

export function listProposalDocuments(scope: TenantScope) {
  return getProposalStore().list(scope);
}

export function createProposalDocument(
  input: Pick<ProposalDocument, "title" | "clientName"> &
    Partial<
      Pick<ProposalDocument, "value" | "currency" | "content" | "brandingOrg">
    >,
  scope: TenantScope
) {
  return getProposalStore().create({
    ...scope,
    title: input.title,
    clientName: input.clientName,
    value: input.value ?? 0,
    currency: input.currency ?? "GBP",
    content: input.content ?? "",
    brandingOrg: input.brandingOrg ?? "Aarvanta Limited",
    status: "draft",
    createdAt: crmNow(),
  });
}

export function listPortalAccess(scope: TenantScope) {
  return getPortalStore().list(scope);
}

export function listTemplateItems(scope: TenantScope) {
  return getTemplatesStore().list(scope);
}

export function listMemoryLayerEntries(
  scope: TenantScope,
  layer?: MemoryLayerEntry["layer"]
) {
  const store = getMemoryLayersStore();
  if (!layer) return store.list(scope);
  return Promise.resolve(store.list(scope)).then((entries) =>
    entries.filter((entry) => entry.layer === layer)
  );
}

export function listCustomerHealth(scope: TenantScope) {
  return getCustomerSuccessStore().list(scope);
}

export function listWikiPages(scope: TenantScope) {
  return getWikiStore().list(scope);
}

export function listAuditLogEntries(scope: TenantScope) {
  return getGovernanceStore().list(scope);
}

export function listFinanceInvoices(scope: TenantScope) {
  return getFinanceStore().list(scope);
}

export function listFinanceExpenses(scope: TenantScope) {
  return getFinanceStore().listExpenses(scope);
}

export function listFinanceBudgets(scope: TenantScope) {
  return getFinanceStore().listBudgets(scope);
}

export function listHrCandidates(scope: TenantScope) {
  return getHrStore().list(scope);
}

export function listHrEmployees(scope: TenantScope) {
  return getHrStore().listEmployees(scope);
}

export function listHrCourses(scope: TenantScope) {
  return getHrStore().listCourses(scope);
}

export function listAutonomousTasks(scope: TenantScope) {
  return getAutonomousStore().list(scope);
}

export function createAutonomousTask(
  input: Pick<AutonomousTask, "agentType" | "goal" | "steps" | "requiresApproval">,
  scope: TenantScope
) {
  return getAutonomousStore().create({
    ...scope,
    ...input,
    status: "queued",
    createdAt: crmNow(),
  });
}

export function listSsoConnections(scope: TenantScope) {
  return getSsoStore().list(scope);
}

export function listFranchiseLocations(scope: TenantScope) {
  return getFranchiseStore().list(scope);
}

export function listMarketplaceCatalog() {
  return getMarketplaceStore().listMarketplaceAgents();
}

export function listInstalledAgents(scope: TenantScope) {
  return getMarketplaceStore().list(scope);
}

export async function installMarketplaceAgent(
  marketplaceId: string,
  scope: TenantScope
) {
  const catalogAgent =
    getMarketplaceStore().getMarketplaceAgent(marketplaceId) ?? null;
  if (!catalogAgent) {
    throw new Error("Marketplace agent not found");
  }

  return getMarketplaceStore().create({
    ...scope,
    marketplaceId: catalogAgent.id,
    name: catalogAgent.name,
    enabled: true,
    installedAt: crmNow(),
  });
}
