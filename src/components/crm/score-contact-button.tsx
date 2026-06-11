"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScoreContactButton({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleScore() {
    setLoading(true);
    try {
      await fetch(`/api/contacts/${contactId}/score`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleScore}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 bg-[#D4AF37] text-black hover:bg-[#F9E076] sm:w-auto"
    >
      <Sparkles className="h-4 w-4" />
      {loading ? "Scoring…" : "AI lead score"}
    </Button>
  );
}
