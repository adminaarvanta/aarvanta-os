/**
 * Remove all inbox threads for the tenant scope and seed one email conversation
 * between admin@aarvanta.co and sidhakverma.mgf@gmail.com.
 *
 * Usage: node --env-file=.env.local scripts/reset-inbox-email.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const AGENT_EMAIL =
  process.env.AUTH_EMAIL?.trim() || "admin@aarvanta.co";
const CONTACT_EMAIL = "sidhakverma.mgf@gmail.com";
const CONTACT_NAME = "Sidhak Verma";

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

const scope = { tenantId, workspaceId, companyId };

const snap = await db
  .collection("conversations")
  .where("tenantId", "==", tenantId)
  .where("workspaceId", "==", workspaceId)
  .where("companyId", "==", companyId)
  .get();

let deleted = 0;
const batchSize = 400;
let batch = db.batch();

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

console.log(`Deleted ${deleted} conversation(s) for tenant ${tenantId}.`);

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

const docId = "conv_email_aarvanta_sidhak";

const conversation = {
  id: docId,
  ...scope,
  contact: {
    id: "contact_sidhak",
    name: CONTACT_NAME,
    email: CONTACT_EMAIL,
  },
  channels: ["email"],
  tags: ["follow_up"],
  sentiment: "neutral",
  aiSummary:
    "Email thread between Aarvanta (admin@aarvanta.co) and Sidhak Verma for inbox testing.",
  aiSummaryUpdatedAt: now,
  unreadCount: 0,
  lastActivityAt: now,
  assignedTo: AGENT_EMAIL.split("@")[0],
  createdAt: twoDaysAgo,
  updatedAt: now,
  timeline: [
    {
      id: "evt_email_1",
      type: "email",
      direction: "inbound",
      subject: "Aarvanta OS — inbox test",
      bodyPreview:
        "Hi team, I'd like to test the unified inbox email channel between my Gmail and admin@aarvanta.co.",
      occurredAt: twoDaysAgo,
      authorName: CONTACT_NAME,
    },
    {
      id: "evt_email_2",
      type: "email",
      direction: "outbound",
      subject: "Re: Aarvanta OS — inbox test",
      bodyPreview:
        "Hi Sidhak — reply received. You can continue this thread via email or from the Aarvanta inbox.",
      occurredAt: yesterday,
      authorName: "Aarvanta",
    },
    {
      id: "evt_email_3",
      type: "email",
      direction: "inbound",
      subject: "Re: Aarvanta OS — inbox test",
      bodyPreview: "Thanks — please confirm replies from sidhakverma.mgf@gmail.com are working.",
      occurredAt: now,
      authorName: CONTACT_NAME,
    },
  ],
};

await db.collection("conversations").doc(docId).set(conversation);

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

console.log("\nSeeded email thread:");
console.log("  Agent:", AGENT_EMAIL);
console.log("  Contact:", CONTACT_EMAIL);
console.log("  Conversation:", docId);
console.log("  Open:", `${appUrl}/inbox/${docId}`);
