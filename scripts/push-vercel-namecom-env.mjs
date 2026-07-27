#!/usr/bin/env node
/**
 * Push name.com reseller env vars to Vercel (Production + Preview) for aarvanta-os.
 *
 * Requires a token with access to team "AARVANTA's projects":
 *   https://vercel.com/account/tokens
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node --env-file=.env.local scripts/push-vercel-namecom-env.mjs
 *
 * Optional:
 *   VERCEL_PROJECT_NAME=aarvanta-os
 *   VERCEL_TEAM_ID=team_PmScxyEJbJlvgkG3LuRJHoB5
 */
const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error("Set VERCEL_TOKEN (https://vercel.com/account/tokens) for the AARVANTA team");
  process.exit(1);
}

const project = process.env.VERCEL_PROJECT_NAME ?? "aarvanta-os";
const team = process.env.VERCEL_TEAM_ID ?? "team_PmScxyEJbJlvgkG3LuRJHoB5";

const vars = {
  NAMECOM_USERNAME: process.env.NAMECOM_USERNAME?.trim(),
  NAMECOM_API_TOKEN: process.env.NAMECOM_API_TOKEN?.trim(),
  NAMECOM_API_TOKEN_DEV: process.env.NAMECOM_API_TOKEN_DEV?.trim(),
  NAMECOM_ENV: process.env.NAMECOM_ENV?.trim() || "live",
  DOMAIN_RETAIL_MARKUP_PCT: process.env.DOMAIN_RETAIL_MARKUP_PCT?.trim() || "25",
  DOMAIN_USD_TO_GBP_RATE: process.env.DOMAIN_USD_TO_GBP_RATE?.trim() || "0.79",
  DOMAIN_CONTACT_FIRST: process.env.DOMAIN_CONTACT_FIRST?.trim() || "Domain",
  DOMAIN_CONTACT_LAST: process.env.DOMAIN_CONTACT_LAST?.trim() || "Admin",
  DOMAIN_CONTACT_ORG:
    process.env.DOMAIN_CONTACT_ORG?.trim() ||
    process.env.ORGANIZATION_NAME?.trim() ||
    "Aarvanta Limited",
  DOMAIN_CONTACT_EMAIL:
    process.env.DOMAIN_CONTACT_EMAIL?.trim() ||
    process.env.NAMECOM_USERNAME?.trim() ||
    "domains@aarvanta.co",
  DOMAIN_CONTACT_PHONE: process.env.DOMAIN_CONTACT_PHONE?.trim() || "+44.2000000000",
  DOMAIN_CONTACT_ADDRESS1:
    process.env.DOMAIN_CONTACT_ADDRESS1?.trim() || "1 Example Street",
  DOMAIN_CONTACT_CITY: process.env.DOMAIN_CONTACT_CITY?.trim() || "London",
  DOMAIN_CONTACT_STATE: process.env.DOMAIN_CONTACT_STATE?.trim() || "England",
  DOMAIN_CONTACT_POSTAL: process.env.DOMAIN_CONTACT_POSTAL?.trim() || "EC1A 1BB",
  DOMAIN_CONTACT_COUNTRY: process.env.DOMAIN_CONTACT_COUNTRY?.trim() || "GB",
};

if (!vars.NAMECOM_USERNAME || !vars.NAMECOM_API_TOKEN) {
  console.error("NAMECOM_USERNAME and NAMECOM_API_TOKEN required in env / .env.local");
  process.exit(1);
}

/** @type {Record<string, string>} */
const toPush = {};
for (const [k, v] of Object.entries(vars)) {
  if (v) toPush[k] = v;
}

async function upsertEnv(name, value) {
  const listUrl = `https://api.vercel.com/v10/projects/${project}/env?teamId=${team}`;
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

  if (existing) {
    const patchUrl = `https://api.vercel.com/v9/projects/${project}/env/${existing.id}?teamId=${team}`;
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

  const res = await fetch(listUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: name,
      value,
      type: "encrypted",
      target: ["production", "preview"],
    }),
  });
  if (!res.ok) throw new Error(`Create ${name} failed: ${await res.text()}`);
  console.log(`Created ${name}`);
}

for (const [name, value] of Object.entries(toPush)) {
  await upsertEnv(name, value);
}

console.log("\nDone. Redeploy production from the Vercel dashboard (Redeploy), then verify:");
console.log("  curl -s https://os.aarvanta.co/api/health | jq '.readiness.items[] | select(.id|test(\"namecom|opensrs|domain\"))'");
