"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[os]", error);
    void fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "core_error", module: "os" }),
    });
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-lg font-semibold">This screen failed to load</h2>
      <p className="max-w-md text-sm text-muted">
        This is usually temporary. Records already saved are still there.
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button href="/dashboard" variant="secondary">
          Today
        </Button>
      </div>
    </div>
  );
}
