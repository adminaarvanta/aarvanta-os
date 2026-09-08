"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  AccountLifecycleAction,
  RetentionAlternative,
} from "@/lib/account/lifecycle";

export function RetentionDialog({
  action,
  title,
  lossCopy,
  alternatives,
  busy,
  onClose,
  onConfirm,
}: {
  action: AccountLifecycleAction;
  title: string;
  lossCopy: string;
  alternatives: RetentionAlternative[];
  busy?: boolean;
  onClose: () => void;
  onConfirm: (reason: string, alternative?: RetentionAlternative["id"]) => void;
}) {
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="retention-title"
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-xl"
      >
        <h2 id="retention-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{lossCopy}</p>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Before you continue
          </p>
          {alternatives.map((item) =>
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground hover:border-gold/40"
              >
                <span className="font-medium">{item.title}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {item.description}
                </span>
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => onConfirm(reason, item.id)}
                className="block w-full rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-left text-sm text-foreground hover:border-gold/40"
              >
                <span className="font-medium">{item.title}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {item.description}
                </span>
              </button>
            )
          )}
        </div>

        <label className="mt-4 block text-xs text-muted">
          Tell us why (optional)
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          />
        </label>

        {action === "delete" ? (
          <label className="mt-3 flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
              className="mt-0.5"
            />
            I have downloaded my data and understand this cannot be undone.
          </label>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Keep my account
          </Button>
          <Button
            type="button"
            variant={action === "delete" ? "ghost" : "secondary"}
            disabled={busy || (action === "delete" && !confirmDelete)}
            onClick={() => onConfirm(reason)}
          >
            {busy
              ? "Working…"
              : action === "delete"
                ? "Delete workspace"
                : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
