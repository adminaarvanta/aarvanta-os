# AI Team v2 — Backend Runtime

How AI Team Jobs map onto the existing workforce pipeline runtime.

**Status:** Phase 0 (spec). Phase 1 keeps all `/api/workforce/*` contracts stable.

---

## 1. Presentation model

| User term | Runtime type | Store / API |
|-----------|--------------|-------------|
| Job | `WorkforceExecution` (+ nested `goal`) | executions store; `GET /api/workforce/executions` |
| Goal (internal) | `WorkforceGoal` | goals store; `POST/GET /api/workforce/goals` |
| Waiting item | `WorkforceApproval` | approvals; `GET /api/workforce/approvals` |
| Activity event | Derived from execution timeline / status + optional `AgentRun` | No new collection in Phase 1 |
| AI Employee | `AgentDefinition` + live status | `GET /api/workforce/agents/status` |

**Job is not a new persistence entity in Phase 1–2.** Optional thin DTO later if needed for API clarity.

---

## 2. Start job (Phase 1)

```
Client prompt / quick action
  → prompt-to-goal heuristic (client)
  → POST /api/workforce/goals { objective, customObjective?, instructions?, moduleHint?, … }
  → startGoalPipeline()
  → { goal, execution }
  → navigate /workforce/jobs/{execution.id}
```

Schema remains Zod `createGoalSchema` on the goals route. No free-text inference on the server in Phase 1.

---

## 3. Progress & specialists

Derived client-side from existing fields:

- Progress % from `plan.steps` statuses
- Specialists from `assignedAgents` / per-step `assignedAgentType`
- ETA from `estimatedMinutesMin` / `Max`

---

## 4. Approvals

- List pending: `GET /api/workforce/approvals`
- Resolve: `POST /api/workforce/executions/[id]/approve` with `approved` | `rejected` | `modified`
- UI surface: Waiting for You

---

## 5. Stable APIs (do not break)

Goals, executions, approvals, agents, runs, collaborate, upgrade, CRM task execute/process — all remain. Phase 2 may add `/api/ai-team/chat` or `/api/workforce/command` **alongside**, not as a replacement.

---

## 6. Later runtime (Phase 4)

- Inject Knowledge Hub into context (Voice OS pattern)
- Finance reads for CFO specialist
- Outbound WhatsApp/email/voice via channel deliverers **behind** approval
- Durable progress, retries, in-app notifications
