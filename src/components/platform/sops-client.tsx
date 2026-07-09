"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SopsClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !question.trim()) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          question: question.trim(),
          content: content.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setError("Could not create SOP.");
        return;
      }

      setTitle("");
      setQuestion("");
      setContent("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-[#243656] bg-[#0D1524] p-4"
    >
      <p className="text-sm font-medium text-[#FFFFFF]">Create SOP</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-[#9AABC4]">
          SOP title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Incident response SOP"
            className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
          />
        </label>
        <label className="space-y-1 text-xs text-[#9AABC4]">
          Trigger question
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="How should incidents be handled?"
            className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
          />
        </label>
      </div>
      <label className="space-y-1 text-xs text-[#9AABC4]">
        Optional content
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder="Add SOP details..."
          className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Creating..." : "Create SOP"}
        </Button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </form>
  );
}
