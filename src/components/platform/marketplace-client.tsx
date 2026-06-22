"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type MarketplaceClientProps = {
  catalog: {
    id: string;
    name: string;
    author: string;
    category: string;
    description: string;
    installs: number;
    rating: number;
    price: "free" | "paid";
  }[];
  installedIds: string[];
};

export function MarketplaceClient({ catalog, installedIds }: MarketplaceClientProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const installedSet = new Set(installedIds);

  async function install(marketplaceId: string) {
    setBusyId(marketplaceId);
    setError(null);
    try {
      const res = await fetch("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplaceId }),
      });
      if (!res.ok) {
        setError("Could not install selected agent.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {catalog.map((agent) => {
          const isInstalled = installedSet.has(agent.id);
          const isBusy = busyId === agent.id;
          return (
            <li
              key={agent.id}
              className="space-y-3 rounded-xl border border-[#3d3528] bg-[#101010] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[#F5E6C8]">{agent.name}</p>
                  <p className="text-xs text-[#A89878]">
                    {agent.author} · {agent.category}
                  </p>
                </div>
                <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] text-[#F9E076] ring-1 ring-[#D4AF37]/30">
                  {agent.price}
                </span>
              </div>
              <p className="text-sm text-[#A89878]">{agent.description}</p>
              <p className="text-[10px] text-[#A89878]/80">
                {agent.installs.toLocaleString()} installs · {agent.rating.toFixed(1)} rating
              </p>
              <Button
                type="button"
                size="sm"
                variant={isInstalled ? "secondary" : "primary"}
                disabled={isInstalled || isBusy}
                onClick={() => install(agent.id)}
              >
                {isInstalled ? "Installed" : isBusy ? "Installing..." : "Install"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
