"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const MEETING_SOURCES = ["zoom", "teams", "manual"] as const;

export function MeetingsClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [source, setSource] = useState<(typeof MEETING_SOURCES)[number]>("zoom");
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !transcript.trim()) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          source,
          transcript: transcript.trim(),
        }),
      });

      if (!res.ok) {
        setError("Could not upload meeting record.");
        return;
      }

      setTitle("");
      setTranscript("");
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
      <p className="text-sm font-medium text-[#FFFFFF]">Upload transcript</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-[#9AABC4]">
          Meeting title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Q3 planning sync"
            className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
          />
        </label>
        <label className="space-y-1 text-xs text-[#9AABC4]">
          Source
          <select
            value={source}
            onChange={(event) =>
              setSource(event.target.value as (typeof MEETING_SOURCES)[number])
            }
            className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
          >
            {MEETING_SOURCES.map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="space-y-1 text-xs text-[#9AABC4]">
        Transcript
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={4}
          placeholder="Paste transcript here..."
          className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Uploading..." : "Create meeting record"}
        </Button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </form>
  );
}
