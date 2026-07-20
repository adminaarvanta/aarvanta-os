"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Workflow } from "@/types/workflow";

type Template = Omit<
  Workflow,
  "id" | "createdAt" | "updatedAt" | "tenantId" | "workspaceId" | "companyId"
>;

export function WorkflowTemplatesGallery({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function install(templateId: string) {
    setBusyId(templateId);
    setError(null);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = (await res.json()) as {
        workflow?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.workflow) {
        setError(typeof data.error === "string" ? data.error : "Install failed");
        return;
      }
      router.push(`/workflows/${data.workflow.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Template gallery</h3>
        <p className="mt-1 text-xs text-muted">
          One-click install like Zapier — then customize the trigger and steps.
        </p>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <li
            key={template.templateId ?? template.name}
            className="flex flex-col rounded-xl border border-border bg-surface-elevated p-5"
          >
            <div className="mb-3 flex items-start gap-2">
              <LayoutTemplate className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="font-semibold text-foreground">{template.name}</p>
                {template.description && (
                  <p className="mt-1 text-xs text-muted">{template.description}</p>
                )}
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-1">
              <Badge className="bg-surface-muted text-muted ring-border">
                {template.trigger.label}
              </Badge>
              <Badge className="bg-surface-muted text-muted ring-border">
                {template.steps.length} steps
              </Badge>
              {template.tags.map((tag) => (
                <Badge key={tag} className="bg-surface-muted text-muted ring-border">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-auto"
              disabled={busyId !== null}
              onClick={() => void install(template.templateId ?? "")}
            >
              {busyId === template.templateId ? "Installing…" : "Use template"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
