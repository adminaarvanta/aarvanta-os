# Aarvanta AI OS — Frontend Architecture

Shared UX patterns so every module feels like one product.

**Status:** Phase 0 (spec).

---

## 1. Shared surfaces

| Pattern | Implementation today / target |
|---------|-------------------------------|
| Ask AI | [`AskAiButton`](../../src/components/ai-team/ask-ai-button.tsx) on CRM, HR, Finance, Knowledge, Writing, Build |
| AI Team Chat | [`/workforce`](../../src/app/(app)/workforce/page.tsx) plan-before-act |
| Waiting for You | `/workforce/waiting` (+ future CRM stage / workflow send trays) |
| Jobs | `/workforce/jobs` |
| Automations | `/workflows` (rebrand) |
| Relationship workspace | `/crm` v2 IA |

---

## 2. Navigation hierarchy

**Primary sidebar (conceptual)**

1. Command Center  
2. AI Team  
3. CRM  
4. WhatsApp / Voice (comms)  
5. Automations (`/workflows`)  
6. HR · Finance · Knowledge · Projects · Build  

Module sub-navs use relationship/automation language per their PRDs — not Zapier/database jargon.

---

## 3. Design system notes

- Reuse each OS shell tokens (workforce purple, CRM gold, workflow accents) — do not force one skin overnight
- Ask AI control should look familiar across modules (sparkle + popover + plan card)
- Plan cards: title, specialists/steps, Continue / Cancel
- Mobile: Ask AI must work in header actions without covering critical content

---

## 4. Component library targets

| Component | Owner pack |
|-----------|------------|
| `AskAiButton` | AI Team / AI OS |
| Plan confirm card | AI Team (reuse in Workflow NL builder) |
| Approval actions | Workforce + Workflow (+ CRM stage) |
| Relationship Timeline list | CRM v2 |
| Automation quick cards | Workflow Studio v2 |

---

## 5. Non-goals

- Single CSS theme for all OS modules in one PR
- Rewriting marketing site as part of app chrome
