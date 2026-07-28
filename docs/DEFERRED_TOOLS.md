# Deferred tools (hidden from All Tools)

Modules that still have routes/seeds but are **not product-ready**. They were removed from **All Tools** and global feature search on 2026-07-28 so users only see working surfaces.

Source of truth for filtering: `src/lib/navigation/deferred-tools.ts`

When completing a module: ship a usable UI + mutations, then remove its entry from `DEFERRED_TOOLS` so it reappears in All Tools.

| ID | Label | Route | Why deferred | What to finish |
|----|-------|-------|--------------|----------------|
| `analytics-v2` | Analytics 2.0 | `/analytics` | Duplicate of Analytics | Drop or merge into Analytics |
| `ageb` | AGEB Blueprint | `/platform/ageb` | Engineering status, not a product tool | Keep under `/platform` only |
| `engines` | Core Engines | `/platform/engines` | Many engines still “Coming soon” | Real health + actions |
| `portal` | Client Portal | `/portal` | Seeded read-only list | Customer auth + projects/docs/messages |
| `knowledge-graph` | Knowledge Graph | `/knowledge/graph` | Seeded lists, no graph UI | Graph viz + CRUD |
| `wiki` | Internal Wiki | `/wiki` | Read-only seeded pages | Editor + write APIs |
| `memory` | Memory Layers | `/memory` | Seeded shell; real memory is under Workforce | Company/team memory UX or fold into Workforce |
| `templates` | Templates | `/templates` | Catalog only, no apply flow | Create-from-template for proposals/SOPs/workflows |
| `franchise` | Franchise OS | `/franchise` | Seeded locations, GET-only | Multi-location ops + compliance |
| `regions` | Multi-Region | `/regions` | Static map | Residency + routing controls |
| `success` | Customer Success | `/success` | Read-only health cards | Renewals, NPS, churn actions |
| `governance` | Governance | `/governance` | Read-only audit list | Live audit + permission review |
| `legal` | Legal OS | `/legal` | List shell; APIs unused by UI | Contract analyze/generate UI |

## Still available in All Tools (functional / demo-usable)

Command Center, AI Workforce, Knowledge Hub, CRM, WhatsApp OS, Unified Inbox, Voice OS, Project OS, Workflows, Build OS, Launch OS, Team, Integrations, Communications, Analytics, Settings, Billing, AI Writing Studio, Meetings, SOP Engine, Proposals, Finance OS, Payroll OS, HR OS, Autonomous Agents (→ Workforce tasks), Partner & Affiliate, Referrals, Enterprise SSO, Agent Marketplace.
