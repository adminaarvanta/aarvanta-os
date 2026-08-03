# CRM v2 — AI Behavior & Roadmap

Ask AI prompts, classification language, and phased delivery for the Relationship Workspace.

**Status:** Phase 0 (spec). Extends [`AskAiButton`](src/components/ai-team/ask-ai-button.tsx) and [`docs/ai-team-v2/`](../ai-team-v2/).

---

## 1. Ask AI everywhere (CRM)

Every major CRM page includes Ask AI. Suggested chips:

| Surface | Example prompts |
|---------|-----------------|
| Person | Summarize this customer · What happened recently? · Write follow-up · Schedule meeting |
| Deal | What’s blocking this deal? · Prepare follow-up · Create a proposal · Move to next stage? |
| Company | Who are the key people? · Summarize account health |
| Dashboard | What needs my attention? · Which deals close this week? |
| Sales board | Which opportunities are stuck? |

Context payload: `{ module: "crm", entityType, entityId, prompt }` → plan → confirm → AI Team job or CRM mutation.

---

## 2. Tone & language

- Prefer relationship verbs (“You met John…”, “Follow up overdue”) over schema words (“Contact created”)
- Classification explanations one sentence: “Tagged as Prospect because no purchases yet and first meeting yesterday.”
- Stage suggestions always include **why**

---

## 3. Approval policy

| Action | Default |
|--------|---------|
| Create contact/company from capture | Confirm card once, then write |
| Update tags/score | Auto OK; show toast |
| Move deal stage | Approve required (Phases 1–4) |
| Send WhatsApp/email from CRM Ask AI | Waiting for You / workflow approval |
| Delete entities | Never autonomous |

---

## 4. Cursor roadmap

| Phase | Name | Deliverable | Exit criteria |
|-------|------|-------------|-----------------|
| 1 | CRM UI redesign | Nav IA People/Sales/…; Ask AI on surfaces; narrative dashboard heuristics | New IA usable; old URLs resolve |
| 2 | Relationship Timeline | Compose activities + inbox (+ deals/tasks) on person/deal | Timeline replaces Activities-only section |
| 3 | AI Context | Capture NL → graph; richer context-command; stage suggestions | Capture commit works; stage Approve works |
| 4 | Predictive CRM | Close likelihood, churn/at-risk, opportunity ranking | Dashboard lines backed by scored models |
| 5 | Autonomous CRM | Policy-gated auto follow-ups / stage moves | Sends still approval-gated by default |

---

## 5. Implementation notes for Cursor

- Prefer presentation routes + DTOs over new collections
- Reuse scoring/insights before inventing new models
- Keep feature key / plan gates for CRM
- Cite this pack section in each ticket
- Coordinate with [`docs/workflow-studio-v2/`](../workflow-studio-v2/) when automations own follow-ups
- Coordinate with [`docs/ai-os/`](../ai-os/) for cross-module orchestrator

---

## 6. Goals & non-goals

**Goals**
- AI decides draft classification; humans stay in control of irreversible/sales-critical moves
- CRM Ask AI feels native, not a bolt-on

**Non-goals**
- Replacing AI Team Jobs for multi-step work
- Training custom ML in Phase 1–2
