# AI Team v2 — Architecture & Orchestration

Gateway → intent → plan → approval → tools. Phase 1 does **not** introduce a new orchestrator; it sits on the existing workforce pipeline.

**Status:** Phase 0 (spec). Orchestration service lands in Phase 2.

---

## 1. Target architecture

```
User prompt / quick action
        │
        ▼
   Command gateway          (Phase 2: /api/ai-team/chat or /api/workforce/command)
        │
        ├─ Intent classifier → objective + suggested specialists
        ├─ Planner → human-readable “Here’s what I’ll do…”
        ├─ Confirm / Cancel (UI)
        └─ Execute → existing pipeline orchestrator
                │
                ├─ Goals / Executions / Approvals stores
                └─ Tools (CRM, channels, Knowledge, Finance — deepen Phase 4)
```

---

## 2. Phase mapping

| Phase | What ships |
|-------|------------|
| 1 | UX shell; client heuristic `prompt → goal payload`; `POST /api/workforce/goals` unchanged |
| 2 | `src/lib/ai-team/` intent + plan + orchestrate wrappers; plan card before execute |
| 3 | Contextual command with module/entity payload |
| 4 | Knowledge + Finance context; outbound send behind Waiting for You |

---

## 3. Reuse (do not rewrite)

| Capability | Location |
|------------|----------|
| Goal start + pipeline | `src/lib/workforce/pipeline/orchestrator.ts` |
| Plan templates | `src/lib/workforce/pipeline/task-planner.ts` |
| Approvals | `src/lib/workforce/pipeline/approvals.ts` |
| Context package | `src/lib/workforce/pipeline/context-builder.ts` |
| HTTP surface | `/api/workforce/*` |

Phase 1–2 keep Firestore / memory schemas for goals, executions, approvals intact. **Job** is a presentation name over `WorkforceExecution`.

---

## 4. Intent → objective (Phase 1 heuristic)

Closed enum today: `close_lead` | `follow_up` | `recover_customer` | `book_meeting` | `generate_proposal` | `custom`.

Free text uses a small keyword map; unmatched → `custom` + `customObjective` / `instructions`. Phase 2 replaces this with a real classifier that also suggests agents.

---

## 5. Approval gate

Any step with `requiresApproval` (discounts, refunds, outbound send in Phase 4) pauses the execution and appears under **Waiting for You**. Resolution: approved | rejected | modified → resume pipeline.

---

## 6. Non-goals

- Parallel rewrite of pipeline stores
- New Job persistence model until Phase 2+ needs a thin DTO (optional)
- Bypassing approval policy for channel sends
