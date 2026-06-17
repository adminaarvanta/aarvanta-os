/**
 * Delete all CRM and AI Workforce records for the tenant scope in Firestore.
 *
 * Usage: node --env-file=.env.local scripts/reset-crm-workforce.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const COLLECTIONS = [
  "crm_contacts",
  "crm_companies",
  "crm_pipelines",
  "crm_deals",
  "crm_tasks",
  "crm_activities",
  "ai_agent_runs",
  "ai_agent_memory",
  "ai_agent_chat",
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
  "ai_digests",
  "ai_shared_memory",
  "ai_agent_collaborations",
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

let total = 0;
for (const collection of COLLECTIONS) {
  total += await deleteScoped(collection);
}

console.log(`\nCRM + AI Workforce reset complete (${total} document(s) removed).`);
console.log("New CRM records will appear when inbound conversations qualify via AI.");
