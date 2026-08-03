# Workflow Studio v2 — Approval, Timeline & Runtime

Make runs feel alive: AI proposes sends, humans Approve/Modify/Reject, timeline shows the story.

**Status:** Phase 0 (spec). Baseline engine: [`src/lib/workflow/execute.ts`](src/lib/workflow/execute.ts); approve: `POST /api/workflows/runs/[id]/approve`.

---

## 1. Approval UX (future copy)

Current: approve gate on run.  
Target framing:

> AI wants to **Send WhatsApp**  
> Approve · Modify · Reject

| Resolution | Behavior |
|------------|----------|
| Approve | Resume run; perform send/action |
| Modify | Edit message/payload then resume |
| Reject | Skip step or fail policy-safe; continue or stop per config |

Align copy and patterns with AI Team **Waiting for You** where possible (shared component later under AI OS).

---

## 2. Workflow Timeline (run detail)

Replace dry step logs as the only view with a narrative timeline:

```
Automation Started
  → Message Sent
  → Customer Replied
  → AI Qualified Lead
  → CRM Updated
  → Sales Assigned
```

Implementation: present `WorkflowStepLog[]` (+ optional CRM/inbox side effects) as human events on `/workflows/runs/[id]`. Keep raw logs for debug.

---

## 3. Runtime realities & gaps

| Capability | Today | Target phase |
|------------|-------|--------------|
| Sequential steps | Yes | Keep |
| Condition skip | Yes | Keep |
| Agent steps via workforce | Yes | Keep |
| Approval pause | Yes (`awaiting_approval`) | Enrich Modify |
| Delay | Logged, not a real timer | Phase 4 durable scheduler |
| Event triggers | `trigger-from-events.ts` | Expand coverage |
| Retries / escalation | Limited | Phase 4–5 |

---

## 4. Product decisions

| Decision | Choice |
|----------|--------|
| Default for `send_whatsapp` / `send_email` | Require approval step unless policy says otherwise |
| Timeline | Presentation over step logs + context |
| Failure | Surface on timeline; allow retry from run page (Phase 4) |

---

## 5. Exit criteria

1. Run page shows Approve / Modify / Reject for pending send
2. Timeline narrative readable by a non-technical operator
3. Reject does not send the message
4. Durable delays documented as Phase 4 — not fake-complete in Phase 1
