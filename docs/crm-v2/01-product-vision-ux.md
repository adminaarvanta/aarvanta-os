# CRM v2 — Product Vision & UX

Transform CRM from a database into an **AI Relationship Workspace**. Users think “I met someone,” not “Create Contact.”

**Status:** Phase 1 UI shell in progress (nav IA + narrative dashboard + Ask AI).  
**Route base:** keep `/crm/*` URLs; product framing is **CRM** as a relationship workspace.

### Where to open it

| Entry | Path (target) | Maps from today |
|-------|---------------|-----------------|
| Sidebar **CRM** | `/crm` | Overview |
| Dashboard | `/crm` | `/crm` |
| People | `/crm/people` | `/crm/contacts` + `/crm/leads` |
| Companies | `/crm/companies` | `/crm/companies` |
| Sales | `/crm/sales` | `/crm/pipelines` (+ deals) |
| Conversations | `/crm/conversations` | Contact → inbox links |
| Calendar | `/crm/calendar` | Task due dates + meetings |
| Activity | `/crm/activity` | `/crm/tasks` + activity feed |

---

## 1. Problem

Average operators do not think in CRUD forms. Today’s CRM ([`crm-nav.tsx`](src/components/crm/crm-nav.tsx): Overview · Leads · Contacts · Companies · Pipelines · Tasks) forces database vocabulary. Activities (`CrmActivity`) and inbox timelines are separate — there is no single relationship story. AI exists (lead scoring, contact insights, Ask AI on contact/deal) but is bolted onto a form-first UI.

---

## 2. Product decisions

| Decision | Choice |
|----------|--------|
| Branding | Keep sidebar **CRM**; in-product voice = relationship workspace |
| URLs | Keep `/crm/*`; add People / Sales / Conversations / Calendar / Activity; old paths redirect or soft-land |
| People | Presentation over `CrmContact` + lead filters (hot/prospect tags/scores) |
| Sales | Presentation over pipelines + deals |
| Conversations | Deep links / filtered inbox threads linked via `conversationIds` |
| Ask AI | Every major CRM page mounts [`AskAiButton`](src/components/ai-team/ask-ai-button.tsx) |
| Classification | AI suggests Prospect / Customer / Vendor / Partner / Lead — human can override |
| Stage moves | AI suggests; Approve before applying (Phase 2+) |

---

## 3. Information architecture

| Tab | Route | User job |
|-----|-------|----------|
| Dashboard | `/crm` | Narrative AI sales briefing + key relationships |
| People | `/crm/people` | Find / open people; smart capture entry |
| Companies | `/crm/companies` | Accounts and org context |
| Sales | `/crm/sales` | Opportunities board + deal detail |
| Conversations | `/crm/conversations` | Relationship threads across channels |
| Calendar | `/crm/calendar` | Meetings and due work |
| Activity | `/crm/activity` | Cross-entity feed (until Timeline owns detail pages) |

**Outcome-first rule:** Capturing a relationship never requires filling a blank contact form first (smart capture is primary; forms remain for power users).

---

## 4. Phase 1 UI shell (highest priority)

- Rebrand nav labels and empty states to relationship language
- People list = contacts with lead facets (alias `/crm/leads`, `/crm/contacts`)
- Sales board = pipelines (alias `/crm/pipelines`)
- Ask AI on Dashboard, People, Companies, Sales, deal/person detail
- Manual create forms remain available but demoted

---

## 5. Goals & non-goals

**Goals**
- CRM feels like a relationship manager, not a spreadsheet
- Old deep links (`/crm/contacts/[id]`, `/crm/deals/[id]`, etc.) do not 404
- Ask AI works with contact/deal context (already partially shipped)

**Non-goals (Phase 1)**
- Full Relationship Timeline composition (Phase 2)
- Predictive close / churn models (Phase 4)
- Fully autonomous CRM actions without approval (Phase 5)

---

## 6. Exit criteria (Phase 1)

1. New nav IA usable end-to-end
2. People / Sales aliases resolve from old URLs
3. Ask AI present on primary CRM surfaces
4. Existing scoring, insights, and deal/contact detail still work
