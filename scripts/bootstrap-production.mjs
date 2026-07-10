/**
 * Bootstrap an empty production Firestore workspace (tenant, CRM pipeline, HR, workflows).
 * Usage: node --env-file=.env.local scripts/bootstrap-production.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const required = [
  "APP_MODE",
  "AUTH_EMAIL",
  "TENANT_ID",
  "WORKSPACE_ID",
  "COMPANY_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error("Missing required env vars:", missing.join(", "));
  process.exit(1);
}

if (process.env.APP_MODE !== "production") {
  console.error("Set APP_MODE=production before running bootstrap.");
  process.exit(1);
}

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
const now = new Date().toISOString();
const scope = {
  tenantId: process.env.TENANT_ID,
  workspaceId: process.env.WORKSPACE_ID,
  companyId: process.env.COMPANY_ID,
};

function slugFromId(id) {
  return id.replace(/_/g, "-").slice(0, 48) || "workspace";
}

async function upsert(collection, id, data) {
  const ref = db.collection(collection).doc(id);
  const snap = await ref.get();
  if (snap.exists) {
    console.log(`  skip ${collection}/${id} (exists)`);
    return snap.data();
  }
  await ref.set(data);
  console.log(`  created ${collection}/${id}`);
  return data;
}

async function seedCrmPipeline() {
  const snap = await db
    .collection("crm_pipelines")
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .limit(1)
    .get();

  if (!snap.empty) {
    console.log("  skip crm_pipelines (exists)");
    return;
  }

  const pipeline = {
    ...scope,
    id: `pipe_${Date.now()}`,
    name: "Sales pipeline",
    stages: [
      { id: "lead", name: "Lead", order: 0 },
      { id: "qualified", name: "Qualified", order: 1 },
      { id: "proposal", name: "Proposal", order: 2 },
      { id: "won", name: "Won", order: 3 },
    ],
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("crm_pipelines").doc(pipeline.id).set(pipeline);
  console.log(`  created crm_pipelines/${pipeline.id}`);
}

console.log("Bootstrapping production workspace...");
console.log(`  tenant: ${scope.tenantId}`);
console.log(`  workspace: ${scope.workspaceId}`);

await upsert("organizations", scope.tenantId, {
  id: scope.tenantId,
  name: process.env.ORGANIZATION_NAME?.trim() || "Aarvanta OS",
  slug: slugFromId(scope.tenantId),
  plan: "growth",
  createdAt: now,
  updatedAt: now,
});

await upsert("workspaces", scope.workspaceId, {
  id: scope.workspaceId,
  tenantId: scope.tenantId,
  name: process.env.WORKSPACE_NAME?.trim() || "Main workspace",
  slug: slugFromId(scope.workspaceId),
  defaultCompanyId: scope.companyId,
  createdAt: now,
  updatedAt: now,
});

const userId = process.env.AUTH_USER_ID?.trim() || "user_prod";
const memberId = `${scope.workspaceId}_${userId}`;
await upsert("workspace_members", memberId, {
  id: memberId,
  tenantId: scope.tenantId,
  workspaceId: scope.workspaceId,
  companyId: scope.companyId,
  userId,
  email: process.env.AUTH_EMAIL,
  name: process.env.AUTH_NAME?.trim() || "Workspace owner",
  role: "owner",
  status: "active",
  joinedAt: now,
  createdAt: now,
  updatedAt: now,
});

await seedCrmPipeline();

console.log("Done. Sign in at /login and verify GET /api/health");
