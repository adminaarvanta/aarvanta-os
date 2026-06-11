"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function MarkReadOnView({ conversationId }: { conversationId: string }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function markRead() {
      const response = await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
      });
      if (!cancelled && response.ok) {
        router.refresh();
      }
    }

    void markRead();
    const interval = window.setInterval(markRead, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [conversationId, router]);

  return null;
}
