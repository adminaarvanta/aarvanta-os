<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Aarvanta OS Communication Hub is a single Next.js 16 (Turbopack) app — one process serves the UI and all API routes. See `README.md` for full docs; standard scripts live in `package.json`.

- **Run in demo mode (default).** Leave `APP_MODE` unset (do NOT copy `.env.example` verbatim — it ships `APP_MODE=production`, which requires Firebase + auth). Demo mode uses an in-memory store with seeded data, no login, simulated channels, and heuristic AI. Start with `npm run dev` and open `http://localhost:3000` (`/inbox`, `/chat`). Check `GET /api/health` to confirm `mode: demo`.
- **Build requires demo mode:** `APP_MODE=demo npm run build` (matches CI). `npm run lint` reports warnings only (0 errors expected).
- **Gotcha — in-memory store is NOT shared between RSC and route handlers in dev.** `src/lib/data/memory-repository.ts` holds a module-level singleton. In `next dev`, React Server Components and API route handlers load separate module instances, so a reply sent from the inbox UI persists in the route-handler store (and is logged by channel simulation) but will NOT appear in the server-rendered inbox timeline even after `router.refresh()`. The `/chat` widget reflects messages correctly because it reads/writes entirely via route-handler APIs. This divergence does not exist in production mode (Firestore-backed).
- **Production mode** (`APP_MODE=production`) requires `FIREBASE_*`, `AUTH_*`, and tenant env vars; not needed for local dev/testing.
