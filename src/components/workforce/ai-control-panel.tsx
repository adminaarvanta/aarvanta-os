"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Switch } from "@/components/ui/form";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import {
  autonomyLabel,
  DEFAULT_AGENT_AUTONOMY,
} from "@/lib/workforce/ai-control-policy";
import type { AgentAutonomy, AgentControlState, AgentType } from "@/types/workforce";

const AUTONOMY_OPTIONS: AgentAutonomy[] = [
  "observe",
  "recommend",
  "draft",
  "approval_required",
  "automatic",
];

export function AiControlPanel() {
  const [aiPaused, setAiPaused] = useState(false);
  const [controls, setControls] = useState<
    Partial<Record<AgentType, AgentControlState>>
  >({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return;
      const data = (await res.json()) as {
        settings?: {
          aiPaused?: boolean;
          agentControls?: Partial<Record<AgentType, AgentControlState>>;
        };
      };
      setAiPaused(Boolean(data.settings?.aiPaused));
      setControls(data.settings?.agentControls ?? {});
    })();
  }, []);

  async function save(patch: {
    aiPaused?: boolean;
    agentControls?: Partial<Record<AgentType, AgentControlState>>;
  }) {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(data.error?.message ?? "Could not save AI controls.");
        return;
      }
      if (patch.aiPaused !== undefined) setAiPaused(patch.aiPaused);
      if (patch.agentControls) setControls(patch.agentControls);
      setSaved("Saved. Execution paths now honour this setting.");
    } catch {
      setError("Network error. Your previous setting is unchanged.");
    } finally {
      setBusy(false);
    }
  }

  function controlFor(type: AgentType): AgentControlState {
    return (
      controls[type] ?? {
        status: "active",
        autonomy: DEFAULT_AGENT_AUTONOMY[type],
      }
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Kill switch</h3>
          <p className="text-xs text-muted">
            Pause stops scheduled and external AI actions immediately. The
            product will not claim they are stopped unless this is on.
          </p>
        </div>
        <Switch
          label="Pause all AI actions"
          checked={aiPaused}
          disabled={busy}
          onCheckedChange={(next) => void save({ aiPaused: next })}
        />
      </div>
      {aiPaused ? (
        <Alert tone="warning" title="Workspace AI is paused">
          Agents can still draft recommendations in the UI, but they cannot
          execute until you turn this off.
        </Alert>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-foreground">Autonomy</h3>
        <p className="mt-1 text-xs text-muted">
          High-impact actions (money, outbound messages, permissions, deletion)
          never run as Automatic unless you explicitly set that agent to
          Automatic.
        </p>
      </div>

      <ul className="divide-y divide-border">
        {AGENT_DEFINITIONS.map((agent) => {
          const current = controlFor(agent.type);
          return (
            <li
              key={agent.type}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{agent.name}</p>
                <p className="text-xs text-muted">{agent.primaryFunction}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`${agent.name} autonomy`}
                  className="h-9 rounded-lg border border-border px-2 text-xs"
                  value={current.autonomy}
                  disabled={busy}
                  onChange={(e) => {
                    const next = {
                      ...controls,
                      [agent.type]: {
                        ...current,
                        autonomy: e.target.value as AgentAutonomy,
                      },
                    };
                    void save({ agentControls: next });
                  }}
                >
                  {AUTONOMY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {autonomyLabel(option)}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant={current.status === "paused" ? "primary" : "secondary"}
                  disabled={busy}
                  onClick={() => {
                    const next = {
                      ...controls,
                      [agent.type]: {
                        ...current,
                        status:
                          current.status === "paused" ? "active" : "paused",
                      },
                    };
                    void save({ agentControls: next });
                  }}
                >
                  {current.status === "paused" ? "Resume" : "Pause"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {saved ? <Alert tone="success">{saved}</Alert> : null}
    </div>
  );
}
