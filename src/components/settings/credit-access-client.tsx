"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Mail, Mic, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import { ROLE_LABELS, type MemberRole } from "@/types/tenant";

export type CreditAccessMember = {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  organizationName: string;
  workspaceName: string;
  membershipCount: number;
  creditOverrides: {
    unlimitedVoice: boolean;
    unlimitedEmailOutreach: boolean;
  };
};

const roleBadge: Record<MemberRole, string> = {
  owner: "bg-gold/20 text-gold-bright ring-gold/40",
  admin: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  manager: "bg-navy/60 text-gold-bright ring-gold/30",
  member: "bg-surface-muted text-muted ring-border",
  guest: "bg-surface-muted text-muted/70 ring-border",
};

export function CreditAccessClient({
  initialMembers,
}: {
  initialMembers: CreditAccessMember[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const hay =
        `${m.name} ${m.email} ${m.organizationName} ${m.workspaceName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [members, query]);

  async function save(
    member: CreditAccessMember,
    patch: Partial<CreditAccessMember["creditOverrides"]>
  ) {
    const next = {
      unlimitedVoice: patch.unlimitedVoice ?? member.creditOverrides.unlimitedVoice,
      unlimitedEmailOutreach:
        patch.unlimitedEmailOutreach ??
        member.creditOverrides.unlimitedEmailOutreach,
    };
    setBusyId(member.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/tenant/members/${member.id}/credit-overrides`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        creditOverrides?: CreditAccessMember["creditOverrides"];
      };
      if (!res.ok) {
        setMessage(data.error?.message ?? "Could not save credit access.");
        return;
      }
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                creditOverrides: data.creditOverrides ?? next,
              }
            : m
        )
      );
      setMessage(`${member.name} updated.`);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel>
        <SectionHeader
          title="Credit access"
          description="Grant unlimited Voice OS minutes and Email OS outreach to any product user. Recipients should hard-refresh the app (or sign out and back in) after you save so nav and plan gates pick up the grant."
        />
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-foreground">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
          <p>
            Super-admin only. Lists every signed-up user across all organizations.
            Unlimited voice skips minute caps. Unlimited email outreach removes send
            limits and opens Email OS for that person.
          </p>
        </div>
      </Panel>

      {message && (
        <p className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm text-gold-bright">
          {message}
        </p>
      )}

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            title="Product users"
            description={`${members.length} unique users across the platform`}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or org…"
            className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
          />
        </div>

        <ul className="mt-4 space-y-3">
          {filtered.map((member) => {
            const busy = busyId === member.id;
            return (
              <li
                key={member.id}
                className="rounded-xl border border-border/80 bg-surface-elevated/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="truncate text-sm text-muted">{member.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={roleBadge[member.role]}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      <span className="text-xs text-muted">
                        {member.organizationName}
                        {member.workspaceName
                          ? ` · ${member.workspaceName}`
                          : ""}
                      </span>
                      {member.membershipCount > 1 ? (
                        <span className="text-[11px] text-dim">
                          {member.membershipCount} workspaces
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Mic className="h-3.5 w-3.5 text-muted" aria-hidden />
                      <span>Unlimited voice</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-gold"
                        checked={member.creditOverrides.unlimitedVoice}
                        disabled={busy}
                        onChange={(e) =>
                          void save(member, { unlimitedVoice: e.target.checked })
                        }
                      />
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted" aria-hidden />
                      <span>Unlimited email outreach</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-gold"
                        checked={member.creditOverrides.unlimitedEmailOutreach}
                        disabled={busy}
                        onChange={(e) =>
                          void save(member, {
                            unlimitedEmailOutreach: e.target.checked,
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {!filtered.length && (
          <p className="mt-4 text-sm text-muted">No users match your search.</p>
        )}
      </Panel>

      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={() => router.push("/settings")}>
          Back to settings
        </Button>
      </div>
    </div>
  );
}
