"use client";

import { GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useId, useState } from "react";
import {
  CrmField,
  CrmFormActions,
  CrmFormBody,
  CrmFormDialog,
  crmInputClass,
} from "@/components/crm/crm-form";
import { Button } from "@/components/ui/button";

const DEFAULT_STAGES = "New, Qualified, Proposal, Negotiation, Won";

export function CreatePipelineForm() {
  const router = useRouter();
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [stagesText, setStagesText] = useState(DEFAULT_STAGES);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setError(null);
  }, [busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const stageNames = stagesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const stages = stageNames.map((stageName, i) => ({
        name: stageName,
        order: i,
        probability: Math.min(100, Math.round(((i + 1) / stageNames.length) * 100)),
      }));
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), stages }),
      });
      if (!res.ok) {
        setError("Could not create that pipeline. Try again.");
        return;
      }
      const data = (await res.json()) as { pipeline?: { id: string } };
      setName("");
      setStagesText(DEFAULT_STAGES);
      setOpen(false);
      if (data.pipeline?.id) {
        router.push(`/crm/sales?pipeline=${data.pipeline.id}`);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="border-[#2f7f92]/25 bg-sky-500/[0.07] text-[#1a2f59] hover:border-[#2f7f92]/45 hover:bg-sky-500/[0.12]"
        onClick={() => setOpen(true)}
      >
        <GitBranch className="mr-1.5 h-3.5 w-3.5" />
        Add pipeline
      </Button>
      <CrmFormDialog
        open={open}
        title="New pipeline"
        description="Name the board and list stages in the order deals should move."
        icon={GitBranch}
        onClose={close}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <CrmFormBody>
            <CrmField label="Pipeline name" htmlFor={`${ids}-name`} required>
              <input
                id={`${ids}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enterprise sales"
                required
                className={crmInputClass}
              />
            </CrmField>
            <CrmField
              label="Stages"
              htmlFor={`${ids}-stages`}
              hint="Comma-separated, in order. Probabilities are set automatically."
            >
              <input
                id={`${ids}-stages`}
                value={stagesText}
                onChange={(e) => setStagesText(e.target.value)}
                className={crmInputClass}
              />
            </CrmField>
            {error ? (
              <p className="rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </CrmFormBody>
          <CrmFormActions
            busy={busy}
            onCancel={close}
            submitLabel="Create pipeline"
          />
        </form>
      </CrmFormDialog>
    </>
  );
}
