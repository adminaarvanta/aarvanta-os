export async function setPrimaryVoiceAgent(agentId: string): Promise<void> {
  const res = await fetch("/api/voice/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voicePrimaryAgentId: agentId }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: { message?: string } | string };
    const message =
      typeof data.error === "string"
        ? data.error
        : data.error?.message ?? "Could not set primary agent";
    throw new Error(message);
  }
}
