# Aarvanta AI OS — Backend Architecture

One Next.js app; module stores; event-friendly orchestration. No big-bang rewrite.

**Status:** Phase 0 (spec). Runtime: Next.js 16 Turbopack app — UI + API routes in-process ([`AGENTS.md`](../../AGENTS.md)).

---

## 1. Principles

| Principle | Choice |
|-----------|--------|
| Process | Single app serves UI + `/api/*` |
| Tenancy | `TenantScope` on persisted records |
| Demo vs prod | Demo in-memory / seed; prod Firebase-backed stores |
| Orchestration | Lib modules (`ai-team`, `workforce/pipeline`, `workflow/execute`) called from route handlers |
| Events | Domain events where already used (e.g. workforce); expand carefully |
| Secrets / channels | Existing WhatsApp, voice, email deliverers — approval in front |

---

## 2. Layering

```
Route handlers (auth + zod)
    → ai-team / crm / workflow services
        → stores (memory | firestore resilient repos)
            → optional channel / AI providers
```

---

## 3. Auth & billing

- `getSessionContext()` / `getTenantScope()` on app APIs
- Feature gates via plan catalog (`aiWorkforce`, `crm`, workflows, etc.)
- Credit consume on costly AI paths where already wired

---

## 4. Evolution rules

1. Prefer DTOs and new routes over new collections  
2. Stable existing `/api/workforce/*`, CRM, `/api/workflows/*`  
3. Durable workflow delays / job queues = explicit Phase 4+ work  
4. Knowledge + Finance grounding already starting in workforce context — deepen, don’t fork  

---

## 5. Non-goals

- Microservices split
- Separate “AI OS” deployable
- Replacing Firebase with a new DB in this program
