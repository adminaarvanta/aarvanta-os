# Workflow Studio v2 — Product Vision & UX

Users describe outcomes; AI builds automations. Not a Zapier node canvas.

**Status:** Phase 0 (spec).  
**Route base:** keep `/workflows/*`; product name **Automations** (rebrand from BDM playbooks).

### Where to open it

| Entry | Path |
|-------|------|
| Sidebar / All Tools **Automations** | `/workflows` |
| Automation detail | `/workflows/[id]` |
| Run detail / timeline | `/workflows/runs/[id]` |

---

## 1. Problem

Today’s surface is linear **BDM playbooks**: hub list + templates + intent generate ([`/api/workflows/generate`](src/app/api/workflows/generate/route.ts)), form editor of typed steps, sequential runs with one approval gate. Framing still feels like “build a playbook,” not “describe how my business should run.” Delays are logged, not durable timers.

---

## 2. Product decisions

| Decision | Choice |
|----------|--------|
| Branding | **Automations** in UI; URLs stay `/workflows/*` |
| Mental model | Goal → AI Plan → Automation → Approval → Execution |
| Builder | Natural language first; linear step list remains the underlying model |
| Visual flow | Phase 3 read-only/explain view — not a drag-hundreds-of-nodes studio |
| Quick cards | Follow-up · Sales · Customer Recovery · Hiring · Invoices · Marketing |
| Approvals | Approve / Modify / Reject for outbound and risky actions |
| Reuse | Existing `Workflow` / `WorkflowRun` types and seven `/api/workflows` routes |

---

## 3. Information architecture

| Surface | Route | User job |
|---------|-------|----------|
| Automations home | `/workflows` | Browse, start from quick card or describe a process |
| Automation | `/workflows/[id]` | Review AI plan, enable, conversational edit, test run |
| Run timeline | `/workflows/runs/[id]` | Watch live progress; approve when paused |

**Outcome-first rule:** Creating an automation never requires picking Trigger → Condition → Action nodes first.

---

## 4. Homepage (Phase 1)

Replace “My Playbooks” energy with:

- Title **Automations**
- Quick cards that seed intent templates (map to demo seeds where possible: `hot_lead_chase`, `first_outreach_whatsapp`, `deal_followup`, …)
- Primary prompt: “Describe your business process…”
- List of enabled/disabled automations with last-run status

---

## 5. Goals & non-goals

**Goals**
- Describe an outcome → get a working automation draft
- Approvals feel like AI Team Waiting for You
- Old workflow IDs and run URLs keep working

**Non-goals (Phase 1)**
- Full NL conversational editor (Phase 2)
- Real durable delay scheduler (Phase 4)
- Arbitrary DAG / branching canvas

---

## 6. Exit criteria (Phase 1)

1. Home shows Automations + quick cards
2. Generate-from-intent still creates a workflow
3. Enable / test run / approval path still works
4. Copy no longer leads with “playbook” as the only frame
