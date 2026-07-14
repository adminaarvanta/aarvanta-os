"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const DRAFT_TYPES = ["proposal", "email", "blog", "linkedin", "sop", "meeting_notes"] as const;

export function WritingClient() {
  const router = useRouter();
  const [type, setType] = useState<(typeof DRAFT_TYPES)[number]>("proposal");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !prompt.trim()) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          prompt: prompt.trim(),
          content: content.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setError("Could not create draft. Please try again.");
        return;
      }

      setTitle("");
      setPrompt("");
      setContent("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-border bg-surface-elevated p-4"
    >
      <p className="text-sm font-medium text-foreground">Create draft</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted">
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as (typeof DRAFT_TYPES)[number])}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {DRAFT_TYPES.map((draftType) => (
              <option key={draftType} value={draftType}>
                {draftType.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Quarterly launch proposal"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>
      <label className="space-y-1 text-xs text-muted">
        Prompt
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          placeholder="What should this draft achieve?"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>
      <label className="space-y-1 text-xs text-muted">
        Optional starter content
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder="Optional content..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Creating..." : "Create draft"}
        </Button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </form>
  );
}
