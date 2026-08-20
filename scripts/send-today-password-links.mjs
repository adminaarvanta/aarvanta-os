/**
 * List people who joined today (Asia/Kolkata) and optionally email set-password links.
 * Usage:
 *   node --env-file=.env.local scripts/send-today-password-links.mjs --list
 *   node --env-file=.env.local scripts/send-today-password-links.mjs --send
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";

const SEND = process.argv.includes("--send");
const TZ = "Asia/Kolkata";

function todayRangeIso() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  const day = `${y}-${m}-${d}`;
  const start = new Date(`${day}T00:00:00+05:30`);
  const end = new Date(`${day}T23:59:59.999+05:30`);
  return { day, startIso: start.toISOString(), endIso: end.toISOString() };
}

function inRange(iso, startIso, endIso) {
  if (!iso) return false;
  return iso >= startIso && iso <= endIso;
}

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://os.aarvanta.co").replace(
    /\/$/,
    ""
  );
}

function mailbox() {
  return "admin@aarvanta.co";
}

function gmailTransport() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim()
    ?.replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");
  if (!user || !pass) throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD missing");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
  });
}

async function sendMail({ to, subject, text, html }) {
  const transport = gmailTransport();
  await transport.sendMail({
    from: process.env.EMAIL_FROM?.trim() || mailbox(),
    to,
    subject,
    text,
    html,
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
const { day, startIso, endIso } = todayRangeIso();

async function listCreatedToday(collection, field) {
  try {
    const snap = await db
      .collection(collection)
      .where(field, ">=", startIso)
      .where(field, "<=", endIso)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error(`query failed ${collection}.${field}:`, error.message || error);
    return [];
  }
}

const membersTodayRaw = await listCreatedToday("tenant_members", "joinedAt");
const orgsTodayRaw = await listCreatedToday("tenant_organizations", "createdAt");
const invitesTodayRaw = await listCreatedToday("tenant_invitations", "createdAt");
const affiliatesTodayRaw = await listCreatedToday("affiliates", "createdAt");

async function hasPassword(email) {
  if (!email) return false;
  try {
    const snap = await db.collection("user_credentials").doc(email).get();
    if (!snap.exists) return false;
    const data = snap.data() || {};
    return Boolean(data.passwordHash && data.passwordSalt);
  } catch {
    return false;
  }
}

const membersToday = [];
for (const m of membersTodayRaw) {
  const email = String(m.email || "").toLowerCase();
  membersToday.push({
    kind: "member",
    email,
    name: m.name || "",
    role: m.role,
    tenantId: m.tenantId,
    joinedAt: m.joinedAt,
    authProvider: m.authProvider || null,
    hasPassword: await hasPassword(email),
  });
}

const orgsToday = orgsTodayRaw.map((o) => ({
  id: o.id,
  name: o.name,
  plan: o.plan,
  createdAt: o.createdAt,
}));

const invitesToday = invitesTodayRaw.map((i) => ({
  kind: "invite",
  email: String(i.email || "").toLowerCase(),
  status: i.status,
  token: i.token,
  role: i.role,
  tenantId: i.tenantId,
  createdAt: i.createdAt,
  expiresAt: i.expiresAt,
}));

const affiliatesToday = [];
for (const a of affiliatesTodayRaw) {
  const email = String(a.profile?.email || "").toLowerCase();
  affiliatesToday.push({
    kind: "affiliate",
    id: a.id,
    email,
    name: a.profile?.name || "",
    status: a.status,
    createdAt: a.createdAt,
    activationToken: a.activationToken || null,
    passwordSetAt: a.passwordSetAt || null,
    hasPassword: await hasPassword(email),
  });
}

console.log(
  JSON.stringify(
    {
      day,
      timezone: TZ,
      range: { startIso, endIso },
      orgsToday,
      membersToday,
      invitesToday: invitesToday.map(({ token, ...rest }) => ({
        ...rest,
        hasToken: Boolean(token),
      })),
      affiliatesToday: affiliatesToday.map(({ activationToken, ...rest }) => ({
        ...rest,
        hasActivationToken: Boolean(activationToken),
      })),
    },
    null,
    2
  )
);

if (!SEND) {
  console.log("\nDry run only. Re-run with --send to email set-password links.");
  process.exit(0);
}

const results = [];

for (const invite of invitesToday) {
  if (invite.status !== "pending" || !invite.token) continue;
  const url = `${appBaseUrl()}/invite/${invite.token}`;
  try {
    await sendMail({
      to: invite.email,
      subject: "Set your Aarvanta OS password",
      text: `Hi,\n\nYou joined Aarvanta OS today. Create your password here:\n${url}\n\nIf you did not expect this, ignore this email.\n`,
      html: `<p>Hi,</p><p>You joined Aarvanta OS today. Create your password here:</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
    });
    results.push({ email: invite.email, kind: "invite", sent: true, url });
  } catch (error) {
    results.push({
      email: invite.email,
      kind: "invite",
      sent: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

for (const affiliate of affiliatesToday) {
  if (affiliate.hasPassword || affiliate.passwordSetAt) continue;
  if (!affiliate.activationToken) {
    results.push({
      email: affiliate.email,
      kind: "affiliate",
      sent: false,
      error: "no_activation_token",
    });
    continue;
  }
  const url = `${appBaseUrl()}/affiliate/activate/${encodeURIComponent(affiliate.activationToken)}`;
  try {
    await sendMail({
      to: affiliate.email,
      subject: "Create your Aarvanta partner password",
      text: `Hi ${affiliate.name.split(/\s+/)[0] || "there"},\n\nCreate a password to access Aarvanta:\n${url}\n`,
      html: `<p>Hi ${escapeHtml(affiliate.name.split(/\s+/)[0] || "there")},</p><p>Create a password to access Aarvanta:</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
    });
    results.push({ email: affiliate.email, kind: "affiliate", sent: true, url });
  } catch (error) {
    results.push({
      email: affiliate.email,
      kind: "affiliate",
      sent: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const emailed = new Set(results.map((r) => r.email));
for (const member of membersToday) {
  if (!member.email || member.hasPassword) continue;
  if (member.authProvider === "google") continue;
  if (emailed.has(member.email)) continue;
  results.push({
    email: member.email,
    kind: "member",
    sent: false,
    error: "no_set_password_token_for_this_account",
  });
}

console.log("\nSEND_RESULTS");
console.log(JSON.stringify(results, null, 2));
