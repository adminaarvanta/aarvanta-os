"use client";

import { useEffect } from "react";

export function MarkReadOnView({ conversationId }: { conversationId: string }) {
  useEffect(() => {
    let cancelled = false;

    async function markRead() {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
      });
    }

    if (!cancelled) {
      void markRead();
    }

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  return null;
}
