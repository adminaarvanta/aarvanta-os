"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, RefreshCw, User } from "lucide-react";
import { IdentityBadge } from "@/components/inbox/identity-badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client-fetch";
import type { Conversation } from "@/types/communication";

export function IdentityPanel({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const identity = conversation.identity;

  function applyOverride(override: "company" | "individual" | null) {
    startTransition(async () => {
      setError(null);
      const result = await apiFetch(`/api/conversations/${conversation.id}/identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ override }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  function redetect() {
    startTransition(async () => {
      setError(null);
      const result = await apiFetch(`/api/conversations/${conversation.id}/identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redetect: true }),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Identity</h3>
        <IdentityBadge identity={identity} />
      </div>
      <p className="text-xs text-muted">
        Multi-layer detection: email domain, name pattern, message language, CRM match,
        channel profile{identity?.override ? ", plus manual override" : ""}.
      </p>

      {identity?.suggestedCompanyName && identity.type === "company" && (
        <p className="text-xs text-foreground">
          Suggested company:{" "}
          <span className="font-medium">{identity.suggestedCompanyName}</span>
          {identity.suggestedDomain ? ` · ${identity.suggestedDomain}` : ""}
        </p>
      )}

      {identity && identity.signals.length > 0 && (
        <ul className="space-y-1.5">
          {identity.signals.map((signal, idx) => (
            <li
              key={`${signal.layer}-${idx}`}
              className="flex items-start gap-2 text-[11px] text-muted"
            >
              <span
                className={
                  signal.vote === "company"
                    ? "mt-0.5 text-accent-cyan"
                    : "mt-0.5 text-primary-bright"
                }
              >
                {signal.vote === "company" ? (
                  <Building2 className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
              </span>
              <span>
                <span className="font-medium text-foreground">{signal.layer}</span>
                {" · "}
                {signal.reason}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => applyOverride("company")}
        >
          Mark company
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => applyOverride("individual")}
        >
          Mark individual
        </Button>
        {identity?.override && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => applyOverride(null)}
          >
            Clear override
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={redetect}
        >
          <RefreshCw className={`mr-1 h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
          Re-detect
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
