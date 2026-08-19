"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { CrmAvatar, CrmEmptyState, CrmTag } from "@/components/crm/crm-shell";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";

export type PersonRow = {
  id: string;
  name: string;
  jobTitle?: string;
  email?: string;
  companyName: string;
  ownerName: string;
  score?: number;
  tags: string[];
};

export function PeopleDirectory({
  people,
  leadsOnly,
}: {
  people: PersonRow[];
  leadsOnly: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter((person) =>
      [person.name, person.email, person.companyName, person.jobTitle, person.ownerName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    );
  }, [people, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, companies, or email…"
          className="w-full rounded-xl border border-border bg-surface-elevated py-2.5 pl-10 pr-3 text-sm text-foreground outline-none ring-gold/0 transition focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </div>

      {filtered.length === 0 ? (
        <CrmEmptyState
          icon={Users}
          title={people.length === 0 ? "No people yet" : "No matches"}
          description={
            people.length === 0
              ? leadsOnly
                ? "Add a lead you want to follow, or import a spreadsheet."
                : "Add someone you met, or import a spreadsheet."
              : "Try a different name, company, or email."
          }
        />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {filtered.map((person) => (
              <Link
                key={person.id}
                href={`/crm/contacts/${person.id}`}
                className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface-elevated p-3.5 transition-colors active:bg-surface-muted"
              >
                <CrmAvatar name={person.name} seed={person.id} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {[person.jobTitle, person.companyName]
                          .filter((v) => v && v !== "—")
                          .join(" · ") || "No company"}
                      </p>
                    </div>
                    <LeadScoreBadge score={person.score} compact />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {person.tags.slice(0, 3).map((tag) => (
                      <CrmTag key={tag}>{tag.replace(/_/g, " ")}</CrmTag>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated md:block">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-surface-muted/70 text-left text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {filtered.map((person) => (
                  <tr
                    key={person.id}
                    className="transition-colors hover:bg-surface-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/crm/contacts/${person.id}`}
                        className="flex items-center gap-3"
                      >
                        <CrmAvatar name={person.name} seed={person.id} size="sm" />
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground hover:text-gold">
                            {person.name}
                          </span>
                          {person.jobTitle ? (
                            <span className="block text-xs text-muted">
                              {person.jobTitle}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{person.companyName}</td>
                    <td className="px-4 py-3 text-muted">{person.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{person.ownerName}</td>
                    <td className="px-4 py-3">
                      <LeadScoreBadge score={person.score} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {person.tags.slice(0, 3).map((tag) => (
                          <CrmTag key={tag}>{tag.replace(/_/g, " ")}</CrmTag>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
