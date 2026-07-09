/**
 * Reset all tenant-scoped production data in Firestore.
 * Keeps workspace_settings (re-seeded to defaults on next login).
 *
 * Usage: node --env-file=.env.local scripts/reset-production-firestore.mjs
 * Add --confirm to execute (required).
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const COLLECTIONS = [
  "conversations",
  "webhook_events",
  "domain_events",
  "launch_sessions",
  "generated_store_pages",
  "workspace_settings",
  "crm_contacts",
  "crm_companies",
  "crm_pipelines",
  "crm_deals",
  "crm_tasks",
  "crm_activities",
  "ai_agent_runs",
  "ai_agent_memory",
  "ai_agent_chat",
  "ai_agent_collaborations",
  "ai_shared_memory",
  "ai_digests",
  "knowledge_documents",
  "knowledge_chunks",
  "projects",
  "project_tasks",
  "workflows",
  "workflow_runs",
  "founder_chat",
  "tenant_organizations",
  "tenant_workspaces",
  "tenant_members",
  "tenant_invitations",
  "team_notes",
  "team_comments",
  "team_activity",
  "integrations",
  "app_notifications",
  "billing_subscriptions",
  "billing_usage_records",
  "writing_drafts",
  "meeting_records",
  "knowledge_graph_nodes",
  "knowledge_graph_edges",
  "sop_documents",
  "proposal_documents",
  "portal_access",
  "templates_library",
  "memory_layers",
  "customer_health",
  "wiki_pages",
  "governance_audit_logs",
  "finance_invoices",
  "finance_expenses",
  "finance_budgets",
  "finance_chart_of_accounts",
  "finance_journal_entries",
  "payroll_runs",
  "payroll_payslips",
  "legal_contracts",
  "hr_candidates",
  "hr_employees",
  "hr_courses",
  "hr_documents",
  "hr_cases",
  "autonomous_tasks",
  "sso_connections",
  "franchise_locations",
  "tenant_regions",
  "marketplace_installed_agents",
];

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const tenantId = process.env.TENANT_ID;
const workspaceId = process.env.WORKSPACE_ID;
const companyId = process.env.COMPANY_ID;

if (!tenantId || !workspaceId || !companyId) {
  console.error("Missing TENANT_ID, WORKSPACE_ID, or COMPANY_ID in env.");
  process.exit(1);
}

if (!process.argv.includes("--confirm")) {
  console.error(
    "Dry run only. Re-run with --confirm to delete all scoped Firestore data:\n" +
      "  node --env-file=.env.local scripts/reset-production-firestore.mjs --confirm"
  );
  process.exit(1);
}

async function deleteScoped(collectionName) {
  const snap = await db
    .collection(collectionName)
    .where("tenantId", "==", tenantId)
    .where("workspaceId", "==", workspaceId)
    .where("companyId", "==", companyId)
    .get();

  if (snap.empty) {
    console.log(`${collectionName}: 0 documents`);
    return 0;
  }

  let deleted = 0;
  let batch = db.batch();
  const batchSize = 400;

  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    deleted += 1;
    if (deleted % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  if (deleted % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`${collectionName}: deleted ${deleted} document(s)`);
  return deleted;
}

/** Conversations and webhook_events use different scoping. */
async function deleteConversations() {
  const snap = await db
    .collection("conversations")
    .where("tenantId", "==", tenantId)
    .where("workspaceId", "==", workspaceId)
    .get();

  if (snap.empty) {
    console.log("conversations: 0 documents");
    return 0;
  }

  let deleted = 0;
  let batch = db.batch();
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    deleted += 1;
    if (deleted % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (deleted % 400 !== 0) await batch.commit();
  console.log(`conversations: deleted ${deleted} document(s)`);
  return deleted;
}

async function deleteWebhookEvents() {
  const snap = await db.collection("webhook_events").get();
  if (snap.empty) {
    console.log("webhook_events: 0 documents");
    return 0;
  }
  let deleted = 0;
  let batch = db.batch();
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    deleted += 1;
    if (deleted % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (deleted % 400 !== 0) await batch.commit();
  console.log(`webhook_events: deleted ${deleted} document(s)`);
  return deleted;
}

async function deleteWorkspaceSettings() {
  const snap = await db
    .collection("workspace_settings")
    .where("workspaceId", "==", workspaceId)
    .get();
  if (snap.empty) {
    console.log("workspace_settings: 0 documents");
    return 0;
  }
  let deleted = 0;
  for (const doc of snap.docs) {
    await doc.ref.delete();
    deleted += 1;
  }
  console.log(`workspace_settings: deleted ${deleted} document(s)`);
  return deleted;
}

let total = 0;
total += await deleteConversations();
total += await deleteWebhookEvents();
total += await deleteWorkspaceSettings();

for (const collection of COLLECTIONS) {
  if (
    collection === "conversations" ||
    collection === "webhook_events" ||
    collection === "workspace_settings"
  ) {
    continue;
  }
  total += await deleteScoped(collection);
}

console.log(`\nProduction Firestore reset complete (${total} document(s) removed).`);
console.log("Sign in again to bootstrap tenant records and default workspace settings.");
