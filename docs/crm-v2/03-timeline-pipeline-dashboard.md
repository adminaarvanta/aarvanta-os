# CRM v2 — Timeline, Pipeline & AI Dashboard

Replace fragmented Activities + inbox links with a **Relationship Timeline**, smart pipeline suggestions, and a narrative **AI Sales Dashboard**.

**Status:** Phase 0 (spec). Phase 2 = Timeline; Dashboard narrative can start in Phase 1 shell.

---

## 1. Problem today

- **Activities** = `CrmActivity` (`call` \| `meeting` \| `note`) via `LogActivityForm` / inbound bridge
- **Timeline** = inbox conversation events, shown as “Communication history” links on contact detail — not unified with CRM activities, deals, invoices, or support
- Pipeline stage moves are manual on [`pipeline-board`](src/components/crm/pipeline-board.tsx)
- Overview is charts/lists — not an AI briefing

---

## 2. Relationship Timeline

### Purpose

One feed per Person / Company / Deal showing everything that happened in the relationship.

### Event sources (compose, don’t fork stores)

| Source | Examples |
|--------|----------|
| CRM activities | Calls, meetings, notes |
| Inbox | WhatsApp, email, voice snippets via linked `conversationIds` |
| Deals | Stage changes, value updates, won/lost |
| Tasks | Created, completed, AI-assigned |
| Finance | Invoices linked by client/contact (when available) |
| Support / HR | Cases touching the same person (later) |
| AI | Insights summaries, capture notes, agent job outcomes |

### Presentation

- Reverse-chronological cards with channel icon, actor (human / AI / system), short body, deep link
- Filters: All · Comms · Sales · Money · AI
- Replace the separate Activities-only section on detail pages once Timeline ships (Phase 2)

### DTO (presentation)

```ts
type RelationshipTimelineItem = {
  id: string;
  at: string;
  kind: "activity" | "message" | "deal" | "task" | "invoice" | "ai" | "support";
  title: string;
  body?: string;
  href?: string;
  actorLabel: string;
};
```

Served by e.g. `GET /api/crm/people/[id]/timeline` composing existing stores.

---

## 3. Smart Sales Pipeline

Instead of silent stage drag:

1. AI detects signals (proposal sent, meeting booked, score spike, stalled days)
2. Suggests: “Move **Acme** to **Proposal**?”
3. Operator: **Approve** / **Modify** (pick stage) / **Dismiss**
4. On approve → existing deal update APIs

Suggestions appear on deal detail, Sales board, and Waiting-style tray (can share AI Team Waiting patterns for consistency).

---

## 4. AI Sales Dashboard (`/crm`)

Charts may remain secondary. Primary surface is narrative:

> Three deals are likely to close.  
> Two customers are at risk.  
> One opportunity worth $50K needs follow-up.

Each line links to the entity. Powered by heuristics first (open deals by stage/probability, overdue tasks, low-activity customers, hot leads), then predictive models in Phase 4.

Reuse Ask AI: “What’s blocking my pipeline?” with `module: "crm"`.

---

## 5. Goals & non-goals

**Goals**
- One timeline tells the relationship story
- Stage changes can be AI-suggested with human approval
- Dashboard answers “what needs me?” without reading charts

**Non-goals (early phases)**
- Replacing inbox UI
- Full predictive models (Phase 4)
- Auto-moving stages without approval (Phase 5 only, policy-gated)

---

## 6. Exit criteria

**Phase 1:** Dashboard shows narrative briefing from heuristics; Ask AI on dashboard.  
**Phase 2:** Person (and deal) Timeline composes activities + inbox events.  
**Phase 3+:** Stage suggestion Approve flow works end-to-end.
