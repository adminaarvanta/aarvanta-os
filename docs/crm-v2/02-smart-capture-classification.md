# CRM v2 — Smart Capture & Classification

Users describe a relationship; AI creates the graph. “I met John from Google yesterday.” should not start with a blank form.

**Status:** Phase 0 (spec). Builds on lead scoring ([`lib/ai/lead-score.ts`](src/lib/ai/lead-score.ts)), insights ([`lib/ai/crm-insights.ts`](src/lib/ai/crm-insights.ts)), and Ask AI context-command.

---

## 1. Problem

Manual **New Contact** / **New Company** / **New Deal** flows force field-by-field entry. Classification (hot lead vs customer vs partner) is tag-driven and easy to get wrong. Related next work (task, follow-up) is left to the operator.

---

## 2. Product decisions

| Decision | Choice |
|----------|--------|
| Entry | Natural-language capture on People / Dashboard (+ Ask AI chips) |
| Idempotency | Match existing company by domain/name; contact by email/phone/name+company |
| Relationship types | Prospect · Customer · Vendor · Partner · Lead (map onto `ContactTag` + optional new field) |
| Lead score | Auto-run score after create/update when enough signal |
| Graph created | Company (if needed) → Contact → Tags → Score → optional Deal/Task |
| Human override | Always editable; AI proposals never silent-delete |

---

## 3. Capture flow

```
User utterance
    → Parse entities (person, org, when, channel, intent)
    → Resolve or create Company
    → Resolve or create Contact
    → Classify relationship type + tags
    → Score lead (reuse /api/contacts/[id]/score)
    → Suggest next task / follow-up
    → Show confirmation card (Continue / Edit / Cancel)
    → Persist
```

**Example utterance:** “I met John from Google yesterday.”

| Artifact | Example result |
|----------|----------------|
| Company | Google (domain google.com if inferred) |
| Contact | John · account = Google |
| Tags | `prospect` / `follow_up` |
| Lead score | Heuristic/LLM via existing scorer |
| Next task | “Follow up with John at Google” due +2 days |
| Activity | Meeting note dated yesterday |

---

## 4. Classification rules (v1)

| Signal | Bias toward |
|--------|-------------|
| Purchase history / `customer` tag | Customer |
| High lead score / `hot_lead` | Lead / Prospect |
| `partner` tag or partner language | Partner |
| Vendor / supplier language in utterance | Vendor (tag or notes until first-class type) |
| Ambiguous | Prospect + Ask AI “Confirm classification” |

Phase 1 may map Vendor → notes + tag until a dedicated enum exists; document the gap in [`04-data-apis.md`](04-data-apis.md).

---

## 5. APIs (target)

| Capability | Approach |
|------------|----------|
| Parse + propose | `POST /api/crm/capture` `{ prompt }` → proposed graph (no write) |
| Confirm | `POST /api/crm/capture/commit` with edited proposal → creates via existing CRM stores |
| Score | Existing `POST /api/contacts/[id]/score` |
| Insights | Existing contact insights route |

Reuse create endpoints under the hood (`contacts`, `companies`, `tasks`, `activities`) — no parallel write paths.

---

## 6. UX

- Primary CTA on People: **Describe who you met** (large prompt)
- Secondary: classic New Contact / New Company
- Confirmation card lists every entity AI will create/update
- After commit → open Person detail with timeline stub

---

## 7. Goals & non-goals

**Goals**
- One sentence can create a usable relationship graph
- Duplicates are merged when email/domain match

**Non-goals**
- Bulk import rewrite (keep [`crm-import-form`](src/components/crm/crm-import-form.tsx))
- Autonomous outbound from capture without approval

---

## 8. Exit criteria

1. Prompt → proposal card → commit creates company+contact+task in demo
2. Duplicate email does not create a second contact
3. Score runs or is queued after commit
4. Manual forms still work
