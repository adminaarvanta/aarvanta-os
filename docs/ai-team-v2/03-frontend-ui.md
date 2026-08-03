# AI Team v2 — Frontend UI

Screen and component map from current Workforce UI to AI Team v2.

**Status:** Phase 0 (spec). Phase 1 implements the shell.

---

## 1. Route map

| New screen | Route | Maps from today |
|------------|-------|-----------------|
| Chat home | `/workforce` | Replaces agent directory on home |
| Jobs list | `/workforce/jobs` | `/workforce/tasks` list |
| Job detail | `/workforce/jobs/[id]` | `/workforce/tasks/[id]` |
| Waiting for You | `/workforce/waiting` | `/workforce/approvals` |
| Activity | `/workforce/activity` | New (compose from executions / runs) |
| Settings / AI Employees | `/workforce/settings` | Former home directory |
| Employee detail | `/workforce/[agentType]` | Unchanged URL; entry via Settings |
| Agent run detail | `/workforce/runs/[id]` | Unchanged (power-user) |

**Aliases:** `/workforce/tasks` → jobs; `/workforce/approvals` → waiting; `/workforce/autonomous` → jobs.

---

## 2. Shared chrome

| Component | Role |
|-----------|------|
| `workforce-shell.tsx` | Tokens, header, panels, buttons |
| `workforce-nav.tsx` | Tabs: Chat · Jobs · Waiting for You · Activity · Settings |
| Sidebar `command-center-nav.ts` | Label **AI Team**, href `/workforce` |

---

## 3. Screen components (Phase 1)

| Screen | Primary components |
|--------|-------------------|
| Chat | New `ai-team-chat-home.tsx`; posts goals via `prompt-to-goal` helper |
| Jobs | Tasks list pattern; copy Jobs; links to `/workforce/jobs/[id]` |
| Job detail | `task-execution-view.tsx` (light “Job” copy) |
| Waiting | `approval-actions.tsx` + approvals list |
| Activity | New feed list from executions (+ optional runs) |
| Settings | `agent-card.tsx` + `getDirectoryAgentCards` |
| Employee | `agent-profile-view.tsx` (Run / Chat / Memory / Tasks tabs stay) |

---

## 4. Chat UX details

- One composition: greeting, prompt, quick-action row, activity strip
- Quick actions fill the prompt or submit immediately with a mapped goal payload
- Success navigates to job detail
- No plan-confirm card until Phase 2

---

## 5. Compatibility UI

- Entity registry paths point at jobs / waiting
- `StartTaskPanel` copy → Ask AI Team; success links → `/workforce/jobs/{id}`
- Legacy unused: `agent-directory.tsx`, `autonomous-queue-actions.tsx`, `workforce-upgrade-panel.tsx` (leave in tree)

---

## 6. Phase 3+ UI (out of scope here)

- Global Ask AI command popover
- Module entry points (CRM contact/deal, HR, Marketing)
- Plan card Continue / Cancel before start
