"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteEntityButton({
  entity,
  id,
  label,
  redirectTo,
  size = "sm",
}: {
  entity: "contacts" | "companies" | "deals" | "tasks" | "pipelines";
  id: string;
  label?: string;
  redirectTo?: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    const noun = label ?? entity.replace(/s$/, "");
    if (!window.confirm(`Delete this ${noun}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/${entity}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        window.alert(typeof data.error === "string" ? data.error : "Delete failed");
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant="ghost"
      onClick={() => void onDelete()}
      disabled={busy}
      className="text-danger hover:bg-danger/10 hover:text-danger"
    >
      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
      {busy ? "Deleting…" : "Delete"}
    </Button>
  );
}
