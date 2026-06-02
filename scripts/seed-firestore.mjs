/**
 * Seed or repair a test conversation in Firestore.
 * Usage: node --env-file=.env.local scripts/seed-firestore.mjs
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
const docId = `conv_${Date.now()}`;

const conversation = {
  id: docId,
  tenantId: process.env.TENANT_ID,
  workspaceId: process.env.WORKSPACE_ID,
  companyId: process.env.COMPANY_ID,
  contact: {
    id: "contact_1",
    name: "Sarah Mitchell",
    phone: "+447700900123",
    email: "sarah@example.com",
  },
  channels: ["whatsapp", "email"],
  tags: ["hot_lead", "follow_up"],
  sentiment: "positive",
  aiSummary: "Test conversation seeded for Module 1 inbox.",
  aiSummaryUpdatedAt: now,
  unreadCount: 1,
  lastActivityAt: now,
  createdAt: now,
  updatedAt: now,
  timeline: [
    {
      id: "evt_1",
      type: "message",
      direction: "inbound",
      channel: "whatsapp",
      content: "Hi — we need a unified inbox. Can you help?",
      occurredAt: now,
    },
  ],
};

await db.collection("conversations").doc(docId).set(conversation);
console.log("Seeded conversation:", docId);
console.log("Open: http://localhost:3000/inbox/" + docId);
