#!/usr/bin/env node
/**
 * Push WhatsApp env vars to Vercel (Production).
 * Requires: VERCEL_TOKEN from https://vercel.com/account/tokens
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node --env-file=.env.local scripts/push-vercel-whatsapp-env.mjs
 */
const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("Set VERCEL_TOKEN (https://vercel.com/account/tokens)");
  process.exit(1);
}

const project = process.env.VERCEL_PROJECT_NAME ?? "aarvanta-os";
const team = process.env.VERCEL_TEAM_ID ?? "";

const vars = [
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "NEXT_PUBLIC_APP_URL",
  "APP_MODE",
];

async function upsertEnv(name, value) {
  const listUrl = team
    ? `https://api.vercel.com/v10/projects/${project}/env?teamId=${team}`
    : `https://api.vercel.com/v10/projects/${project}/env`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) {
    throw new Error(`List env failed (${listRes.status}): ${await listRes.text()}`);
  }

  const { envs } = await listRes.json();
  const existing = envs?.find(
    (e) => e.key === name && e.target?.includes("production")
  );

  const body = {
    key: name,
    value,
    type: "encrypted",
    target: ["production", "preview"],
  };

  if (existing) {
    const patchUrl = team
      ? `https://api.vercel.com/v9/projects/${project}/env/${existing.id}?teamId=${team}`
      : `https://api.vercel.com/v9/projects/${project}/env/${existing.id}`;
    const res = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`Patch ${name} failed: ${await res.text()}`);
    console.log(`Updated ${name}`);
    return;
  }

  const createUrl = team
    ? `https://api.vercel.com/v10/projects/${project}/env?teamId=${team}`
    : `https://api.vercel.com/v10/projects/${project}/env`;
  const res = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Create ${name} failed: ${await res.text()}`);
  console.log(`Created ${name}`);
}

for (const name of vars) {
  const value = process.env[name];
  if (!value) {
    console.warn(`Skip ${name} — not set in environment`);
    continue;
  }
  await upsertEnv(name, value);
}

console.log("\nDone. Redeploy production for changes to take effect:");
console.log("  vercel --prod   OR   Vercel dashboard → Deployments → Redeploy");
