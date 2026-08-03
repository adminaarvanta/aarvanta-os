# AI Team v2 — Prompt & Agent Behavior

Specialist matrix, plan language, and approval rules for AI Team jobs.

**Status:** Phase 0 (spec). Phase 1 uses existing objective → plan/agent maps; Phase 2 adds explain-before-act language.

---

## 1. Specialists

| Agent type | Label | Typical work |
|------------|-------|--------------|
| `ceo` | AI CEO | Oversight / monitoring |
| `coo` | AI COO | Custom / ops goals |
| `sales_manager` | AI Sales Manager | Close lead, follow-up, proposals, meetings |
| `marketing_manager` | AI Marketing Manager | Campaigns, outreach copy |
| `hr_manager` | AI HR Manager | Hiring, people ops |
| `cfo` | AI CFO | Reports, finance facts (Phase 4 grounding) |
| `customer_success_manager` | AI Customer Success Manager | Recover customer, nurture |

Objective → default assignees live in `orchestrator.selectAgents` (unchanged Phase 1).

---

## 2. Quick-action → objective map (Phase 1)

| Quick action | Objective | Notes |
|--------------|-----------|-------|
| Follow up Leads | `follow_up` | |
| Recover Customers | `recover_customer` | |
| Create Proposal | `generate_proposal` | |
| Find Opportunities | `close_lead` | |
| Review Business | `custom` | `moduleHint: operations` |
| Launch Campaign | `custom` | `moduleHint: marketing` |
| Hire Employee | `custom` | `moduleHint: hr` |
| Prepare Reports | `custom` | `moduleHint: finance` |

Free text: keyword heuristics → enum; else `custom` + full prompt as `customObjective` / `instructions`.

---

## 3. Plan language (Phase 2+)

Before execute, show a short human plan:

> Here’s what I’ll do:  
> 1. …  
> 2. …  
> Specialists: Sales Manager, …

Buttons: **Continue** / **Cancel**. Phase 1 skips this card and starts the job immediately.

---

## 4. Approval rules

Require Waiting for You when:

- Step flagged `requiresApproval` / discount-style checks
- Instructions mention discount / refund / credit (existing heuristic)
- Phase 4: any outbound channel **send**

Never invent Finance or Knowledge facts; ground from tools when available (Phase 4).

---

## 5. Tone

- Address the user as the operator of an AI team
- Prefer outcome verbs (“Followed up 12 leads”) over system jargon (“execution completed”)
- Activity feed uses specialist labels + goal display label + status
