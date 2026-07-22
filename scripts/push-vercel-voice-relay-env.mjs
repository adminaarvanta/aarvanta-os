#!/usr/bin/env node
/**
 * Push Voice Relay env vars to Vercel (Production + Preview) for aarvanta-os.
 *
 * Requires a token with access to team "AARVANTA's projects":
 *   https://vercel.com/account/tokens
 *
 * Usage:
 *   VERCEL_TOKEN=xxx node --env-file=.env.local scripts/push-vercel-voice-relay-env.mjs
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
  VOICE_RELAY_WSS_URL:
    process.env.VOICE_RELAY_WSS_URL?.trim() ||
    "wss://orbit.aarvanta.co/voice-relay/ws",
  VOICE_RELAY_CALLBACK_SECRET: process.env.VOICE_RELAY_CALLBACK_SECRET?.trim(),
};

if (!vars.VOICE_RELAY_CALLBACK_SECRET) {
  console.error("VOICE_RELAY_CALLBACK_SECRET missing in env / .env.local");
  process.exit(1);
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

for (const [name, value] of Object.entries(vars)) {
  await upsertEnv(name, value);
}

console.log("\nDone. Redeploy production:");
console.log("  vercel --prod --scope aarvanta-s-projects");
console.log("  OR Vercel dashboard → Deployments → Redeploy");
console.log("\nThen verify:");
console.log("  curl -s https://os.aarvanta.co/api/health | jq .voiceRelay");
