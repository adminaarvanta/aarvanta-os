# Aarvanta AI OS — Product Vision

Everything starts with **AI**. CRM, Automations, Communications, HR, Finance, and Build are tools the AI uses — not silos the user must navigate first.

**Status:** Phase 0 (master spec). Module packs: [`docs/ai-team-v2/`](../ai-team-v2/), [`docs/crm-v2/`](../crm-v2/), [`docs/workflow-studio-v2/`](../workflow-studio-v2/).

---

## 1. Problem

Today the product still reads as:

```
CRM → Workflows → AI Workforce → …
```

Operators bounce between databases, playbooks, and agents. Aarvanta should feel like:

```
AI → CRM → Automation → Communication → HR → Finance → Website Builder
```

One intent layer; modules execute.

---

## 2. Product decisions

| Decision | Choice |
|----------|--------|
| Spine | AI Team Chat / Ask AI is the primary entry for outcomes |
| Modules | Remain deep workspaces for specialists and review |
| Approvals | Unified **Waiting for You** across AI Team jobs, workflow sends, CRM stage moves |
| URLs | Keep module bases (`/workforce`, `/crm`, `/workflows`, …) |
| Docs | Focused packs per module — not one 500-page monolith |
| Tenancy | All modules stay `TenantScope`-scoped |

---

## 3. Module composition

| Module | Role in AI OS |
|--------|----------------|
| AI Team | One-shot jobs, specialists, Waiting for You |
| CRM | Relationships, opportunities, timeline |
| Automations | Triggered / recurring processes |
| Comms (WhatsApp / Voice / Inbox) | Channels AI drafts and (with approval) sends |
| HR | People ops outcomes (hire, leave, docs) |
| Finance | Money facts — never invent numbers |
| Knowledge | Grounding for answers and voice |
| Build | Sites / assets as business outcomes |

---

## 4. Goals & non-goals

**Goals**
- One Ask AI / Chat pattern everywhere
- Cross-module intents route correctly (e.g. “follow up hot leads” → CRM context + job or automation)
- Consistent approval language

**Non-goals**
- Rewriting all modules into a single codebase folder overnight
- Removing module UIs
- Autonomous sends without policy

---

## 5. Exit criteria (program-level)

1. Module PRD packs exist and cross-link (this engagement)
2. AI Team Phase 1–3 patterns reused by CRM/Workflow Phase 1
3. A single orchestrator doc defines routing (see [`02-ai-orchestrator.md`](02-ai-orchestrator.md))
