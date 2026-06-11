/**
 * @deprecated Use scripts/reset-inbox-email.mjs — seeds admin ↔ sidhak thread only.
 * Usage: npm run seed:inbox-email
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "reset-inbox-email.mjs");
const result = spawnSync(process.execPath, ["--env-file=.env.local", script], {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
});
process.exit(result.status ?? 1);
