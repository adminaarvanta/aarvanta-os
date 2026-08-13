"use client";

import { useEffect, useMemo, useState } from "react";
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

export function AffiliateAdminClient() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [activationUrl, setActivationUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
          setInfo(
            `Set-password email not sent (${a.reason ?? "unknown"}). Copy the activation link below and share it with the partner.`
          );
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
          Hierarchy tree
        </h3>
        <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated p-3">
          {(data.tree?.length ?? 0) === 0 ? (
            <p className="px-1 py-2 text-sm text-muted">No affiliates yet.</p>
          ) : (
            <ul className="space-y-1">
              {data.tree.map((node) => (
                <TreeNodeView
                  key={node.affiliate.id}
                  node={node}
                  depth={0}
                  affiliates={data.affiliates}
                  isPlatform={isPlatform}
                  busy={busy}
                  onPatch={patch}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      {isPlatform ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Partner applications awaiting approval
          </h3>
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface-elevated">
            {pending.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">
                No partner applications waiting. New submissions from /affiliate
                appear here as pending.
              </li>
            ) : (
              pending.map((a) => (
                <PendingRow
                  key={a.id}
                  affiliate={a}
                  affiliates={data.affiliates}
                  busy={busy}
                  onPatch={patch}
                />
              ))
            )}
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

function TreeNodeView({
  node,
  depth,
  affiliates,
  isPlatform,
  busy,
  onPatch,
}: {
  node: AffiliateTreeNode;
  depth: number;
  affiliates: AdminAffiliate[];
  isPlatform: boolean;
  busy: boolean;
  onPatch: (body: Record<string, unknown>) => Promise<void>;
}) {
  const a = node.affiliate as AdminAffiliate;
  const role = a.role ?? "partner";
  const [parentId, setParentId] = useState(a.parentAffiliateId ?? "");

  useEffect(() => {
    setParentId(a.parentAffiliateId ?? "");
  }, [a.parentAffiliateId]);

  const parentOptions = useMemo(
    () =>
      affiliates.filter(
        (p) => p.id !== a.id && p.status !== "rejected" && p.status !== "suspended"
      ),
    [affiliates, a.id]
  );

  return (
    <li>
      <div
        className="flex flex-wrap items-start justify-between gap-2 rounded-lg px-2 py-2 hover:bg-surface-muted/60"
        style={{ marginLeft: depth * 16 }}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {depth > 0 ? "↳ " : ""}
            {a.profile.name} · {a.referralCode}
          </p>
          <p className="text-xs text-muted">
            {a.profile.email} · {role} · {a.profile.regionCode} · {a.status}
            {a.needsPasswordSetup ? " · awaiting password" : ""}
          </p>
        </div>
        {isPlatform ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded border border-border bg-surface-muted px-2 py-1 text-xs text-foreground"
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
        ) : null}
      </div>
      {node.children.length > 0 ? (
        <ul className="space-y-1">
          {node.children.map((child) => (
            <TreeNodeView
              key={child.affiliate.id}
              node={child}
              depth={depth + 1}
              affiliates={affiliates}
              isPlatform={isPlatform}
              busy={busy}
              onPatch={onPatch}
            />
          ))}
        </ul>
      ) : null}
    </li>
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
