# CRM v2 — Data Model & APIs

Presentation and API plan over existing CRM persistence. No big-bang schema rewrite in Phases 1–2.

**Status:** Phase 0 (spec). Canonical types: [`src/types/crm.ts`](src/types/crm.ts).

---

## 1. Presentation map

| User term | Runtime | Notes |
|-----------|---------|-------|
| Person | `CrmContact` | Leads = filtered People (score/tags) |
| Company | `CrmCompany` | Unchanged |
| Sales opportunity | `CrmDeal` + `CrmPipeline` | Sales board = pipelines |
| Conversation | Inbox `Conversation` via `conversationIds` | Not a new CRM table in Phase 1 |
| Activity (legacy) | `CrmActivity` | Feeds Timeline |
| Task | `CrmTask` | Calendar + Activity |
| Timeline item | DTO only | Composed at read time |
| Relationship type | Tags + optional future enum | Prospect/Customer/Vendor/Partner/Lead |

---

## 2. Existing entities (keep)

- `CrmCompany`, `CrmContact`, `CrmPipeline` / `PipelineStage`, `CrmDeal`, `CrmTask`, `CrmActivity`, `Purchase`
- Tags: `hot_lead` \| `vip` \| `customer` \| `prospect` \| `partner` \| `follow_up`
- Activity types: `call` \| `meeting` \| `note`

**Gap:** Vendor is not a first-class tag; Phase 2 may add `vendor` to `ContactTag` or a `relationshipType` field.

---

## 3. Stable APIs (do not break)

Reuse existing CRM HTTP surface for CRUD, scoring, insights, activities. Ask AI remains:

- `POST /api/ai-team/context-command` with `module: "crm"`, `entityType: "contact" | "deal"`

---

## 4. New / evolved endpoints (phased)

| Phase | Endpoint | Role |
|-------|----------|------|
| 2 | `POST /api/crm/capture` | Propose graph from NL |
| 2 | `POST /api/crm/capture/commit` | Persist proposal |
| 2 | `GET /api/crm/people/[id]/timeline` | Relationship Timeline DTO |
| 2 | `GET /api/crm/deals/[id]/timeline` | Deal-scoped timeline |
| 1 | `GET /api/crm/dashboard/briefing` | Narrative AI Sales Dashboard |
| 3 | `POST /api/crm/deals/[id]/suggest-stage` | Stage suggestion |
| 3 | `POST /api/crm/deals/[id]/apply-stage` | Apply after Approve |

List aliases: People may be `GET` contacts with query facets; no mandatory new collection.

---

## 5. Compatibility routes

| Old | New |
|-----|-----|
| `/crm/contacts` | `/crm/people` (redirect or soft-land) |
| `/crm/leads` | `/crm/people?facet=leads` |
| `/crm/pipelines` | `/crm/sales` |
| `/crm/tasks` | `/crm/activity` or `/crm/calendar` |
| `/crm/contacts/[id]` | `/crm/people/[id]` |
| `/crm/deals/[id]` | stays or under `/crm/sales/[id]` |

Entity registry deep links should update when routes land (same pattern as AI Team Jobs).

---

## 6. Permissions & tenancy

All CRM records remain `TenantScope`-scoped. Capture/commit and timeline reads use `getSessionContext()` like other app APIs. Feature gate stays CRM plan key.

---

## 7. Non-goals

- Migrating contacts into a new “People” Firestore collection
- Duplicating inbox messages into CRM storage
- Breaking import / seed demo paths
