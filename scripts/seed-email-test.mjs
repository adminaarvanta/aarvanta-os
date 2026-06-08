/**
 * Seed an email test conversation for Resend (testing mode only sends to account email).
 * Usage: node --env-file=.env.local scripts/seed-email-test.mjs
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
const docId = `conv_email_${Date.now()}`;
const testEmail = process.env.AUTH_EMAIL ?? "admin@aarvanta.co";

const conversation = {
  id: docId,
  tenantId: process.env.TENANT_ID,
  workspaceId: process.env.WORKSPACE_ID,
  companyId: process.env.COMPANY_ID,
  contact: {
    id: "contact_email_test",
    name: "Aarvanta Admin (Email Test)",
    email: testEmail,
  },
  channels: ["email"],
  tags: ["follow_up"],
  sentiment: "neutral",
  unreadCount: 1,
  lastActivityAt: now,
  createdAt: now,
  updatedAt: now,
  timeline: [
    {
      id: "evt_email_1",
      type: "email",
      direction: "inbound",
      subject: "Test inbound email",
      bodyPreview: "Hi — testing Resend email channel on Aarvanta inbox.",
      occurredAt: now,
      authorName: testEmail,
    },
  ],
};

await db.collection("conversations").doc(docId).set(conversation);
console.log("Seeded email test conversation:", docId);
console.log("Contact email:", testEmail);
console.log("Open: http://localhost:3000/inbox/" + docId);
