"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Organization, Workspace } from "@/types/tenant";

export function WorkspaceSwitcher({
  organization,
  workspace,
  workspaces,
}: {
  organization: Organization | null;
  workspace: Workspace | null;
  workspaces: Workspace[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function switchTo(workspaceId: string) {
    if (workspaceId === workspace?.id) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tenant/switch-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!organization || !workspace) return null;

  return (
    <div className="relative px-3 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[#1a1714] disabled:opacity-60"
      >
        <Building2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-[#F5E6C8]">
            {organization.name}
          </p>
          <p className="truncate text-[10px] text-[#A89878]">{workspace.name}</p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[#A89878] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-[#3d3528] bg-[#0a0a0a] py-1 shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[#A89878]">
            Workspaces
          </p>
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => switchTo(ws.id)}
              className={cn(
                "flex w-full px-3 py-2 text-left text-sm hover:bg-[#1a1714]",
                ws.id === workspace.id
                  ? "text-[#F9E076]"
                  : "text-[#A89878]"
              )}
            >
              {ws.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
