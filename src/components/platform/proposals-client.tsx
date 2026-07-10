"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ProposalsClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !clientName.trim()) return;

    setBusy(true);
    setError(null);
    try {
      const numericValue = Number(value);
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          clientName: clientName.trim(),
          value: Number.isFinite(numericValue) ? Math.max(0, numericValue) : undefined,
          currency: currency.trim() || undefined,
          content: content.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setError("Could not create proposal.");
        return;
      }

      setTitle("");
      setClientName("");
      setValue("");
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
      <p className="text-sm font-medium text-[#FFFFFF]">Create proposal</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-[#9AABC4]">
          Proposal title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Expansion proposal"
            className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
          />
        </label>
        <label className="space-y-1 text-xs text-[#9AABC4]">
          Client name
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="Meridian Health"
            className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-[#9AABC4]">
          Value
          <input
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="25000"
            className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
          />
        </label>
        <label className="space-y-1 text-xs text-[#9AABC4]">
          Currency
          <input
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            placeholder="GBP"
            className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
          />
        </label>
      </div>
      <label className="space-y-1 text-xs text-[#9AABC4]">
        Content
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder="Proposal summary..."
          className="w-full rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF]"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Creating..." : "Create proposal"}
        </Button>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </div>
    </form>
  );
}
