"use client";

import { useEffect, useMemo, useState } from "react";
import { PeopleTreeView } from "@/components/affiliate/affiliate-people-tree";
import { Button } from "@/components/ui/button";
import { CardList, StatGrid } from "@/components/platform/module-page-shell";
import type {
  Affiliate,
  AffiliateEarning,
  AffiliatePayoutRequest,
  AffiliateRateCard,
  AffiliateRole,
  AffiliateTreeNode,
} from "@/types/affiliate";

type AdminAffiliate = Affiliate & {
  needsPasswordSetup?: boolean;
  role?: AffiliateRole;
};

type AdminPayload = {
  access: "platform" | "regional_manager";
  regionCode?: string;
  managerAffiliateId?: string;
  affiliates: AdminAffiliate[];
  tree: AffiliateTreeNode[];
  rateCards: AffiliateRateCard[];
  earnings: AffiliateEarning[];
  payouts: AffiliatePayoutRequest[];
  leads: { id: string; email: string; status: string; affiliateId: string }[];
};

function activationEmailFailureCopy(reason?: string): string {
  if (reason === "gmail_auth_rejected") {
    return "Set-password email not sent — Gmail rejected the mailbox login. Rotate GMAIL_APP_PASSWORD on Vercel, then resend. Copy the activation link below and share it with the partner.";
  }
  if (reason === "email_not_configured") {
    return "Set-password email not sent (Gmail is not configured). Copy the activation link below and share it with the partner.";
  }
  if (reason === "demo_mode") {
    return "Set-password email not sent (demo mode). Copy the activation link below and share it with the partner.";
  }
  return `Set-password email not sent (${reason ?? "unknown"}). Copy the activation link below and share it with the partner.`;
}

export function AffiliateAdminClient() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/affiliate/admin");
    const json = (await res.json()) as AdminPayload & {
      error?: { message?: string };
    };
    if (!res.ok) {
      setError(json.error?.message ?? "Admin access denied.");
      setData(null);
      return;
    }
    setData(json);
    setError(null);
    setSelectedId((prev) =>
      prev && json.affiliates.some((a) => a.id === prev) ? prev : null
    );
  }

  useEffect(() => {
    void load();
  }, []);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setInfo(null);
    setActivationUrl(null);
    try {
      const res = await fetch("/api/affiliate/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
        activation?: {
          needed: boolean;
          emailSent: boolean;
          activationUrl?: string;
          reason?: string;
        };
      };
      if (!res.ok) {
        setError(json.error?.message ?? "Action failed.");
        return;
      }
      if (json.activation) {
        const a = json.activation;
        if (!a.needed) {
          setInfo(
            a.emailSent
              ? "Approved — partner already has a password; notice email sent."
              : `Approved — partner already has a password.${a.activationUrl ? ` Dashboard: ${a.activationUrl}` : ""}`
          );
        } else if (a.emailSent) {
          setInfo(
            "Set-password email sent. You can also copy the activation link below."
          );
          setActivationUrl(a.activationUrl ?? null);
        } else {
          setInfo(activationEmailFailureCopy(a.reason));
          setActivationUrl(a.activationUrl ?? null);
        }
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return <p className="text-sm text-red-400">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-muted">Loading admin…</p>;
  }

  const isPlatform = data.access === "platform";
  const pending = data.affiliates.filter((a) => a.status === "pending");
  const openPayouts = data.payouts.filter(
    (p) => p.status === "requested" || p.status === "approved"
  );
  const selected =
    data.affiliates.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="space-y-8">
      <StatGrid
        items={[
          { label: "Affiliates", value: data.affiliates.length },
          { label: "Pending", value: pending.length },
          { label: "Open payouts", value: openPayouts.length },
          {
            label: "Earnings",
            value: data.earnings.filter((e) => e.status === "pending").length,
            sub: "Pending hold",
          },
        ]}
      />

      <p className="text-xs text-muted">
        Access:{" "}
        <span className="text-foreground">
          {isPlatform
            ? "Platform admin (full tree)"
            : `Regional manager (${data.regionCode})`}
        </span>
      </p>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-success" role="status">
          {info}
        </p>
      ) : null}
      {activationUrl ? (
        <div className="rounded-xl border border-border bg-surface-muted p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Activation link (set password)
          </p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">
            {activationUrl}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            type="button"
            onClick={() => void navigator.clipboard.writeText(activationUrl)}
          >
            Copy link
          </Button>
        </div>
      ) : null}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          People hierarchy
        </h3>
        <p className="mb-3 text-xs text-muted">
          Team members sit under admin@aarvanta.co. New partners attach to the
          referring member, or to admin when they have no referral.
          {isPlatform ? " Select a person to manage parent, role, or status." : ""}
        </p>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated">
            <PeopleTreeView
              tree={data.tree ?? []}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
          <SelectedAffiliatePanel
            affiliate={selected}
            affiliates={data.affiliates}
            isPlatform={isPlatform}
            busy={busy}
            onPatch={patch}
            onClear={() => setSelectedId(null)}
          />
        </div>
      </section>

      {isPlatform && pending.length > 0 ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Legacy applications still pending
          </h3>
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface-elevated">
            {pending.map((a) => (
              <PendingRow
                key={a.id}
                affiliate={a}
                affiliates={data.affiliates}
                busy={busy}
                onPatch={patch}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          {isPlatform
            ? "Regional rate / cap matrix"
            : `Rate matrix · ${data.regionCode}`}
        </h3>
        <ul className="space-y-3">
          {data.rateCards
            .filter((c) => !c.affiliateId)
            .map((card) => (
              <RateCardEditor
                key={card.id}
                card={card}
                busy={busy}
                onSave={(next) =>
                  void patch({ action: "upsert_rate_card", rateCard: next })
                }
              />
            ))}
        </ul>
      </section>

      {isPlatform ? (
        <>
          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Payout queue
            </h3>
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface-elevated">
              {data.payouts.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted">No payouts yet.</li>
              ) : (
                data.payouts.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {p.amount} {p.currency}
                      </p>
                      <p className="text-xs text-muted">
                        {p.affiliateId} · {p.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {p.status === "requested" ? (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void patch({
                              action: "payout",
                              payoutId: p.id,
                              status: "approved",
                            })
                          }
                        >
                          Approve
                        </Button>
                      ) : null}
                      {p.status === "approved" || p.status === "requested" ? (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            void patch({
                              action: "payout",
                              payoutId: p.id,
                              status: "paid",
                            })
                          }
                        >
                          Mark paid
                        </Button>
                      ) : null}
                      {p.status === "requested" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            void patch({
                              action: "payout",
                              payoutId: p.id,
                              status: "rejected",
                            })
                          }
                        >
                          Reject
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Earnings
            </h3>
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface-elevated">
              {data.earnings.slice(0, 40).map((e) => (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {e.type} · {e.amount} {e.currency}
                    </p>
                    <p className="text-xs text-muted">
                      {e.email ?? e.tenantId} · {e.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {e.status === "pending" ? (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void patch({
                            action: "approve_earning",
                            earningId: e.id,
                          })
                        }
                      >
                        Approve now
                      </Button>
                    ) : null}
                    {e.status === "approved" || e.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          void patch({
                            action: "clawback_earning",
                            earningId: e.id,
                          })
                        }
                      >
                        Clawback
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Leads</h3>
            <CardList
              items={data.leads.slice(0, 40).map((l) => ({
                id: l.id,
                title: l.email,
                body: l.affiliateId,
                badge: l.status,
              }))}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}

function SelectedAffiliatePanel({
  affiliate: a,
  affiliates,
  isPlatform,
  busy,
  onPatch,
  onClear,
}: {
  affiliate: AdminAffiliate | null;
  affiliates: AdminAffiliate[];
  isPlatform: boolean;
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
  onClear: () => void;
}) {
  const role = a?.role ?? "partner";
  const [parentId, setParentId] = useState(a?.parentAffiliateId ?? "");

  useEffect(() => {
    setParentId(a?.parentAffiliateId ?? "");
  }, [a?.id, a?.parentAffiliateId]);

  const parentOptions = useMemo(
    () =>
      a
        ? affiliates.filter(
            (p) =>
              p.id !== a.id &&
              p.status !== "rejected" &&
              p.status !== "suspended"
          )
        : [],
    [affiliates, a]
  );

  const parent = a?.parentAffiliateId
    ? affiliates.find((p) => p.id === a.parentAffiliateId)
    : undefined;

  if (!a) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-surface-elevated px-4 py-8 text-center text-sm text-muted">
        Select a person in the tree to see their profile
        {isPlatform ? " and hierarchy actions" : ""}.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {a.profile.name}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {a.profile.email}
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs text-muted hover:text-foreground"
          onClick={onClear}
        >
          Clear
        </button>
      </div>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Code</dt>
          <dd className="font-medium text-foreground">{a.referralCode}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Role</dt>
          <dd className="font-medium text-foreground">
            {role === "regional_manager" ? "Regional manager" : "Partner"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Region</dt>
          <dd className="font-medium text-foreground">
            {a.profile.regionCode}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Status</dt>
          <dd className="font-medium text-foreground">{a.status}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">Reports to</dt>
          <dd className="truncate font-medium text-foreground">
            {parent
              ? `${parent.profile.name} (${parent.referralCode})`
              : "— Root"}
          </dd>
        </div>
        {a.needsPasswordSetup ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Password</dt>
            <dd className="font-medium text-gold">Awaiting setup</dd>
          </div>
        ) : null}
      </dl>

      {isPlatform ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <label className="block text-xs text-muted">
            Parent in hierarchy
            <select
              className="mt-1 w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-xs text-foreground"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={busy}
            >
              <option value="">No parent (root)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.profile.name} ({p.referralCode})
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void onPatch({
                  action: "assign_hierarchy",
                  affiliateId: a.id,
                  parentAffiliateId: parentId || null,
                })
              }
            >
              Set parent
            </Button>
            {role !== "regional_manager" ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void onPatch({
                    action: "assign_hierarchy",
                    affiliateId: a.id,
                    role: "regional_manager",
                  })
                }
              >
                Promote RM
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void onPatch({
                    action: "assign_hierarchy",
                    affiliateId: a.id,
                    role: "partner",
                  })
                }
              >
                Demote
              </Button>
            )}
            {a.status !== "active" ? (
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  void onPatch({
                    action: "set_status",
                    affiliateId: a.id,
                    status: "active",
                    parentAffiliateId: parentId || null,
                  })
                }
              >
                Approve
              </Button>
            ) : null}
            {a.needsPasswordSetup ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  void onPatch({
                    action: "resend_activation",
                    affiliateId: a.id,
                  })
                }
              >
                Send password link
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void onPatch({
                  action: "set_status",
                  affiliateId: a.id,
                  status: "suspended",
                })
              }
            >
              Suspend
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
          Read-only view of your region hierarchy.
        </p>
      )}
    </div>
  );
}

function PendingRow({
  affiliate: a,
  affiliates,
  busy,
  onPatch,
}: {
  affiliate: AdminAffiliate;
  affiliates: AdminAffiliate[];
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [parentId, setParentId] = useState(a.parentAffiliateId ?? "");
  const [role, setRole] = useState<AffiliateRole>(a.role ?? "partner");

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">
          {a.profile.name} · {a.referralCode}
        </p>
        <p className="text-xs text-muted">
          {a.profile.email} · {a.source} · {a.profile.regionCode}
          {a.parentAffiliateId
            ? ` · parent ${affiliates.find((p) => p.id === a.parentAffiliateId)?.referralCode ?? a.parentAffiliateId}`
            : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded border border-border bg-surface-muted px-2 py-1 text-xs text-foreground"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          disabled={busy}
        >
          <option value="">No parent</option>
          {affiliates
            .filter((p) => p.id !== a.id && p.status === "active")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.profile.name} ({p.referralCode})
              </option>
            ))}
        </select>
        <select
          className="rounded border border-border bg-surface-muted px-2 py-1 text-xs text-foreground"
          value={role}
          onChange={(e) => setRole(e.target.value as AffiliateRole)}
          disabled={busy}
        >
          <option value="partner">Partner</option>
          <option value="regional_manager">Regional manager</option>
        </select>
        <Button
          size="sm"
          disabled={busy}
          onClick={() =>
            void onPatch({
              action: "set_status",
              affiliateId: a.id,
              status: "active",
              parentAffiliateId: parentId || null,
              role,
            })
          }
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            void onPatch({
              action: "set_status",
              affiliateId: a.id,
              status: "rejected",
            })
          }
        >
          Reject
        </Button>
      </div>
    </li>
  );
}

function RateCardEditor({
  card,
  busy,
  onSave,
}: {
  card: AffiliateRateCard;
  busy: boolean;
  onSave: (card: AffiliateRateCard) => void;
}) {
  const [draft, setDraft] = useState(card);

  useEffect(() => {
    setDraft(card);
  }, [card]);

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <p className="text-sm font-medium text-foreground">
        Region: {card.regionCode}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {(
          [
            ["defaultDiscountPercent", "Default discount %"],
            ["maxDiscountPercent", "Max discount %"],
            ["defaultCpaAmount", "Default CPA"],
            ["maxCpaAmount", "Max CPA"],
            ["defaultCommissionPercent", "Default commission %"],
            ["maxCommissionPercent", "Max commission %"],
            ["payoutMinimum", "Payout minimum"],
            ["attributionWindowDays", "Attribution days"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="text-xs text-muted">
            {label}
            <input
              type="number"
              className="mt-1 w-full rounded border border-border bg-surface-muted px-2 py-1.5 text-sm text-foreground"
              value={draft[key]}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  [key]: Number(e.target.value),
                }))
              }
            />
          </label>
        ))}
      </div>
      <Button
        className="mt-3"
        size="sm"
        disabled={busy}
        onClick={() => onSave(draft)}
      >
        Save caps
      </Button>
    </div>
  );
}
