"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Search, Users } from "lucide-react";
import {
  CrmAvatar,
  CrmEmptyState,
  formatCrmMoney,
} from "@/components/crm/crm-shell";

export type CompanyRow = {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  ownerName: string;
  revenue: number;
  contactCount: number;
};

export function CompaniesDirectory({ companies }: { companies: CompanyRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) =>
      [company.name, company.domain, company.industry, company.ownerName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    );
  }, [companies, query]);

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
          placeholder="Search companies…"
          className="w-full rounded-xl border border-border bg-surface-elevated py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </div>

      {filtered.length === 0 ? (
        <CrmEmptyState
          icon={Building2}
          title={companies.length === 0 ? "No companies yet" : "No matches"}
          description={
            companies.length === 0
              ? "Add an account to group people, deals, and history in one place."
              : "Try a different company name, domain, or industry."
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((company) => (
            <Link
              key={company.id}
              href={`/crm/companies/${company.id}`}
              className="group rounded-2xl border border-border/80 bg-surface-elevated p-4 transition-all hover:border-gold/35 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start gap-3">
                <CrmAvatar name={company.name} seed={company.id} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground group-hover:text-gold">
                    {company.name}
                  </h3>
                  <p className="truncate text-xs text-muted">
                    {company.domain || company.industry || "Company"}
                  </p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted">Owner</dt>
                  <dd className="mt-0.5 truncate text-foreground">
                    {company.ownerName}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Industry</dt>
                  <dd className="mt-0.5 truncate text-foreground">
                    {company.industry ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Revenue</dt>
                  <dd className="mt-0.5 font-medium text-gold">
                    {formatCrmMoney(company.revenue)}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-muted">
                    <Users className="h-3 w-3" aria-hidden />
                    People
                  </dt>
                  <dd className="mt-0.5 text-foreground">{company.contactCount}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
