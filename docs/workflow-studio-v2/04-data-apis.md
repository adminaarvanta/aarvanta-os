# Workflow Studio v2 — Data Model & APIs

Presentation over existing workflow types. No schema rewrite in Phases 1–2.

**Status:** Phase 0 (spec). Canonical types: [`src/types/workflow.ts`](src/types/workflow.ts).

---

## 1. Presentation map

| User term | Runtime |
|-----------|---------|
| Automation | `Workflow` |
| Plan (pre-save) | DTO: proposed `trigger` + `steps` + human summaries |
| Run | `WorkflowRun` |
| Timeline event | Presentation over `WorkflowStepLog` (+ optional side effects) |
| Approval | `pendingApproval` on run |

---

## 2. Existing model (keep)

- Triggers: `manual` \| `crm_lead_scored` \| `deal_updated` \| `schedule`
- Steps: `condition` \| `agent` \| `approval` \| `action` \| `delay`
- Actions: `create_task`, `create_activity`, `tag_contact`, `update_lead_score`, `move_deal_stage`, `send_whatsapp`, `send_email`, `book_meeting`, `draft_outreach`, …
- Run statuses: `running` \| `completed` \| `failed` \| `awaiting_approval`

---

## 3. Stable APIs (do not break)

| Route | Methods |
|-------|---------|
| `/api/workflows` | GET, POST |
| `/api/workflows/[id]` | GET, PATCH, DELETE |
| `/api/workflows/[id]/run` | POST |
| `/api/workflows/generate` | POST |
| `/api/workflows/runs` | GET |
| `/api/workflows/runs/[id]` | GET |
| `/api/workflows/runs/[id]/approve` | POST |

---

## 4. Evolved endpoints (phased)

| Phase | Endpoint | Role |
|-------|----------|------|
| 2 | `POST /api/workflows/plan` | NL → plan DTO without save (or extend generate with `dryRun`) |
| 2 | `POST /api/workflows/[id]/edit` | NL edit → proposed patch |
| 3 | `GET /api/workflows/runs/[id]/timeline` | Narrative timeline DTO |
| 3 | Approve body on approve | `resolution: approved \| rejected \| modified` + optional `modifiedPayload` |
| 4 | Delay scheduler worker | Durable wait; resume run |

---

## 5. Compatibility

- Keep `/workflows`, `/workflows/[id]`, `/workflows/runs/[id]`
- Template IDs and demo seeds remain valid
- Feature gate / plan access for workflows unchanged unless AI OS says otherwise

---

## 6. Non-goals

- Replacing linear steps with a graph DB in v2 Phase 1–3
- New Firestore collections for “Automation” distinct from `Workflow`
- Breaking existing run history
