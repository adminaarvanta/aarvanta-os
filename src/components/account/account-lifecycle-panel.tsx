"use client";

import { useEffect, useState } from "react";
import { RetentionDialog } from "@/components/account/retention-dialog";
import { HelpTip } from "@/components/ui/help-tip";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import type {
  AccountLifecycleAction,
  AccountLifecycleRecord,
  RetentionAlternative,
} from "@/lib/account/lifecycle";

type LifecyclePayload = {
  lifecycle: AccountLifecycleRecord;
  alternatives: Record<AccountLifecycleAction, RetentionAlternative[]>;
  lossCopy: Record<AccountLifecycleAction, string>;
};

const ACTIONS: {
  id: AccountLifecycleAction;
  label: string;
  description: string;
}[] = [
  {
    id: "pause",
    label: "Pause workspace",
    description: "Stop paid usage for a while. Your data stays.",
  },
  {
    id: "downgrade",
    label: "Change or lower plan",
    description: "Compare plans and keep only what you need.",
  },
  {
    id: "cancel",
    label: "Cancel subscription",
    description: "Return to Free at the end of the period.",
  },
  {
    id: "deactivate",
    label: "Deactivate workspace",
    description: "Hide the workspace from the team. You can come back.",
  },
  {
    id: "delete",
    label: "Delete workspace",
    description: "Remove access. Download your data first.",
  },
];

export function AccountLifecyclePanel({ canManage }: { canManage: boolean }) {
  const [payload, setPayload] = useState<LifecyclePayload | null>(null);
  const [open, setOpen] = useState<AccountLifecycleAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/account/lifecycle");
      if (!res.ok) return;
      setPayload((await res.json()) as LifecyclePayload);
    })();
  }, []);

  async function apply(
    action: AccountLifecycleAction,
    reason: string,
    alternative?: RetentionAlternative["id"]
  ) {
    setBusy(true);
    setMessage(null);
    try {
      if (action === "downgrade" && !alternative) {
        window.location.assign("/billing");
        return;
      }
      const res = await fetch("/api/account/lifecycle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason,
          selectedAlternative: alternative,
          confirm: action === "delete",
        }),
      });
      const data = (await res.json()) as LifecyclePayload & {
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Could not update account.");
      }
      setPayload((current) =>
        current
          ? { ...current, lifecycle: data.lifecycle }
          : data
      );
      setOpen(null);
      setMessage(
        data.lifecycle.status === "active"
          ? "No change to your plan."
          : `Account is now ${data.lifecycle.status.replace("_", " ")}.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resume() {
    setBusy(true);
    try {
      const res = await fetch("/api/account/lifecycle", { method: "POST" });
      const data = (await res.json()) as {
        lifecycle?: AccountLifecycleRecord;
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(data.error?.message ?? "Could not resume.");
      if (data.lifecycle) {
        setPayload((current) =>
          current ? { ...current, lifecycle: data.lifecycle! } : current
        );
      }
      setMessage("Workspace is active again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Resume failed.");
    } finally {
      setBusy(false);
    }
  }

  const status = payload?.lifecycle.status ?? "active";

  return (
    <Panel>
      <SectionHeader
        title="Stay or leave"
        description="Pause, change plans, or close the workspace. We show what you keep — cancellation stays one extra step, not a maze."
      />
      <p className="mt-3 text-sm text-foreground">
        Current status:{" "}
        <span className="font-semibold capitalize text-gold-bright">
          {status.replace("_", " ")}
        </span>
        <HelpTip label="What account status means" className="ml-1">
          Paused keeps data. Pending cancel stays on the plan until the period
          ends. Deactivated hides the workspace from the team.
        </HelpTip>
      </p>
      {status !== "active" && canManage ? (
        <Button
          type="button"
          className="mt-3"
          disabled={busy}
          onClick={() => void resume()}
        >
          Resume workspace
        </Button>
      ) : null}
      <ul className="mt-4 space-y-2">
        {ACTIONS.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted">{item.description}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={!canManage || busy}
              onClick={() =>
                item.id === "downgrade"
                  ? window.location.assign("/billing")
                  : setOpen(item.id)
              }
            >
              {item.id === "downgrade" ? "Compare plans" : "Review options"}
            </Button>
          </li>
        ))}
      </ul>
      {!canManage ? (
        <p className="mt-3 text-xs text-muted">
          Ask an owner or admin if you need to pause or close this workspace.
        </p>
      ) : null}
      {message ? <p className="mt-3 text-xs text-muted">{message}</p> : null}
      {open && payload ? (
        <RetentionDialog
          action={open}
          title={ACTIONS.find((item) => item.id === open)?.label ?? "Continue"}
          lossCopy={payload.lossCopy[open]}
          alternatives={payload.alternatives[open]}
          busy={busy}
          onClose={() => setOpen(null)}
          onConfirm={(reason, alternative) =>
            void apply(open, reason, alternative)
          }
        />
      ) : null}
    </Panel>
  );
}
