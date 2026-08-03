# Aarvanta AI OS — AI Orchestrator

Cross-module command gateway: classify intent, attach context, plan, confirm, execute via the right runtime.

**Status:** Phase 0 (spec). Extends [`src/lib/ai-team/`](../../src/lib/ai-team/) (`intent`, `plan`, `orchestrate`, `context-command`) and `/api/workforce/command`, `/api/ai-team/context-command`.

---

## 1. Target architecture

```
User prompt (Chat or Ask AI)
        ↓
   Intent router
        ├─ one-shot outcome → AI Team job (goals pipeline)
        ├─ relationship capture / CRM mutate → CRM capture / CRM APIs
        ├─ recurring process → Workflow plan/generate
        ├─ channel send → draft + Waiting for You
        ├─ HR / Finance / Knowledge / Build → module tools + context
        └─ unclear → clarify or custom AI Team job
        ↓
   Plan card (Here’s what I’ll do…)
        ↓
   Confirm → execute
```

---

## 2. Routing hints (v1 heuristics)

| Signals | Route |
|---------|-------|
| follow up / recover / proposal / hire / reports | AI Team goal objectives |
| I met / add contact / from {Company} | CRM capture |
| whenever / every time / after N days / automate | Workflow plan |
| summarize this customer / blocking this deal | Context-command → CRM-scoped job |
| send WhatsApp / email now | Draft + approval (workflow or job step) |
| invoice / P&L / overdue | Finance-grounded custom job |
| according to our docs / policy | Knowledge-grounded answer or job |

---

## 3. Shared contracts

| Contract | Shape |
|----------|-------|
| Plan DTO | title, summary, steps[], specialists[], needsApproval, goalInput or workflowDraft |
| Context | `{ module, entityType?, entityId?, prompt }` |
| Approval | approved \| rejected \| modified |

Do not invent parallel plan formats per module — extend AI Team `HumanPlan` or define a thin `OsPlan` union.

---

## 4. APIs

| Endpoint | Role |
|----------|------|
| `POST /api/workforce/command` | AI Team plan/execute (exists) |
| `POST /api/ai-team/context-command` | Contextual plan/execute (exists) |
| Future `POST /api/ai-os/command` | Optional umbrella router calling the above + workflow plan |

Phase 1–2 of modules may keep calling specialized endpoints; umbrella route is a convenience, not a blocker.

---

## 5. Non-goals

- Replacing module engines (CRM stores, workflow execute, channel deliverers)
- LLM-only routing without deterministic fallbacks in demo mode
