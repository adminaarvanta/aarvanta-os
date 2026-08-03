# Workflow Studio v2 — Natural Language Builder & Editing

Deepen the existing intent → generate path into **Goal → Plan → Confirm**, then conversational edits instead of node wrestling.

**Status:** Phase 0 (spec). Baseline: [`WorkflowBuilder`](src/components/workflow/) → `POST /api/workflows/generate` → open `/workflows/[id]`.

---

## 1. Target flow

```
User: “Whenever a lead becomes hot, follow up automatically,
       wait 2 days, if no reply, send WhatsApp, then notify Sales Manager.”
        ↓
AI Plan card (Here’s what I’ll automate…)
        ↓
Continue → persist Workflow (trigger + steps)
        ↓
Optional: “Add another reminder.” / “Wait 5 days instead.”
        ↓
Patch steps via NL edit API
```

---

## 2. Plan card contents

- Trigger summary (e.g. lead scored hot)
- Ordered human steps (Wait · Check activity · Send WhatsApp · Create task · Notify)
- Specialists / channels involved
- Steps that need approval highlighted
- **Continue** / **Cancel** (mirror AI Team plan-before-act)

Underlying model remains linear `WorkflowStep[]` (`condition` \| `agent` \| `approval` \| `action` \| `delay`).

---

## 3. Conversational editing (Phase 2)

| User says | System does |
|-----------|-------------|
| Add another reminder | Insert delay + action/task step |
| Wait 5 days instead | Patch delay config |
| Don’t send WhatsApp — email instead | Swap `send_whatsapp` → `send_email` |
| Always ask me before sending | Ensure `approval` step before send actions |

Edits produce a diff preview, then `PATCH /api/workflows/[id]`.

Power-user form editor can remain for Phase 1–2 but is secondary.

---

## 4. Quick cards → seed intents

| Card | Example seed prompt |
|------|---------------------|
| Follow-up | When a lead is scored hot, chase with WhatsApp and create a task |
| Sales | When a deal stage changes to Proposal, draft outreach and notify owner |
| Customer Recovery | Recover customers quiet for 30 days |
| Hiring | When a candidate is shortlisted, notify HR and create onboarding task |
| Invoices | When an invoice is overdue, remind finance and create a task |
| Marketing | When a campaign lead arrives, tag contact and start nurture |

Map to templates in [`workflow-demo-seed.ts`](src/lib/data/workflow-demo-seed.ts) when present.

---

## 5. APIs

| Action | Approach |
|--------|----------|
| Plan (no write) | Extend generate or `POST /api/workflows/plan` returning plan DTO + proposed workflow |
| Confirm | Existing `POST /api/workflows` or generate-and-save |
| NL edit | `POST /api/workflows/[id]/edit` `{ prompt }` → proposed patch → client confirms → `PATCH` |

---

## 6. Exit criteria

1. Free-text process description shows plan card before save
2. Continue creates an enabled-ready workflow
3. At least two conversational edit verbs work (add reminder, change wait)
4. Form editor still available as fallback
