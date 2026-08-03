# AI Team v2 — Product Vision & UX

Outcome-first information architecture for Aarvanta’s AI employees. Users start work by describing what they want — not by picking Run, Goal, Pipeline, or Agent Profile.

**Status:** Phase 0 (spec). Phase 1 ships the UX shell on existing workforce APIs.  
**Route base:** keep `/workforce/*` URLs; product name in UI is **AI Team**.

### Where to open it

| Entry | Path |
|-------|------|
| Sidebar **AI Team** | `/workforce` |
| Chat (home) | `/workforce` |
| Jobs | `/workforce/jobs` (alias `/workforce/tasks`) |
| Waiting for You | `/workforce/waiting` (alias `/workforce/approvals`) |
| Activity | `/workforce/activity` |
| Settings / AI Employees | `/workforce/settings` |
| Employee detail (power-user) | `/workforce/{agentType}` |

---

## 1. Problem

Operators need outcomes (“follow up my leads”, “recover churning customers”) without learning workforce pipeline vocabulary. The current home is an agent directory; goals live under Tasks. That forces tool-first thinking.

---

## 2. Product decisions

| Decision | Choice |
|----------|--------|
| Branding | **AI Team** in nav/UI; feature key stays `aiWorkforce` |
| URLs | Keep `/workforce/*`; add Jobs/Waiting/Activity/Settings routes; old paths redirect or soft-land |
| Primary entry | Conversational Chat home with quick actions |
| Job model | Presentation over existing goal **executions** |
| Approvals | Relabeled **Waiting for You** |
| AI Employees | Under Settings; Memory/Run remain on employee detail |
| Autonomy | Channel send, Knowledge, Finance deepen in later phases |

---

## 3. Information architecture

| Tab | Route | User job |
|-----|-------|----------|
| Chat | `/workforce` | Ask / pick a quick action → start a job |
| Jobs | `/workforce/jobs` | Track in-progress and completed work |
| Waiting for You | `/workforce/waiting` | Approve, reject, or modify proposed actions |
| Activity | `/workforce/activity` | Human-readable feed of recent team actions |
| Settings | `/workforce/settings` | Browse/configure AI Employees |

**Outcome-first rule:** Starting work never requires opening an agent profile first.

---

## 4. Chat homepage (Phase 1)

- Greeting + large prompt (“Ask anything…”)
- Quick actions as prompt templates (Review Business, Follow up Leads, Recover Customers, Create Proposal, Launch Campaign, Hire Employee, Prepare Reports, Find Opportunities)
- Today’s activity strip (pending waiting, active jobs, completed today)
- Submit maps to `POST /api/workforce/goals` (heuristic objective map; no orchestrator yet)

---

## 5. Goals & non-goals

**Goals**
- Users never need Run / Goal / Pipeline / Agent Profile to start work
- Old deep links do not 404
- Approvals and jobs remain fully usable under new labels

**Non-goals (Phase 1)**
- True multi-agent planning UI (Phase 2)
- Contextual Ask AI on CRM/HR (Phase 3)
- Knowledge/Finance grounding and outbound channel send (Phase 4)

---

## 6. Exit criteria

1. Five-tab IA works end-to-end
2. Quick action or free-text prompt creates a job
3. Waiting for You approve/reject works
4. `/workforce/tasks` and `/workforce/approvals` still resolve
