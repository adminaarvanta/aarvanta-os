"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
    void fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "core_error", module: "app" }),
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted">
          Your data is still in the workspace. Try again, or return home.
        </p>
        <div className="flex gap-2">
          <Button type="button" onClick={reset}>
            Try again
          </Button>
          <Button href="/" variant="secondary">
            Home
          </Button>
        </div>
      </body>
    </html>
  );
}
