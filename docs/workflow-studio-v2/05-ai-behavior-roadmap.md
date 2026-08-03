# Workflow Studio v2 — AI Behavior & Roadmap

Prompt patterns and phased delivery for outcome-first automations.

**Status:** Phase 0 (spec).

---

## 1. Process-description prompts

System guidance for generate/plan:

- Prefer concrete triggers tied to CRM/events Aarvanta supports
- Insert **approval** before any outbound send
- Prefer WhatsApp/email actions that already exist in `WorkflowActionType`
- Delays expressed in hours/days; note durable delay limitation until Phase 4
- Keep step count small (5–12) unless user asks for more

**User examples**

- Whenever a lead becomes hot, follow up, wait 2 days, if no reply send WhatsApp, notify Sales Manager
- Recover customers after 30 days of silence
- When invoice overdue, remind and create finance task

---

## 2. Edit prompts

Treat edits as patches:

- Identify which step(s) change
- Return full proposed step list + short diff summary
- Never remove approval before send unless user explicitly waives it

---

## 3. Cursor roadmap

| Phase | Name | Deliverable | Exit criteria |
|-------|------|-------------|-----------------|
| 1 | Automation Dashboard | Automations home, quick cards, copy rebrand | Hub usable; generate+run still work |
| 2 | Natural Language Builder | Plan-before-save + conversational edit | Plan card → save; 2+ edit verbs |
| 3 | Visual Flow | Read-only explain view of linear steps | Operators understand flow without forms |
| 4 | Execution Engine | Durable delays, retries, richer Modify approve | Wait actually waits; retry works |
| 5 | Analytics | Automation performance (runs, approvals, outcomes) | Dashboard shows automation health |

---

## 4. Cross-links

- CRM hot-lead / deal events → [`docs/crm-v2/`](../crm-v2/)
- AI Team jobs vs automations → [`docs/ai-team-v2/`](../ai-team-v2/): Jobs = one-shot outcomes; Automations = recurring/triggered
- Master spine → [`docs/ai-os/`](../ai-os/)

---

## 5. Goals & non-goals

**Goals**
- Operators describe business process in plain language
- Sends stay human-gated by default

**Non-goals**
- Competing with Zapier’s infinite connector catalog in v2
- Silent autonomous messaging
