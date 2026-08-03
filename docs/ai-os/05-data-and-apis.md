# Aarvanta AI OS — Data & APIs

Entity graph and API inventory across modules. Gaps called out for phased work.

**Status:** Phase 0 (spec).

---

## 1. Entity graph (logical)

```
Organization / Workspace (TenantScope)
  ├─ People (CrmContact) ──┬─ Company
  │                        ├─ Deals
  │                        ├─ Tasks / Activities
  │                        └─ Conversations (inbox)
  ├─ Automations (Workflow) ── Runs
  ├─ AI Team Goals ── Executions ── Approvals
  ├─ Agent Runs / Memory
  ├─ Knowledge documents / chunks
  ├─ Finance invoices / expenses
  └─ HR candidates / employees / cases
```

Presentation names (People, Automations, Jobs) must not require new root collections in early phases.

---

## 2. API domains (keep stable)

| Domain | Prefix | Notes |
|--------|--------|-------|
| AI Team / workforce | `/api/workforce/*`, `/api/ai-team/*` | Goals, command, context-command |
| CRM | `/api/contacts`, companies, deals, activities, … | Capture/timeline added in CRM v2 |
| Workflows | `/api/workflows/*` | Plan/edit evolve in place |
| Comms | inbox / WhatsApp / voice routes | Sends behind approval |
| Knowledge | `/api/knowledge/*` | Grounding |
| Finance / HR | existing platform APIs | Read grounding first |

---

## 3. Gaps to close (by pack)

| Gap | Pack |
|-----|------|
| Unified Relationship Timeline DTO | CRM v2 |
| NL capture propose/commit | CRM v2 |
| Workflow plan dry-run + NL edit | Workflow Studio v2 |
| Durable delays | Workflow Studio v2 Phase 4 |
| Optional `/api/ai-os/command` umbrella | This pack |
| Shared Waiting tray across modules | Frontend + orchestrator |

---

## 4. Permissions

- Session required for all mutating OS commands  
- Plan feature gates per module  
- Never auto-send channels without approval policy  

---

## 5. Non-goals

- Unified single table for all entities  
- GraphQL mandatory layer  
