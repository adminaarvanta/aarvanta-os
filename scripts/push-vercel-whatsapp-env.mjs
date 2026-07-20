#!/usr/bin/env node
/**
 * @deprecated Use scripts/push-vercel-channels-env.mjs
 * Kept for backwards compatibility.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const result = spawnSync(
  process.execPath,
  [join(dir, "push-vercel-channels-env.mjs")],
  { stdio: "inherit", env: process.env }
);
process.exit(result.status ?? 1);
