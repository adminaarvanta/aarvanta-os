"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { trackClient } from "@/lib/analytics/track-client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root]", error);
    trackClient("core_error", { path: "/", module: "root", outcome: "error" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <h2 className="text-lg font-semibold">We could not load this page</h2>
      <p className="max-w-md text-sm text-muted">
        Try again. If it keeps happening, go home — your account is safe.
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
    </div>
  );
}
